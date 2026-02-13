import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permission-guard";
import { PermissionId } from "@/lib/auth/permission-codes";
import { createAuditLog } from "@/lib/audit";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requirePermission(req, PermissionId.AUDIT_VIEW);
        const tenantId = admin.tenantId;

        const { id } = await params;
        const sessionId = parseInt(id);

        if (isNaN(sessionId)) {
            return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
        }

        // Verify session belongs to the admin's tenant
        const session = await prisma.refreshToken.findFirst({
            where: {
                id: sessionId,
                user: {
                    tenantId: tenantId
                }
            }
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Revoke the session & Audit Log in transaction
        await prisma.$transaction(async (tx) => {
            await tx.refreshToken.update({
                where: { id: sessionId },
                data: {
                    revokedAt: new Date(),
                    revokedByIp: req.headers.get("x-forwarded-for") || "unknown"
                }
            });

            await createAuditLog({
                tenantId: tenantId,
                actorUserId: admin.sub,
                targetUserId: session.userId,
                action: "SESSION_REVOKED_BY_ADMIN",
                details: `Session ${sessionId} (IP: ${session.ipAddress}) revoked by administrator.`,
                ipAddress: req.headers.get("x-forwarded-for") || "unknown"
            }, tx);
        });

        return NextResponse.json({ message: "Session revoked" });

    } catch (error) {
        if (error instanceof Response) return error;
        console.error("[SESSION_DELETE]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

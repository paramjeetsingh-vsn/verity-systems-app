import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permission-guard";
import { PermissionId } from "@/lib/auth/permission-codes";

export async function GET(req: Request) {
    try {
        const admin = await requirePermission(req, PermissionId.AUDIT_VIEW);
        const tenantId = admin.tenantId;

        // Fetch all non-revoked, non-expired refresh tokens for the tenant
        const sessions = await prisma.refreshToken.findMany({
            where: {
                user: {
                    tenantId: tenantId
                },
                revokedAt: null,
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            },
            orderBy: {
                lastActiveAt: 'desc'
            }
        });

        const formattedSessions = sessions.map(s => ({
            id: s.id,
            userId: s.userId,
            userEmail: s.user.email,
            userName: s.user.fullName,
            deviceInfo: s.deviceInfo,
            ipAddress: s.ipAddress,
            lastActiveAt: s.lastActiveAt,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            mfaVerified: s.mfaVerified
        }));

        return NextResponse.json({ sessions: formattedSessions });

    } catch (error) {
        if (error instanceof Response) return error;
        console.error("[SESSIONS_GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

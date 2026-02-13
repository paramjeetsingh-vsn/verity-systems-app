import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permission-guard";
import { PermissionId } from "@/lib/auth/permission-codes";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {

        const admin = await requirePermission(req, PermissionId.USER_VIEW);
        const adminId = admin.sub;
        const tenantId = admin.tenantId;

        const { id: targetUserIdStr } = await params;
        const targetUserId = parseInt(targetUserIdStr);

        if (isNaN(targetUserId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }


        // 2. Tenant Check
        const targetUser = await prisma.user.findFirst({
            where: { id: targetUserId, tenantId }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 3. Fetch Sessions
        const sessions = await prisma.refreshToken.findMany({
            where: { userId: targetUserId },
            select: {
                id: true,
                deviceInfo: true,
                ipAddress: true,
                lastActiveAt: true,
                createdAt: true,
                expiresAt: true,
                revokedAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 20 // Limit to recent 20
        });

        const formattedSessions = sessions.map(s => ({
            ...s,
            status: s.revokedAt ? 'REVOKED' : (new Date(s.expiresAt) < new Date() ? 'EXPIRED' : 'ACTIVE')
        }));

        return NextResponse.json({ sessions: formattedSessions });

    } catch (error) {
        if (error instanceof Response) return error;
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

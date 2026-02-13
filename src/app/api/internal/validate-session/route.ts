import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        // 1. Internal Security Check
        const secret = req.headers.get("x-internal-secret");
        if (secret !== process.env.INTERNAL_API_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sid } = await req.json();

        if (!sid) {
            return NextResponse.json({ valid: false, reason: "No SID provided" });
        }

        // 2. Check Database
        const session = await prisma.refreshToken.findUnique({
            where: { id: sid },
            select: {
                revokedAt: true,
                expiresAt: true,
                user: {
                    select: {
                        isActive: true
                    }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ valid: false, reason: "Session not found" });
        }

        if (session.revokedAt) {
            return NextResponse.json({ valid: false, reason: "Session revoked" });
        }

        if (new Date(session.expiresAt) < new Date()) {
            return NextResponse.json({ valid: false, reason: "Session expired" });
        }

        if (!session.user.isActive) {
            return NextResponse.json({ valid: false, reason: "User deactivated" });
        }

        return NextResponse.json({ valid: true });

    } catch (error) {
        console.error("[INTERNAL_VALIDATE_SESSION]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

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
            console.warn(`[INTERNAL_VALIDATE_SESSION] No SID provided in request`)
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
            // 🕒 RACE CONDITION GRACE PERIOD
            // If the session was revoked very recently (e.g. < 30s) AND it was replaced,
            // we allow it for the middleware transition period.
            const GRACE_PERIOD_MS = 30 * 1000;
            const revokedTime = new Date(session.revokedAt).getTime();
            const now = Date.now();

            if (now - revokedTime < GRACE_PERIOD_MS) {
                // console.log(`[INTERNAL_VALIDATE_SESSION] Session ${sid} is REVOKED but within grace period.`)
                return NextResponse.json({ valid: true, grace: true });
            }

            return NextResponse.json({ valid: false, reason: "Session revoked" });
        }

        if (new Date(session.expiresAt) < new Date()) {
            return NextResponse.json({ valid: false, reason: "Session expired" });
        }

        if (!session.user.isActive) {
            console.warn(`[INTERNAL_VALIDATE_SESSION] User deactivated for session ${sid}`)
            return NextResponse.json({ valid: false, reason: "User deactivated" });
        }

        // console.log(`[INTERNAL_VALIDATE_SESSION] Session ${sid} is VALID`)
        return NextResponse.json({ valid: true });

    } catch (error) {
        console.error("[INTERNAL_VALIDATE_SESSION]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

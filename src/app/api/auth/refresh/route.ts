import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { signJwt } from "@/lib/auth/jwt"
import { generateRefreshToken } from "@/lib/auth/refresh-token"
import { getUserPermissions } from "@/lib/auth/permission"

const ACCESS_TOKEN_EXP = "15m"
const REFRESH_TOKEN_DAYS = 7

export async function POST(req: Request) {
    let refreshToken

    try {
        const body = await req.json()
        refreshToken = body.refreshToken
    } catch {
        return NextResponse.json(
            { message: "Refresh token required" },
            { status: 400 }
        )
    }

    if (!refreshToken) {
        return NextResponse.json(
            { message: "Refresh token required" },
            { status: 400 }
        )
    }

    const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex")

    const record = await prisma.refreshToken.findFirst({
        where: {
            tokenHash,
            // revokedAt: null, // Allow finding revoked tokens to check grace period
            expiresAt: { gt: new Date() }
        },
        include: {
            user: {
                include: {
                    userRoles: {
                        include: { role: true }
                    }
                }
            }
        }
    })

    if (!record) {
        return NextResponse.json(
            { message: "Invalid refresh token" },
            { status: 401 }
        )
    }

    // Reuse Detection with Grace Period (30s)
    let isReusing = false;
    if (record.revokedAt) {
        const timeSinceRevocation = Date.now() - new Date(record.revokedAt).getTime();
        const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds

        if (timeSinceRevocation > GRACE_PERIOD_MS) {
            console.warn(`[AUTH_REFRESH] Token reuse detected OUTSIDE grace period. User: ${record.userId}`);
            // Potential theft - strictly deny
            return NextResponse.json(
                { message: "Refresh token reused/invalid" },
                { status: 401 }
            )
        }

        console.log(`[AUTH_REFRESH] Token reuse detected WITHIN grace period (${timeSinceRevocation}ms). User: ${record.userId}`);
        isReusing = true;
    }

    // 🔁 Revoke OLD refresh token (Only if not already revoked)
    const { token: newRefreshToken, hash: newHash } =
        generateRefreshToken()

    if (!isReusing) {
        await prisma.refreshToken.update({
            where: { id: record.id },
            data: {
                revokedAt: new Date(),
                replacedByToken: newHash
            }
        })
    }
    // Else: It was already revoked, so we preserve the original revocation reason/time.
    // We strictly fork the chain here by issuing a new token that points back to the user/session.

    // 🔁 Generate NEW refresh token
    const newRecord = await prisma.refreshToken.create({
        data: {
            userId: record.userId,
            tokenHash: newHash,
            mfaVerified: record.mfaVerified,
            deviceInfo: record.deviceInfo,
            ipAddress: record.ipAddress,
            lastActiveAt: new Date(), // Update activity
            expiresAt: new Date(
                Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
            )
        }
    })

    const roles = record.user.userRoles.map((ur) => ur.role.name)
    const roleIds = record.user.userRoles.map((ur) => ur.role.id)
    const { ids: permissionIds, codes: permissions } = await getUserPermissions(record.user.id, record.user.tenantId)

    // 🔁 New access token
    const payload: any = {
        sub: record.user.id,
        tenantId: record.user.tenantId,
        email: record.user.email,
        roles,
        roleIds,
        permissions,
        permissionIds,
        mfaEnabled: record.user.mfaEnabled,
        sid: newRecord.id // Session ID
    };

    if (record.mfaVerified) {
        payload.amr = ["pwd", "mfa"];
    } else {
        payload.amr = ["pwd"];
    }

    const newAccessToken = signJwt(
        payload,
        { expiresIn: ACCESS_TOKEN_EXP }
    )

    // 🔁 Response
    const response = NextResponse.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
        user: {
            id: record.user.id,
            fullName: record.user.fullName,
            email: record.user.email,
            roles,
            roleIds,
            permissions,
            permissionIds,
            mfaEnabled: record.user.mfaEnabled
        }
    })

    const host = req.headers.get("host") || "";
    const isLocal = host.includes("localhost") ||
        host.includes("127.0.0.1") ||
        host.includes("::1") ||
        /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]+)?$/.test(host);

    const secure = process.env.NODE_ENV === "production" && !isLocal;
    // console.log(`[AUTH_REFRESH] Host: ${host} | isLocal: ${isLocal} | Secure: ${secure}`);

    const cookieOptions = {
        httpOnly: true,
        secure,
        sameSite: "lax" as const,
        path: "/",
        maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60
    }

    response.cookies.set("accessToken", newAccessToken, {
        ...cookieOptions,
        maxAge: 15 * 60
    })

    response.cookies.set("refreshToken", newRefreshToken, cookieOptions)

    return response
}

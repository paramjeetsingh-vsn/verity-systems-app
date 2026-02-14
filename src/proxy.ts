import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { PRIVILEGED_AREAS } from "./lib/security/privileged-areas"

/**
 * Simple JWT decoder for Middleware (Safe for Edge Runtime)
 */
function parseJwt(token: string) {
    try {
        const base64Url = token.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(function (c) {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                })
                .join("")
        )
        return JSON.parse(jsonPayload)
    } catch (e) {
        return null
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const host = request.headers.get("host")
    const cookies = request.cookies.getAll().map(c => c.name)

    // console.log(`[MIDDLEWARE] Handling ${pathname} | Host: ${host} | Cookies: ${JSON.stringify(cookies)}`)
    console.log(`[MIDDLEWARE] Path: ${pathname} | Host: ${host} | Cookies: ${cookies.join(", ")}`)

    // 1️⃣ Find if the path belongs to a privileged area
    const matchingAreaKey = Object.keys(PRIVILEGED_AREAS).find(key =>
        pathname.startsWith(PRIVILEGED_AREAS[key].path)
    )

    if (matchingAreaKey) {
        const area = PRIVILEGED_AREAS[matchingAreaKey]
        let accessToken = request.cookies.get("accessToken")?.value

        // Also check Authorization header (for API clients)
        if (!accessToken) {
            const authHeader = request.headers.get("authorization")
            if (authHeader?.startsWith("Bearer ")) {
                accessToken = authHeader.substring(7)
            }
        }

        // 2️⃣ Authenticate
        if (!accessToken) {
            console.warn(`[MIDDLEWARE] Unauthorized: No accessToken cookie found for path ${pathname}`)
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ message: "Authentication required" }, { status: 401 })
            }
            return NextResponse.redirect(new URL("/login", request.url))
        }

        const payload = parseJwt(accessToken)
        if (!payload) {
            console.warn(`[MIDDLEWARE] Unauthorized: Failed to parse JWT payload for path ${pathname}`)
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ message: "Invalid token" }, { status: 401 })
            }
            return NextResponse.redirect(new URL("/login", request.url))
        }

        // console.log(`[MIDDLEWARE] Authenticated: sub=${payload.sub}, sid=${payload.sid}, exp=${new Date(payload.exp * 1000).toISOString()}`)
        console.log(`[MIDDLEWARE] JWT Payload Found: sub=${payload.sub}, sid=${payload.sid}`)

        // ⚡ Session Validation (Instant Revocation)
        if (payload.sid) {
            try {
                const origin = request.nextUrl.origin
                const validationRes = await fetch(`${origin}/api/internal/validate-session`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-internal-secret": process.env.INTERNAL_API_SECRET || ""
                    },
                    body: JSON.stringify({ sid: payload.sid })
                })

                if (validationRes.ok) {
                    const validation = await validationRes.json()
                    if (!validation.valid) {
                        console.warn(`[MIDDLEWARE] Session ${payload.sid} invalid: ${validation.reason}`)
                        if (pathname.startsWith('/api/')) {
                            const response = NextResponse.json({ message: `Session invalid: ${validation.reason}` }, { status: 401 })
                            response.cookies.delete("accessToken")
                            response.cookies.delete("refreshToken")
                            return response
                        }
                        const response = NextResponse.redirect(new URL("/login", request.url))
                        response.cookies.delete("accessToken")
                        response.cookies.delete("refreshToken")
                        return response
                    }
                }
            } catch (err) {
                console.error("Session validation fetch error:", err)
                // Fail open or closed? Usually fail open for auth token availability if it's technically valid, 
                // but here it's better to log and continue if the internal API is down, 
                // as requireAuth in the API will still check.
            }
        }

        // 3️⃣ Authorize
        let isAuthorized = false

        // Role-based check
        if (area.requiredRoles) {
            isAuthorized = area.requiredRoles.some(role => {
                if (typeof role === 'number') {
                    return payload.roleIds?.includes(role)
                }
                return payload.roles?.includes(role)
            })
        }

        // Permission-based check (if not already authorized by role)
        if (!isAuthorized && area.requiredPermissions) {
            isAuthorized = area.requiredPermissions.some(perm => {
                if (typeof perm === 'number') {
                    return payload.permissionIds?.includes(perm) || payload.permissionIds?.includes(String(perm))
                }
                return payload.permissions?.includes(perm) || (payload.permissionIds && payload.permissionIds.includes(parseInt(perm)))
            })
        }

        // 4️⃣ Handle Unauthorized
        if (!isAuthorized) {
            console.warn(`[MIDDLEWARE] Access denied to ${pathname} for user ${payload.sub}. 
                Required Roles: ${JSON.stringify(area.requiredRoles)} 
                Required Perms: ${JSON.stringify(area.requiredPermissions)}
                User Roles: ${JSON.stringify(payload.roles)}
                User Perms: ${JSON.stringify(payload.permissionIds)}`)
            try {
                const origin = request.nextUrl.origin
                // Fire-and-forget security alert
                fetch(`${origin}/api/internal/security-alert`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-internal-secret": process.env.INTERNAL_API_SECRET || ""
                    },
                    body: JSON.stringify({
                        userId: payload.sub || 0,
                        tenantId: payload.tenantId || 0,
                        action: "UNAUTHORIZED_ACCESS_ATTEMPT", // Generalized identifier
                        details: JSON.stringify({
                            path: pathname,
                            alertCode: area.alertCode
                        }),
                        ipAddress: request.headers.get("x-forwarded-for") || "unknown"
                    })
                }).catch(err => console.error("Middleware alert fetch error:", err))
            } catch (err) {
                console.error("Failed to trigger security alert from middleware:", err)
            }

            // Redirect to dashboard (Avoid loops or direct 403 for better UX)
            console.log(`[MIDDLEWARE] Access denied for ${pathname}. Redirecting/Blocking.`)
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 })
            }
            return NextResponse.redirect(new URL("/dashboard", request.url))
        }
    }

    return NextResponse.next()
}

// Optimization: Match all domains declared in PASS
// Note: matcher must be static strings, so we can't easily generate it from PRIVILEGED_AREAS keys
// but we can list the known prefixes.
export const config = {
    matcher: ["/admin", "/admin/:path*", "/billing/:path*", "/compliance/:path*", "/exports/:path*", "/api/admin/:path*"]
}

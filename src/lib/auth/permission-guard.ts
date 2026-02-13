import { requireAuth } from "./auth-guard"
import { getUserPermissions } from "./permission"

export async function requirePermission(
    req: Request,
    permission: string | number
) {
    const user = await requireAuth(req)
    const { ids, codes } = await getUserPermissions(user.sub, user.tenantId)

    const hasPermission = typeof permission === 'number'
        ? ids.includes(permission)
        : codes.includes(permission)

    if (!hasPermission) {
        throw new Response(
            JSON.stringify({ message: "Forbidden" }),
            { status: 403 }
        )
    }

    return user
}

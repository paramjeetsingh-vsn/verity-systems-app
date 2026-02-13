import { prisma } from "@/lib/prisma"

export async function getUserPermissions(userId: number, tenantId: number) {
    const roles = await prisma.userRole.findMany({
        where: {
            userId,
            user: { tenantId: tenantId }  // Explicit tenant scoping
        },
        include: {
            role: {
                include: {
                    rolePermissions: {
                        include: { permission: true }
                    }
                }
            }
        }
    })

    const permissionMap = new Map<number, string>()

    roles.forEach(r => {
        r.role.rolePermissions.forEach(rp => {
            permissionMap.set(rp.permission.id, rp.permission.code)
        })
    })

    return {
        ids: Array.from(permissionMap.keys()),
        codes: Array.from(permissionMap.values())
    }
}

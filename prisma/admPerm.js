console.log('Assigning permissions to admin role...')
const allPermissions = await prisma.permission.findMany()
for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
        where: {
            roleId_permissionId: {
                roleId: adminRole.id,
                permissionId: permission.id,
            },
        },
        update: {},
        create: {
            roleId: adminRole.id,
            permissionId: permission.id,
        },
    })
}
console.log(`✅ Assigned ${allPermissions.length} permissions to Admin role`)

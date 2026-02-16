
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Adding DMS_DOCUMENT_TYPE_MANAGE permission...');

    const permission = await prisma.permission.upsert({
        where: { id: 37 },
        update: {
            code: 'DMS_DOCUMENT_TYPE_MANAGE',
            description: 'Manage document types (CRUD)',
        },
        create: {
            id: 37,
            code: 'DMS_DOCUMENT_TYPE_MANAGE',
            description: 'Manage document types (CRUD)',
        },
    });

    console.log(`Permission created/updated: ${permission.code}`);

    const roles = await prisma.role.findMany({
        where: { name: 'Admin' }
    });

    for (const role of roles) {
        console.log(`Assigning to role: ${role.name} (ID: ${role.id}, Tenant: ${role.tenantId})`);

        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: role.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: role.id,
                permissionId: permission.id,
            },
        });
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

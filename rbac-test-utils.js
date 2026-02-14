
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        include: {
            userRoles: {
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    console.log('--- Current Users & Roles ---')
    users.forEach(u => {
        console.log(`User: ${u.email} (ID: ${u.id}, Tenant: ${u.tenantId}, Active: ${u.isActive})`)
        u.userRoles.forEach(ur => {
            const perms = ur.role.rolePermissions.map(rp => rp.permission.code).join(', ')
            console.log(`  Role: ${ur.role.name} [Permissions: ${perms}]`)
        })
    })

    // Check if a test user exists, if not create one
    const testEmail = 'testuser@example.com'
    let testUser = users.find(u => u.email === testEmail)

    if (!testUser) {
        console.log(`\nCreating test user: ${testEmail}...`)
        // We need a tenantId, use the same as admin or 1
        const tenantId = users[0]?.tenantId || 1

        // Create a 'User' role if it doesn't exist
        let userRole = await prisma.role.findFirst({
            where: { name: 'User', tenantId }
        })

        if (!userRole) {
            userRole = await prisma.role.create({
                data: {
                    name: 'User',
                    tenantId,
                    description: 'Regular user without admin access',
                    isSystem: false,
                    requiresMfa: false,
                    isActive: true
                }
            })
        }

        testUser = await prisma.user.create({
            data: {
                email: testEmail,
                fullName: 'Test User',
                passwordHash: '$2b$10$YourHashedPasswordHere', // placeholder, bcrypt('password')
                tenantId,
                status: 'ACTIVE',
                isActive: true,
                userRoles: {
                    create: {
                        roleId: userRole.id
                    }
                }
            }
        })
        console.log(`Test user created with ID: ${testUser.id}`)
    } else {
        console.log(`\nTest user ${testEmail} already exists.`)
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())

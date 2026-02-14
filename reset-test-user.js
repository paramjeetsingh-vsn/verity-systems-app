
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash('User@123', 10)

    await prisma.user.update({
        where: {
            tenantId_email: {
                tenantId: 1,
                email: 'testuser@example.com'
            }
        },
        data: { passwordHash }
    })

    console.log('✅ testuser@example.com password updated to User@123')
}

main().catch(console.error).finally(() => prisma.$disconnect())

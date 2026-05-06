const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const accounts = await prisma.bankAccount.findMany()
  console.log("Accounts:", accounts)
}

main().finally(() => prisma.$disconnect())

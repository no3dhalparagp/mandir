const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const all = await prisma.donation.findMany({ select: { id: true, receiptNo: true, amount: true, accountId: true, collectedByMemberId: true } })
  console.log("All donations:", all)
}

main().finally(() => prisma.$disconnect())

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const all = await prisma.donation.findMany()
  const floating = all.filter(d => !d.accountId && !d.collectedByMemberId)

  console.log(`Found ${floating.length} floating donations.`)

  if (floating.length > 0) {
    let cashAccount = await prisma.bankAccount.findFirst({
      where: { accountType: "CASH_IN_HAND" }
    })

    if (!cashAccount) {
      console.log("Creating Main Cash account...")
      cashAccount = await prisma.bankAccount.create({
        data: {
          name: "Main Cash",
          accountType: "CASH_IN_HAND",
          openingBalance: 0,
        }
      })
    }

    console.log(`Found/Created Cash Account: ${cashAccount.name}. Assigning floating donations...`)

    for (const d of floating) {
      await prisma.donation.update({
        where: { id: d.id },
        data: { accountId: cashAccount.id }
      })

      await prisma.ledgerEntry.create({
        data: {
          accountId: cashAccount.id,
          type: "INCOME",
          amount: d.amount,
          description: `Donation from ${d.donorName} (${d.category}) - Auto Recovered`,
          referenceType: "DONATION",
          referenceId: d.id,
        },
      })
      console.log(`Recovered donation ${d.receiptNo}`)
    }
  }
}

main().finally(() => prisma.$disconnect())

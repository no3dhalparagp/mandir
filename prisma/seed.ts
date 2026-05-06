import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@mandir.com" },
    update: {},
    create: {
      email: "admin@mandir.com",
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  })

  console.log("Database seeded with admin user:", admin.email)

  const existingCOA = await prisma.chartOfAccount.count()
  if (existingCOA === 0) {
    console.log("Seeding Chart of Accounts...")
    const coaAccounts = [
      { code: "1000", name: "Assets", type: "ASSET" },
      { code: "1100", name: "Cash & Bank", type: "ASSET", parentCode: "1000" },
      { code: "1101", name: "Cash in Hand", type: "ASSET", parentCode: "1100" },
      { code: "1102", name: "SBI Savings Account", type: "ASSET", parentCode: "1100" },
      { code: "2000", name: "Liabilities", type: "LIABILITY" },
      { code: "3000", name: "Equity", type: "EQUITY" },
      { code: "4000", name: "Income", type: "INCOME" },
      { code: "4100", name: "Donations", type: "INCOME", parentCode: "4000" },
      { code: "4101", name: "General Donations", type: "INCOME", parentCode: "4101" },
      { code: "4102", name: "Puja Donations", type: "INCOME", parentCode: "4102" },
      { code: "5000", name: "Expenses", type: "EXPENSE" },
      { code: "5100", name: "Puja Materials", type: "EXPENSE", parentCode: "5000" },
      { code: "5200", name: "Electricity", type: "EXPENSE", parentCode: "5000" },
      { code: "5300", name: "Salary", type: "EXPENSE", parentCode: "5000" },
    ]
    const parentMap = new Map<string, string>()

    for (const acc of coaAccounts) {
      const parentId = acc.parentCode ? parentMap.get(acc.parentCode) : undefined
      const created = await prisma.chartOfAccount.create({
        data: {
          code: acc.code,
          name: acc.name,
          type: acc.type as "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE",
          parentId,
        },
      })
      parentMap.set(acc.code, created.id)
    }
    console.log("Chart of Accounts seeded!")

    const cashInHandCOA = await prisma.chartOfAccount.findFirst({ where: { code: "1101" } })
    const sbiCOA = await prisma.chartOfAccount.findFirst({ where: { code: "1102" } })

    await prisma.bankAccount.createMany({
      data: [
        {
          name: "Cash in Hand",
          accountType: "CASH_IN_HAND",
          coaId: cashInHandCOA?.id,
          openingBalance: 0,
        },
        {
          name: "SBI Savings Account",
          accountType: "SAVINGS",
          coaId: sbiCOA?.id,
          openingBalance: 0,
        }
      ]
    })
    console.log("Default bank accounts created!")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

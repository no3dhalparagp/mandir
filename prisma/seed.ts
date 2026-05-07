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
      { code: "4101", name: "General Donations", type: "INCOME", parentCode: "4100" },
      { code: "4102", name: "Puja Donations", type: "INCOME", parentCode: "4100" },
      { code: "4103", name: "Festival Donations", type: "INCOME", parentCode: "4100" },
      { code: "4104", name: "Construction Donations", type: "INCOME", parentCode: "4100" },
      { code: "4105", name: "Annadan Donations", type: "INCOME", parentCode: "4100" },
      { code: "4106", name: "Special Donations", type: "INCOME", parentCode: "4100" },
      { code: "4107", name: "Sewa Donations", type: "INCOME", parentCode: "4100" },
      { code: "4108", name: "Trust Fund Donations", type: "INCOME", parentCode: "4100" },
      { code: "5000", name: "Expenses", type: "EXPENSE" },
      { code: "5100", name: "Puja Materials", type: "EXPENSE", parentCode: "5000" },
      { code: "5200", name: "Electricity", type: "EXPENSE", parentCode: "5000" },
      { code: "5300", name: "Salary", type: "EXPENSE", parentCode: "5000" },
      { code: "5400", name: "Maintenance", type: "EXPENSE", parentCode: "5000" },
      { code: "5500", name: "Decoration", type: "EXPENSE", parentCode: "5000" },
      { code: "5600", name: "Food & Prasad", type: "EXPENSE", parentCode: "5000" },
      { code: "5700", name: "Construction Expenses", type: "EXPENSE", parentCode: "5000" },
      { code: "5800", name: "Printing", type: "EXPENSE", parentCode: "5000" },
      { code: "5900", name: "Transport", type: "EXPENSE", parentCode: "5000" },
      { code: "5999", name: "Miscellaneous", type: "EXPENSE", parentCode: "5000" },
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

    const existingBankAccounts = await prisma.bankAccount.count()
    if (existingBankAccounts === 0) {
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

  const cashInHandAccount = await prisma.bankAccount.findFirst({ where: { accountType: "CASH_IN_HAND" } })
  const sbiAccount = await prisma.bankAccount.findFirst({ where: { accountType: "SAVINGS" } })

  const existingMembers = await prisma.member.count()
  if (existingMembers === 0) {
    console.log("Seeding members...")
    await prisma.member.createMany({
      data: [
        {
          memberId: "MEM-001",
          name: "Ram Sharan",
          designation: "PRESIDENT",
          mobile: "9876543210",
          email: "ram@mandir.com",
          canCollect: true,
        },
        {
          memberId: "MEM-002",
          name: "Shyam Lal",
          designation: "SECRETARY",
          mobile: "9876543211",
          email: "shyam@mandir.com",
          canCollect: true,
        },
        {
          memberId: "MEM-003",
          name: "Geeta Devi",
          designation: "TREASURER",
          mobile: "9876543212",
          email: "geeta@mandir.com",
          canCollect: true,
        },
        {
          memberId: "MEM-004",
          name: "Hari Prasad",
          designation: "MEMBER",
          mobile: "9876543213",
          canCollect: false,
        },
        {
          memberId: "MEM-005",
          name: "Sita Rani",
          designation: "VOLUNTEER",
          mobile: "9876543214",
          canCollect: false,
        },
      ]
    })
    console.log("Members seeded!")
  }

  const presidentMember = await prisma.member.findFirst({ where: { designation: "PRESIDENT" } })
  const existingDonations = await prisma.donation.count()
  if (existingDonations === 0) {
    console.log("Seeding donations...")
    await prisma.donation.createMany({
      data: [
        {
          donorName: "Rajesh Kumar",
          mobileNumber: "9898765432",
          category: "GENERAL",
          amount: 5000,
          paymentMode: "CASH",
          receiptNo: "REC-2025-001",
          accountId: cashInHandAccount?.id,
        },
        {
          donorName: "Priya Singh",
          mobileNumber: "9898765433",
          category: "PUJA",
          amount: 2500,
          paymentMode: "UPI",
          transactionId: "UPI123456789",
          receiptNo: "REC-2025-002",
          accountId: sbiAccount?.id,
        },
        {
          donorName: "Amit Sharma",
          mobileNumber: "9898765434",
          category: "FESTIVAL",
          amount: 10000,
          paymentMode: "CHEQUE",
          chequeNumber: "CHQ987654",
          chequeDate: new Date(),
          bankNameCheque: "HDFC Bank",
          receiptNo: "REC-2025-003",
          accountId: sbiAccount?.id,
        },
        {
          donorName: "Sunita Verma",
          mobileNumber: "9898765435",
          category: "ANNADAN",
          amount: 3000,
          paymentMode: "NEFT",
          transactionId: "NEFT123456",
          receiptNo: "REC-2025-004",
          accountId: sbiAccount?.id,
        },
        {
          donorName: "Vikram Joshi",
          mobileNumber: "9898765436",
          category: "CONSTRUCTION",
          amount: 25000,
          paymentMode: "CASH",
          receiptNo: "REC-2025-005",
          accountId: cashInHandAccount?.id,
          collectedByMemberId: presidentMember?.id,
        },
      ]
    })
    console.log("Donations seeded!")
  }

  const existingExpenses = await prisma.expense.count()
  if (existingExpenses === 0) {
    console.log("Seeding expenses...")
    await prisma.expense.createMany({
      data: [
        {
          title: "Puja Items Purchase",
          category: "PUJA_MATERIALS",
          amount: 1500,
          vendorName: "Puja Bhandar",
          vendorMobile: "9876540001",
          paymentMode: "CASH",
          billNumber: "BILL-001",
          billDate: new Date(),
          expenseDate: new Date(),
          status: "PAID",
          accountId: cashInHandAccount?.id,
          approvedById: admin.id,
          approvedAt: new Date(),
        },
        {
          title: "Electricity Bill",
          category: "ELECTRICITY",
          amount: 2500,
          vendorName: "Electricity Board",
          paymentMode: "NEFT",
          transactionId: "NEFT987654",
          billNumber: "EL-1234",
          billDate: new Date(),
          expenseDate: new Date(),
          status: "PAID",
          accountId: sbiAccount?.id,
          approvedById: admin.id,
          approvedAt: new Date(),
        },
        {
          title: "Clerk Salary",
          category: "SALARY",
          amount: 15000,
          vendorName: "Mohan Lal",
          vendorMobile: "9876540002",
          paymentMode: "CASH",
          billNumber: "SAL-001",
          billDate: new Date(),
          expenseDate: new Date(),
          status: "PAID",
          accountId: cashInHandAccount?.id,
          approvedById: admin.id,
          approvedAt: new Date(),
        },
        {
          title: "Temple Maintenance",
          category: "MAINTENANCE",
          amount: 3000,
          vendorName: "Sharma Works",
          vendorMobile: "9876540003",
          paymentMode: "CHEQUE",
          chequeNumber: "CHQ123456",
          chequeDate: new Date(),
          billNumber: "MNT-001",
          billDate: new Date(),
          expenseDate: new Date(),
          status: "APPROVED",
          accountId: sbiAccount?.id,
          approvedById: admin.id,
          approvedAt: new Date(),
        },
      ]
    })
    console.log("Expenses seeded!")
  }

  const existingTransfers = await prisma.fundTransfer.count()
  if (existingTransfers === 0) {
    console.log("Seeding fund transfers...")
    if (cashInHandAccount && sbiAccount) {
      await prisma.fundTransfer.createMany({
        data: [
          {
            fromAccountId: cashInHandAccount.id,
            toAccountId: sbiAccount.id,
            amount: 10000,
            transferDate: new Date(),
            referenceNo: "TRF-001",
            notes: "Cash deposit to SBI",
          },
        ]
      })
      console.log("Fund transfers seeded!")
    }
  }

  const existingEvents = await prisma.event.count()
  if (existingEvents === 0) {
    console.log("Seeding events...")
    await prisma.event.createMany({
      data: [
        {
          name: "Diwali Celebration",
          eventType: "FESTIVAL",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          budget: 50000,
          organizer: "Ram Sharan",
          status: "UPCOMING",
        },
        {
          name: "Daily Puja",
          eventType: "PUJA",
          date: new Date(),
          budget: 500,
          organizer: "Priest",
          status: "ONGOING",
        },
        {
          name: "Annual Meeting",
          eventType: "MEETING",
          date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          budget: 2000,
          organizer: "Shyam Lal",
          status: "UPCOMING",
        },
      ]
    })
    console.log("Events seeded!")
  }

  const existingAssets = await prisma.assetRegister.count()
  if (existingAssets === 0) {
    console.log("Seeding assets...")
    await prisma.assetRegister.createMany({
      data: [
        {
          assetCode: "ASS-001",
          name: "Temple Bell",
          category: "Religious Items",
          purchaseDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          purchaseValue: 25000,
          residualValue: 5000,
          usefulLifeYears: 10,
          depreciationMethod: "STRAIGHT_LINE",
          location: "Main Temple",
          custodian: "Ram Sharan",
          status: "ACTIVE",
        },
        {
          assetCode: "ASS-002",
          name: "Sound System",
          category: "Electronics",
          purchaseDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          purchaseValue: 15000,
          residualValue: 3000,
          usefulLifeYears: 5,
          depreciationMethod: "STRAIGHT_LINE",
          location: "Hall",
          custodian: "Shyam Lal",
          status: "ACTIVE",
        },
      ]
    })
    console.log("Assets seeded!")
  }

  console.log("Seeding completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

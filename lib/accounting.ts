"use server"

import { prisma } from "./prisma"
import { auth } from "@/auth"

export async function generateTransactionNo(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
  const count = await prisma.accountingTransaction.count({
    where: {
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(23, 59, 59, 999)),
      },
    },
  })
  return `TXN-${dateStr}-${String(count + 1).padStart(4, "0")}`
}

interface JournalEntryInput {
  accountId: string
  entryType: "DEBIT" | "CREDIT"
  amount: number
  description?: string
}

interface CreateTransactionInput {
  description: string
  referenceType?: string
  referenceId?: string
  date?: Date
  notes?: string
  entries: JournalEntryInput[]
}

export async function createAccountingTransaction(input: CreateTransactionInput) {
  const session = await auth()
  const transactionNo = await generateTransactionNo()

  const totalDebits = input.entries
    .filter((e) => e.entryType === "DEBIT")
    .reduce((sum, e) => sum + e.amount, 0)
  const totalCredits = input.entries
    .filter((e) => e.entryType === "CREDIT")
    .reduce((sum, e) => sum + e.amount, 0)

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error("Transaction must be balanced (debits = credits)")
  }

  const transaction = await prisma.accountingTransaction.create({
    data: {
      transactionNo,
      date: input.date || new Date(),
      description: input.description,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes,
      createdById: session?.user?.id,
      entries: {
        create: input.entries.map((entry) => ({
          accountId: entry.accountId,
          entryType: entry.entryType,
          amount: entry.amount,
          description: entry.description,
        })),
      },
    },
    include: { entries: true },
  })

  return transaction
}

export async function getChartOfAccounts() {
  return prisma.chartOfAccount.findMany({
    orderBy: { code: "asc" },
    include: { children: true },
  })
}

export async function createChartOfAccount(data: {
  code: string
  name: string
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE"
  parentId?: string
  description?: string
}) {
  return prisma.chartOfAccount.create({ data })
}

export async function seedDefaultChartOfAccounts() {
  const existing = await prisma.chartOfAccount.count()
  if (existing > 0) return

  const accounts = [
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
    { code: "5000", name: "Expenses", type: "EXPENSE" },
    { code: "5100", name: "Puja Materials", type: "EXPENSE", parentCode: "5000" },
    { code: "5200", name: "Electricity", type: "EXPENSE", parentCode: "5000" },
    { code: "5300", name: "Salary", type: "EXPENSE", parentCode: "5000" },
  ]

  const parentMap = new Map<string, string>()

  for (const acc of accounts) {
    const parentId = acc.parentCode ? parentMap.get(acc.parentCode) : undefined
    const created = await prisma.chartOfAccount.create({
      data: {
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
        parentId,
      },
    })
    parentMap.set(acc.code, created.id)
  }
}

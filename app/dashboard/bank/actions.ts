"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { AccountType } from "@prisma/client"

const bankAccountSchema = z.object({
  name: z.string().min(2, "Account name is required"),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  ifscCode: z.string().optional(),
  accountType: z.nativeEnum(AccountType),
  openingBalance: z.coerce.number().default(0),
  notes: z.string().optional(),
})

export async function getBankAccounts() {
  return prisma.bankAccount.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { ledgerEntries: true, donations: true, expenses: true } },
    },
  })
}

export async function getBankAccountById(id: string) {
  return prisma.bankAccount.findUnique({
    where: { id },
    include: {
      ledgerEntries: { orderBy: { date: "desc" }, take: 50 },
    },
  })
}

export async function createBankAccount(data: z.infer<typeof bankAccountSchema>) {
  try {
    const validated = bankAccountSchema.parse(data)
    const account = await prisma.bankAccount.create({ data: validated })

    // Seed an opening balance ledger entry
    if (validated.openingBalance > 0) {
      await prisma.ledgerEntry.create({
        data: {
          accountId: account.id,
          type: "OPENING_BALANCE",
          amount: validated.openingBalance,
          description: `Opening balance for ${validated.name}`,
          referenceType: "OPENING_BALANCE",
          runningBalance: validated.openingBalance,
        },
      })
    }

    revalidatePath("/dashboard/bank")
    return { success: true, data: account }
  } catch (error) {
    console.error(error)
    return { error: "Failed to create bank account." }
  }
}

export async function getAccountBalance(accountId: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where: { accountId },
  })
  return entries.reduce((sum, e) => {
    const isDebit = ["EXPENSE", "TRANSFER_OUT"].includes(e.type)
    return isDebit ? sum - e.amount : sum + e.amount
  }, 0)
}

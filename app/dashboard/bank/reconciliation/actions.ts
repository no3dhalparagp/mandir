"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { getAccountBalance } from "../actions"

export async function getUnreconciledEntries(accountId: string, toDate: Date) {
  return prisma.ledgerEntry.findMany({
    where: {
      accountId,
      isReconciled: false,
      date: { lte: toDate },
    },
    orderBy: { date: "asc" },
  })
}

export async function submitReconciliation(data: {
  accountId: string
  statementFromDate: Date
  statementToDate: Date
  openingBalanceBank: number
  closingBalanceBank: number
  matchedEntryIds: string[]
  notes?: string
}) {
  try {
    const session = await auth()
    const bookBalance = await getAccountBalance(data.accountId)

    const entries = await prisma.ledgerEntry.findMany({
      where: { id: { in: data.matchedEntryIds } }
    })

    const difference = bookBalance - data.closingBalanceBank

    const reconciliation = await prisma.bankReconciliation.create({
      data: {
        accountId: data.accountId,
        statementFromDate: data.statementFromDate,
        statementToDate: data.statementToDate,
        openingBalanceBook: bookBalance, // Current balance for simplicity, ideally point-in-time
        closingBalanceBook: bookBalance,
        openingBalanceBank: data.openingBalanceBank,
        closingBalanceBank: data.closingBalanceBank,
        difference,
        status: difference === 0 ? "COMPLETED" : "IN_PROGRESS",
        notes: data.notes,
        reconciledById: session?.user?.id,
        reconciledAt: new Date(),
        items: {
          create: entries.map(e => ({
            ledgerEntryId: e.id,
            statementDate: e.date,
            statementAmount: e.amount,
            statementDescription: e.description,
            isMatched: true,
            matchedAt: new Date(),
          }))
        }
      }
    })

    // Mark matched entries as reconciled
    if (data.matchedEntryIds.length > 0) {
      await prisma.ledgerEntry.updateMany({
        where: { id: { in: data.matchedEntryIds } },
        data: {
          isReconciled: true,
          reconciledAt: new Date(),
        }
      })
    }

    revalidatePath("/dashboard/bank/reconciliation")
    return { success: true, data: reconciliation }
  } catch (error) {
    console.error("Reconciliation Error:", error)
    return { error: "Failed to submit reconciliation." }
  }
}

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requirePermission } from "@/lib/authorization"

const journalSchema = z.object({
  debitAccountId: z.string().min(1, "Select debit account"),
  creditAccountId: z.string().min(1, "Select credit account"),
  amount: z.coerce.number().min(1, "Amount must be positive"),
  date: z.date(),
  description: z.string().min(3, "Description is required"),
  referenceNo: z.string().optional(),
})

export async function createJournalEntry(data: z.infer<typeof journalSchema>) {
  try {
    await requirePermission("journal", "create")
    const validated = journalSchema.parse(data)
    
    if (validated.debitAccountId === validated.creditAccountId) {
      return { error: "Debit and credit accounts must be different." }
    }

    // A journal entry involves two ledger lines
    // Debit account gets an increase in balance if it's an asset, or decrease if liability.
    // In our simplified system, all accounts are assets (Bank/Cash).
    // So Debit to an asset account means adding to it. Credit means subtracting.
    // Wait, standard accounting: Debit Bank = increase. Credit Bank = decrease.
    // So for the Debit account, we add a TRANSFER_IN (or ADJUSTMENT) positive amount.
    // For the Credit account, we add a TRANSFER_OUT (or ADJUSTMENT) negative amount.
    // Wait, our LedgerEntry handles amounts as positive numbers and the TYPE determines if it's debit/credit.
    // Income/Transfer_In = positive balance effect
    // Expense/Transfer_Out = negative balance effect

    await prisma.$transaction(async (tx) => {
      // The credit side (decrease balance)
      await tx.ledgerEntry.create({
        data: {
          accountId: validated.creditAccountId,
          type: "ADJUSTMENT",
          amount: validated.amount, // stored as positive
          description: validated.description + (validated.referenceNo ? ` (Ref: ${validated.referenceNo})` : ""),
          referenceType: "JOURNAL",
          date: validated.date,
        }
      })

      // The debit side (increase balance)
      // Since our ledger logic currently computes balance: 
      // if type is EXPENSE/TRANSFER_OUT it subtracts.
      // So ADJUSTMENT type needs to be mapped. Currently our system only subtracts for EXPENSE and TRANSFER_OUT.
      // If we use ADJUSTMENT, `getAccountBalance` currently treats it as INCOME (adds it) because it's not in ["EXPENSE", "TRANSFER_OUT"].
      // This is a problem: we need a way to say an ADJUSTMENT is a debit or credit.
      // Let's use TRANSFER_IN for the debit side, and TRANSFER_OUT for the credit side, 
      // or explicitly add ADJUSTMENT_UP and ADJUSTMENT_DOWN types.
      // Let's stick to TRANSFER_IN / TRANSFER_OUT to ensure the balance calculation is correct, but change description.
      
      // Credit side (Subtracts from account) -> TRANSFER_OUT
      await tx.ledgerEntry.create({
        data: {
          accountId: validated.creditAccountId,
          type: "TRANSFER_OUT",
          amount: validated.amount,
          description: "Journal (Credit): " + validated.description + (validated.referenceNo ? ` (Ref: ${validated.referenceNo})` : ""),
          referenceType: "JOURNAL",
          date: validated.date,
        }
      })

      // Debit side (Adds to account) -> TRANSFER_IN
      await tx.ledgerEntry.create({
        data: {
          accountId: validated.debitAccountId,
          type: "TRANSFER_IN",
          amount: validated.amount,
          description: "Journal (Debit): " + validated.description + (validated.referenceNo ? ` (Ref: ${validated.referenceNo})` : ""),
          referenceType: "JOURNAL",
          date: validated.date,
        }
      })
    })

    revalidatePath("/dashboard/journal")
    return { success: true }
  } catch (error) {
    console.error("Journal Error:", error)
    const message = error instanceof Error ? error.message : "Failed to create journal entry."
    return { error: message }
  }
}

export async function getJournalEntries() {
  await requirePermission("journal", "read")
  return prisma.ledgerEntry.findMany({
    orderBy: { date: "desc" },
    include: { account: true },
    take: 100,
  })
}

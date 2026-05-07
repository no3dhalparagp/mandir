"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { getAccountBalance } from "@/app/dashboard/bank/actions"
import {
  requirePermission,
  requireAuth,
} from "@/lib/authorization"

/* -------------------------------------------------------------------------- */
/*                         Recalculate Account Balance                        */
/* -------------------------------------------------------------------------- */

async function recalculateBalancesForAccount(accountId: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where: { accountId },
    orderBy: { date: "asc" },
  })

  let balance = 0

  for (const entry of entries) {
    const isDebit = ["EXPENSE", "TRANSFER_OUT"].includes(entry.type)
    balance = isDebit ? balance - entry.amount : balance + entry.amount

    await prisma.ledgerEntry.update({
      where: { id: entry.id },
      data: { runningBalance: balance },
    })
  }
}

/* -------------------------------------------------------------------------- */
/*                            Verify Collection                               */
/* -------------------------------------------------------------------------- */

export async function verifyCollection(
  collectionId: string,
  verifiedAmount: number,
  discrepancyNote?: string
) {
  try {
    await requirePermission("collections", "verify")
    const user = await requireAuth()

    const collection = await prisma.memberCollection.findUnique({
      where: { id: collectionId },
      include: {
        donation: { include: { account: true } },
        depositedToAccount: true,
      },
    })

    if (!collection) {
      return { error: "Collection not found." }
    }

    const hasDiscrepancy = verifiedAmount !== collection.collectedAmount

    // Update the collection record
    await prisma.memberCollection.update({
      where: { id: collectionId },
      data: {
        status: hasDiscrepancy ? "DISCREPANT" : "VERIFIED",
        verifiedById: user.id,
        verifiedAt: new Date(),
        verifiedAmount,
        discrepancyNote: hasDiscrepancy ? discrepancyNote : null,
      },
    })

    const targetAccountId =
      collection.depositedToAccountId ?? collection.donation.accountId

    const targetAccountName =
      collection.depositedToAccount?.name ?? collection.donation.account?.name

    /* ---------------------------------------------------------------------- */
    /*                         Create Ledger Entry                            */
    /* ---------------------------------------------------------------------- */

    if (!hasDiscrepancy && targetAccountId) {
      const existingEntry = await prisma.ledgerEntry.findFirst({
        where: {
          referenceType: "MEMBER_COLLECTION",
          referenceId: collectionId,
        },
      })

      if (!existingEntry) {
        await prisma.ledgerEntry.create({
          data: {
            accountId: targetAccountId,
            type: "MEMBER_DEPOSIT",
            amount: verifiedAmount,
            description: `Collection by member - Donation: ${collection.donation.receiptNo}`,
            referenceType: "MEMBER_COLLECTION",
            referenceId: collectionId,
          },
        })

        await recalculateBalancesForAccount(targetAccountId)
      }
    }

    /* ---------------------------------------------------------------------- */
    /*                            Updated Balance                             */
    /* ---------------------------------------------------------------------- */

    let currentBalance = undefined

    if (!hasDiscrepancy && targetAccountId) {
      currentBalance = await getAccountBalance(targetAccountId)
    }

    revalidatePath("/dashboard/collections")
    revalidatePath("/dashboard/bank")
    revalidatePath("/dashboard/journal")

    return {
      success: true,
      balance: currentBalance,
      accountName: targetAccountName ?? undefined,
    }
  } catch (error: any) {
    return {
      error: error.message || "Failed to verify collection.",
    }
  }
}

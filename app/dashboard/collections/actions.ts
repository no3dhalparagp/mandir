"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { getAccountBalance } from "@/app/dashboard/bank/actions"

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

export async function getPendingCollections() {
  return prisma.memberCollection.findMany({
    where: { status: { in: ["COLLECTED", "DEPOSITED"] } },
    include: {
      member: true,
      donation: true,
      depositedToAccount: true,
    },
    orderBy: { collectedDate: "desc" },
  })
}

export async function getAllCollections() {
  const session = await auth()
  
  let whereClause = {}
  
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { member: true }
    })
    
    if (user && !["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"].includes(user.role)) {
      if (user.member) {
        whereClause = { memberId: user.member.id }
      } else {
        return [] // Restricted user with no linked member profile sees nothing
      }
    }
  }

  return prisma.memberCollection.findMany({
    where: whereClause,
    include: {
      member: true,
      donation: true,
      depositedToAccount: true,
      verifiedBy: { select: { name: true } },
    },
    orderBy: { collectedDate: "desc" },
    take: 100,
  })
}

export async function getMemberLedger(memberId: string) {
  const collections = await prisma.memberCollection.findMany({
    where: { memberId },
    include: { donation: true, depositedToAccount: true, verifiedBy: { select: { name: true } } },
    orderBy: { collectedDate: "desc" },
  })

  const totalCollected = collections.reduce((s, c) => s + c.collectedAmount, 0)
  const totalDeposited = collections
    .filter((c) => c.status === "DEPOSITED" || c.status === "VERIFIED" || c.status === "DISCREPANT")
    .reduce((s, c) => s + (c.verifiedAmount ?? c.collectedAmount), 0)
  const totalVerified = collections
    .filter((c) => c.status === "VERIFIED")
    .reduce((s, c) => s + (c.verifiedAmount ?? c.collectedAmount), 0)
  const pendingDeposit = collections
    .filter((c) => c.status === "COLLECTED")
    .reduce((s, c) => s + c.collectedAmount, 0)
  const pendingVerification = collections
    .filter((c) => c.status === "DEPOSITED")
    .reduce((s, c) => s + c.collectedAmount, 0)
  const outstanding = totalCollected - totalVerified

  return { collections, totalCollected, totalDeposited, totalVerified, pendingDeposit, pendingVerification, outstanding }
}

export async function markCollectionDeposited(
  collectionId: string,
  depositedToAccountId: string,
  depositSlipNo?: string
) {
  try {
    await prisma.memberCollection.update({
      where: { id: collectionId },
      data: {
        status: "DEPOSITED",
        depositedToAccountId,
        depositedDate: new Date(),
        depositSlipNo,
      },
    })
    revalidatePath("/dashboard/collections")
    return { success: true }
  } catch {
    return { error: "Failed to mark as deposited." }
  }
}

export async function verifyCollection(
  collectionId: string,
  verifiedAmount: number,
  discrepancyNote?: string
) {
  try {
    const session = await auth()
    const collection = await prisma.memberCollection.findUnique({
      where: { id: collectionId },
      include: { donation: { include: { account: true } }, depositedToAccount: true },
    })
    if (!collection) return { error: "Collection not found." }

    const hasDiscrepancy = verifiedAmount !== collection.collectedAmount
    await prisma.memberCollection.update({
      where: { id: collectionId },
      data: {
        status: hasDiscrepancy ? "DISCREPANT" : "VERIFIED",
        verifiedById: session?.user?.id,
        verifiedAt: new Date(),
        verifiedAmount,
        discrepancyNote: hasDiscrepancy ? discrepancyNote : null,
      },
    })

    const targetAccountId = collection.depositedToAccountId ?? collection.donation.accountId
    const targetAccountName = collection.depositedToAccount?.name ?? collection.donation.account?.name

    if (!hasDiscrepancy && targetAccountId) {
      const existingEntry = await prisma.ledgerEntry.findFirst({
        where: { referenceType: "MEMBER_COLLECTION", referenceId: collectionId },
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
  } catch {
    return { error: "Failed to verify collection." }
  }
}

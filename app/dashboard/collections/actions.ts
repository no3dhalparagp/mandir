"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { AccountType, Prisma } from "@prisma/client"

import {
  getAccountBalance,
  addVerifiedCollectionToCashAccount,
} from "@/app/dashboard/bank/actions"

import {
  requirePermission,
  requireAuth,
} from "@/lib/authorization"

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

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
/*                           Pending Collections                              */
/* -------------------------------------------------------------------------- */

export async function getPendingCollections() {
  await requirePermission("collections", "read")

  return prisma.memberCollection.findMany({
    where: {
      status: { in: ["COLLECTED", "DEPOSITED"] },
    },
    include: {
      member: true,
      donation: true,
      depositedToAccount: true,
    },
    orderBy: { collectedDate: "desc" },
  })
}

/* -------------------------------------------------------------------------- */
/*                             All Collections                                */
/* -------------------------------------------------------------------------- */

export async function getAllCollections() {
  await requireAuth()

  const session = await auth()

  let whereClause: Prisma.MemberCollectionWhereInput = {}

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { member: true },
    })

    if (
      user &&
      !["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"].includes(user.role)
    ) {
      if (user.member) {
        whereClause = { memberId: user.member.id }
      } else {
        return []
      }
    }
  }

  const collections = await prisma.memberCollection.findMany({
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

  if (collections.length === 0) {
    return collections
  }

  // Determine which verified collections already have a cash-account ledger entry
  const collectionIds = collections.map((c) => c.id)

  const cashAccounts = await prisma.bankAccount.findMany({
    where: { accountType: AccountType.CASH_IN_HAND },
    select: { id: true },
  })

  const cashAccountIds = cashAccounts.map((a) => a.id)

  let cashPostedIds = new Set<string>()

  if (cashAccountIds.length > 0) {
    const cashLedgerEntries = await prisma.ledgerEntry.findMany({
      where: {
        accountId: { in: cashAccountIds },
        referenceType: "OTHER",
        referenceId: { in: collectionIds },
      },
      select: { referenceId: true },
    })

    cashPostedIds = new Set(
      cashLedgerEntries
        .map((e) => e.referenceId)
        .filter((id): id is string => !!id)
    )
  }

  return collections.map((c) => ({
    ...c,
    isInCashAccount: cashPostedIds.has(c.id),
    canSendToCash: !!session?.user?.id && c.verifiedById === session.user.id && c.verifiedAmount !== null && c.verifiedAmount > 0,
  }))
}

/* -------------------------------------------------------------------------- */
/*                              Member Ledger                                 */
/* -------------------------------------------------------------------------- */

export async function getMemberLedger(memberId: string) {
  await requireAuth()

  const collections = await prisma.memberCollection.findMany({
    where: { memberId },
    include: {
      donation: true,
      depositedToAccount: true,
      verifiedBy: { select: { name: true } },
    },
    orderBy: { collectedDate: "desc" },
  })

  /* ---------------------------------------------------------------------- */
  /*                                 Totals                                 */
  /* ---------------------------------------------------------------------- */

  const totalCollected = collections.reduce((s, c) => s + c.collectedAmount, 0)

  const totalDeposited = collections
    .filter((c) => ["DEPOSITED", "VERIFIED"].includes(c.status))
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

  const recollectionRequired = collections
    .filter((c) => c.status === "DISCREPANT")
    .reduce((s, c) => {
      const verified = c.verifiedAmount ?? 0
      return s + (c.collectedAmount - verified)
    }, 0)

  const discrepantCollections = collections.filter(
    (c) => c.status === "DISCREPANT"
  )

  const outstanding = pendingDeposit + pendingVerification + recollectionRequired

  return {
    collections,
    totalCollected,
    totalDeposited,
    totalVerified,
    pendingDeposit,
    pendingVerification,
    recollectionRequired,
    discrepantCollections,
    outstanding,
  }
}

/* -------------------------------------------------------------------------- */
/*                          Get Collections By Collector                      */
/* -------------------------------------------------------------------------- */

export async function getCollectionsByCollector() {
  await requirePermission("collections", "read")

  const collections = await prisma.memberCollection.findMany({
    where: {
      status: { in: ["COLLECTED"] },
    },
    include: {
      member: true,
      donation: true,
    },
    orderBy: { collectedDate: "desc" },
  })

  const groupedByMember = new Map<
    string,
    {
      member: { id: string; name: string; memberId: string }
      collections: typeof collections
      totalAmount: number
    }
  >()

  for (const collection of collections) {
    const memberKey = collection.memberId
    if (!groupedByMember.has(memberKey)) {
      groupedByMember.set(memberKey, {
        member: {
          id: collection.member.id,
          name: collection.member.name,
          memberId: collection.member.memberId,
        },
        collections: [],
        totalAmount: 0,
      })
    }

    const memberData = groupedByMember.get(memberKey)!
    memberData.collections.push(collection)
    memberData.totalAmount += collection.collectedAmount
  }

  return Array.from(groupedByMember.values())
}

/* -------------------------------------------------------------------------- */
/*                         Bulk Send To Accountant                            */
/* -------------------------------------------------------------------------- */

export async function bulkSendToAccountant(collectionIds: string[], depositedToAccountId: string) {
  try {
    await requirePermission("collections", "deposit")
    await requireAuth()

    if (collectionIds.length === 0) {
      return { error: "No collections selected." }
    }

    await prisma.memberCollection.updateMany({
      where: {
        id: { in: collectionIds },
        status: "COLLECTED",
      },
      data: {
        status: "DEPOSITED",
        depositedToAccountId,
        depositedDate: new Date(),
      },
    })

    revalidatePath("/dashboard/collections")
    return { success: true }
  } catch (error: unknown) {
    return {
      error: getErrorMessage(error, "Failed to send to accountant."),
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                        Mark Collection Deposited                           */
/* -------------------------------------------------------------------------- */

export async function markCollectionDeposited(
  collectionId: string,
  depositedToAccountId: string,
  depositSlipNo?: string,
  recollectMode?: boolean
) {
  try {
    await requirePermission("collections", "deposit")

    if (recollectMode) {
      const existing = await prisma.memberCollection.findUnique({
        where: { id: collectionId },
      })

      if (!existing) {
        return { error: "Collection not found." }
      }

      if (existing.status !== "DISCREPANT") {
        return {
          error: "Only discrepant collections can be submitted as recollection.",
        }
      }

      const remainingAmount = Math.max(
        0,
        existing.collectedAmount - (existing.verifiedAmount ?? 0)
      )

      if (remainingAmount <= 0) {
        return { error: "No remaining amount pending for recollection." }
      }

      await prisma.memberCollection.update({
        where: { id: collectionId },
        data: {
          status: "DEPOSITED",
          depositedToAccountId,
          depositedDate: new Date(),
          depositSlipNo,
          collectedAmount: remainingAmount,
          verifiedAmount: null,
          verifiedById: null,
          verifiedAt: null,
          discrepancyNote: null,
        },
      })

      revalidatePath("/dashboard/collections")
      return { success: true }
    }

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
  } catch (error: unknown) {
    return {
      error: getErrorMessage(error, "Failed to mark as deposited."),
    }
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
      where: {
        id: collectionId,
      },
      include: {
        member: true,
        donation: {
          include: {
            account: true,
          },
        },
        depositedToAccount: true,
      },
    })

    if (!collection) {
      return {
        error: "Collection not found.",
      }
    }

    const hasDiscrepancy =
      verifiedAmount !== collection.collectedAmount

    /* ---------------------------------------------------------- */
    /* UPDATE COLLECTION STATUS                                   */
    /* ---------------------------------------------------------- */

    await prisma.memberCollection.update({
      where: {
        id: collectionId,
      },
      data: {
        status: hasDiscrepancy
          ? "DISCREPANT"
          : "VERIFIED",

        verifiedById: user.id,

        verifiedAt: new Date(),

        verifiedAmount,

        discrepancyNote: hasDiscrepancy
          ? discrepancyNote
          : null,
      },
    })

    /* ---------------------------------------------------------- */
    /* POST VERIFIED AMOUNT                                       */
    /* ---------------------------------------------------------- */

    let targetAccountName:
      | string
      | undefined

    let currentBalance:
      | number
      | undefined

    if (verifiedAmount > 0) {
      const donationAccount =
        collection.donation?.account

      if (!donationAccount) {
        return {
          error:
            "No receipt account linked with donation.",
        }
      }

      /* ------------------------------------------------------ */
      /* CASH COLLECTION                                         */
      /* ------------------------------------------------------ */

      if (
        donationAccount.accountType ===
        AccountType.CASH_IN_HAND
      ) {
        await addVerifiedCollectionToCashAccount({
          cashAccountId:
            donationAccount.id,

          amount: verifiedAmount,

          collectionId,

          collectorName:
            collection.member?.name ??
            undefined,
        })

        targetAccountName =
          donationAccount.name

        currentBalance =
          await getAccountBalance(
            donationAccount.id
          )
      }

      /* ------------------------------------------------------ */
      /* CHEQUE / BANK COLLECTION                                */
      /* ------------------------------------------------------ */

      else {
        await prisma.ledgerEntry.create({
          data: {
            accountId:
              donationAccount.id,

            type: "INCOME",

            amount: Number(
              verifiedAmount
            ),

            description: `Cheque collection from ${
              collection.member?.name ??
              "member"
            }`,

            referenceId:
              collectionId,

            referenceType: "OTHER",

            isCleared: false,

            clearedAt: null,
          },
        })

        await recalculateBalancesForAccount(
          donationAccount.id
        )

        targetAccountName =
          donationAccount.name

        currentBalance =
          await getAccountBalance(
            donationAccount.id
          )
      }
    }

    revalidatePath(
      "/dashboard/collections"
    )

    revalidatePath(
      "/dashboard/bank"
    )

    revalidatePath(
      "/dashboard/journal"
    )

    return {
      success: true,
      balance: currentBalance,
      accountName:
        targetAccountName,
    }
  } catch (error: unknown) {
    return {
      error: getErrorMessage(
        error,
        "Failed to verify collection."
      ),
    }
  }
}
    /* ---------------------------------------------------------------------- */
    /*                           Post To Cash Account                         */
    /* ---------------------------------------------------------------------- */

    let targetAccountName: string | undefined
    let currentBalance = undefined

    // Post verified amount to cash account even if there's a discrepancy
    if (verifiedAmount > 0) {
      // Find default cash-in-hand account
      const cashAccount = await prisma.bankAccount.findFirst({
        where: { accountType: AccountType.CASH_IN_HAND },
      })

      if (!cashAccount) {
        return {
          error:
            "No Cash in Hand account found. Please create one under Bank Accounts first.",
        }
      }

      await addVerifiedCollectionToCashAccount({
        cashAccountId: cashAccount.id,
        amount: verifiedAmount,
        collectionId,
        collectorName: collection.member?.name ?? undefined,
      })

      targetAccountName = cashAccount.name

      currentBalance = await getAccountBalance(cashAccount.id)
    }

    revalidatePath("/dashboard/collections")
    revalidatePath("/dashboard/bank")
    revalidatePath("/dashboard/journal")

    return {
      success: true,
      balance: currentBalance,
      accountName: targetAccountName,
    }
  } catch (error: unknown) {
    return {
      error: getErrorMessage(error, "Failed to verify collection."),
    }
  }
}

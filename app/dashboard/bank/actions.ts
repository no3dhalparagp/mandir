
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  AccountType,
  LedgerTransactionType,
} from "@prisma/client"

import { requireAuth, requirePermission } from "@/lib/authorization"
import { assertDateNotClosed } from "@/lib/book-closure"

/* ======================================================
   SCHEMA
====================================================== */

const bankAccountSchema = z.object({
  name: z
    .string()
    .min(2, "Account name is required"),

  accountNumber: z.string().optional(),

  bankName: z.string().optional(),

  branchName: z.string().optional(),

  ifscCode: z.string().optional(),

  accountType:
    z.nativeEnum(AccountType),

  openingBalance:
    z.coerce.number().default(0),

  notes: z.string().optional(),
})

/* ======================================================
   DEBIT TYPES
====================================================== */

const debitTypes: LedgerTransactionType[] =
  [
    "EXPENSE",
    "TRANSFER_OUT",
  ]

/* ======================================================
   RECALCULATE RUNNING BALANCE
====================================================== */

async function recalculateRunningBalances(
  accountId: string
) {
  const entries =
    await prisma.ledgerEntry.findMany({
      where: {
        accountId,
      },

      orderBy: [
        {
          date: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    })

  let balance = 0

  for (const entry of entries) {
    const amount = Number(entry.amount)

    if (
      debitTypes.includes(entry.type)
    ) {
      balance -= amount
    } else {
      balance += amount
    }

    await prisma.ledgerEntry.update({
      where: {
        id: entry.id,
      },

      data: {
        runningBalance: balance,
      },
    })
  }
}

/* ======================================================
   GET ALL BANK ACCOUNTS
====================================================== */

export async function getAccountBalance(
  accountId: string
) {
  const entries =
    await prisma.ledgerEntry.findMany({
      where: {
        accountId,

        OR: [
          {
            isCleared: true,
          },
          {
            isCleared: null,
          },
        ],
      },

      orderBy: [
        {
          date: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    })

  let balance = 0

  for (const entry of entries) {
    const isDebit = [
      "EXPENSE",
      "TRANSFER_OUT",
    ].includes(entry.type)

    balance = isDebit
      ? balance - Number(entry.amount)
      : balance + Number(entry.amount)
  }

  return balance
}

/* ======================================================
   GET SINGLE ACCOUNT
====================================================== */

export async function getBankAccountById(
  id: string
) {
  await requirePermission(
    "bank",
    "read"
  )

  return prisma.bankAccount.findUnique({
    where: {
      id,
    },

    include: {
      ledgerEntries: {
        orderBy: {
          date: "desc",
        },

        take: 100,
      },
    },
  })
}

/* ======================================================
   CREATE BANK ACCOUNT
====================================================== */

export async function createBankAccount(
  data: z.infer<
    typeof bankAccountSchema
  >
) {
  try {
    await requirePermission(
      "bank",
      "create"
    )

    const validated =
      bankAccountSchema.parse(data)

    const account =
      await prisma.bankAccount.create({
        data: validated,
      })

    /* ---------------------------------------------
       OPENING BALANCE
    --------------------------------------------- */

    if (
      validated.openingBalance > 0
    ) {
      await prisma.ledgerEntry.create({
        data: {
          accountId: account.id,

          type:
            "OPENING_BALANCE",

          amount:
            validated.openingBalance,

          description: `Opening balance for ${validated.name}`,

          referenceType:
            "OPENING_BALANCE",

          runningBalance:
            validated.openingBalance,
        },
      })
    }

    await recalculateRunningBalances(
      account.id
    )

    revalidatePath(
      "/dashboard/bank"
    )

    return {
      success: true,
      data: account,
    }
  } catch (error) {
    console.error(error)

    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create bank account",
    }
  }
}



/* ======================================================
   ADD VERIFIED COLLECTION TO CASH ACCOUNT
====================================================== */

export async function addVerifiedCollectionToCashAccount(
  {
    cashAccountId,
    amount,
    collectionId,
    collectorName,
  }: {
    cashAccountId: string
    amount: number
    collectionId: string
    collectorName?: string
  }
) {
  try {
    await assertDateNotClosed(new Date(), "Collection posting to cash book")
    await prisma.ledgerEntry.create({
      data: {
        accountId: cashAccountId,

        // VALID ENUM
        type: "INCOME",

        amount: Number(amount),

        description: `Verified collection${
          collectorName
            ? ` from ${collectorName}`
            : ""
        }`,

        referenceId: collectionId,

        // USE VALID ENUM
        referenceType: "OTHER",
      },
    })

    await recalculateRunningBalances(
      cashAccountId
    )

    revalidatePath(
      "/dashboard/bank"
    )

    return {
      success: true,
    }
  } catch (error) {
    console.error(error)

    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to add collection to cash account",
    }
  }
}

/* ======================================================
   RECALCULATE BALANCES
====================================================== */

export async function recalculateBalances(
  accountId: string
) {
  await recalculateRunningBalances(
    accountId
  )

  revalidatePath(
    "/dashboard/bank"
  )

  return {
    success: true,
  }
}


export async function getAccountBalance(accountId: string) {
  // The running balance is stored on the latest ledger entry for the account
  const lastEntry = await prisma.ledgerEntry.findFirst({
    where: { accountId },
    orderBy: { date: "desc" },
    select: { runningBalance: true },
  })

  return lastEntry?.runningBalance ?? 0
}

/* ======================================================
   BULK: ADD VERIFIED COLLECTIONS TO CASH ACCOUNT
====================================================== */

export async function bulkAddVerifiedCollectionsToCashAccount({
  cashAccountId,
  collectionIds,
}: {
  cashAccountId: string
  collectionIds: string[]
}) {
  try {
    await assertDateNotClosed(new Date(), "Collection posting to cash book")
    const currentUser = await requireAuth()
    await requirePermission("bank", "transfer")
    await requirePermission("collections", "deposit")

    if (collectionIds.length === 0) {
      return { success: true }
    }

    // Ensure target is a cash-in-hand account
    const cashAccount = await prisma.bankAccount.findFirst({
      where: {
        id: cashAccountId,
        accountType: AccountType.CASH_IN_HAND,
      },
    })

    if (!cashAccount) {
      return {
        error:
          "Selected account is not a Cash in Hand account or does not exist.",
      }
    }

    await prisma.$transaction(async (tx) => {
      const collections = await tx.memberCollection.findMany({
        where: {
          id: { in: collectionIds },
          status: { in: ["VERIFIED", "DISCREPANT"] },
          verifiedById: currentUser.id,
          verifiedAmount: { not: null, gt: 0 },
        },
        include: {
          member: true,
        },
      })

      if (collections.length === 0) {
        throw new Error(
          "Only the same user who verified a collection can send it to cash account."
        )
      }

      // Find existing cash ledger entries for these collections to avoid duplicates
      const cashAccountIds = await tx.bankAccount.findMany({
        where: { accountType: AccountType.CASH_IN_HAND },
        select: { id: true },
      })

      const existingEntries = await tx.ledgerEntry.findMany({
        where: {
          accountId: { in: cashAccountIds.map((a) => a.id) },
          referenceType: "OTHER",
          referenceId: { in: collections.map((c) => c.id) },
        },
        select: { referenceId: true },
      })

      const alreadyPosted = new Set(
        existingEntries
          .map((e) => e.referenceId)
          .filter((id): id is string => !!id)
      )

      for (const collection of collections) {
        if (alreadyPosted.has(collection.id)) {
          continue
        }

        const amount =
          typeof collection.verifiedAmount === "number"
            ? collection.verifiedAmount
            : collection.collectedAmount

        await tx.ledgerEntry.create({
          data: {
            accountId: cashAccountId,
            type: "INCOME",
            amount: Number(amount),
            description: `Verified collection${
              collection.member?.name ? ` from ${collection.member.name}` : ""
            }`,
            referenceId: collection.id,
            referenceType: "OTHER",
          },
        })
      }

      await recalculateRunningBalances(cashAccountId)
    })

    revalidatePath("/dashboard/bank")
    revalidatePath("/dashboard/collections")

    return { success: true }
  } catch (error) {
    console.error(error)

    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to add collections to cash account",
    }
  }
}

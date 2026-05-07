
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  AccountType,
  LedgerTransactionType,
} from "@prisma/client"

import { requirePermission } from "@/lib/authorization"

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

export async function getBankAccounts() {
  await requirePermission(
    "bank",
    "read"
  )

  return prisma.bankAccount.findMany({
    orderBy: {
      createdAt: "asc",
    },

    include: {
      _count: {
        select: {
          ledgerEntries: true,
          donations: true,
          expenses: true,
        },
      },
    },
  })
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
   GET ACCOUNT BALANCE
====================================================== */

export async function getAccountBalance(
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
  }

  return balance
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


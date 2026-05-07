
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requirePermission } from "@/lib/authorization"

/* -------------------------------------------------------
   SCHEMA
------------------------------------------------------- */

const transferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.coerce.number().positive(),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
})

/* -------------------------------------------------------
   RECALCULATE RUNNING BALANCE
------------------------------------------------------- */

async function recalculateRunningBalances(
  accountId: string
) {
  const entries = await prisma.ledgerEntry.findMany({
    where: {
      accountId,
    },
    orderBy: [
      { date: "asc" },
      { createdAt: "asc" },
    ],
  })

  const debitTypes = [
    "EXPENSE",
    "TRANSFER_OUT",
    "WITHDRAW",
  ]

  let balance = 0

  for (const entry of entries) {
    const amount = Number(entry.amount)

    if (debitTypes.includes(entry.type)) {
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

/* -------------------------------------------------------
   CREATE FUND TRANSFER
------------------------------------------------------- */

export async function createFundTransfer(
  data: z.infer<typeof transferSchema>
) {
  try {
    await requirePermission("bank", "create")

    const validated =
      transferSchema.parse(data)

    if (
      validated.fromAccountId ===
      validated.toAccountId
    ) {
      return {
        error:
          "Source and destination account cannot be same",
      }
    }

    /* ---------------------------------------------------
       LOAD ACCOUNTS
    --------------------------------------------------- */

    const fromAccount =
      await prisma.bankAccount.findUnique({
        where: {
          id: validated.fromAccountId,
        },
      })

    const toAccount =
      await prisma.bankAccount.findUnique({
        where: {
          id: validated.toAccountId,
        },
      })

    if (!fromAccount || !toAccount) {
      return {
        error: "Account not found",
      }
    }

    /* ---------------------------------------------------
       CHECK AVAILABLE BALANCE
    --------------------------------------------------- */

    const debitTypes = [
      "EXPENSE",
      "TRANSFER_OUT",
      "WITHDRAW",
    ]

    const existingEntries =
      await prisma.ledgerEntry.findMany({
        where: {
          accountId:
            validated.fromAccountId,
        },
      })

    let currentBalance = 0

    for (const entry of existingEntries) {
      const amount = Number(entry.amount)

      if (
        debitTypes.includes(entry.type)
      ) {
        currentBalance -= amount
      } else {
        currentBalance += amount
      }
    }

    if (
      currentBalance < validated.amount
    ) {
      return {
        error:
          "Insufficient balance in source account",
      }
    }

    /* ---------------------------------------------------
       CREATE TRANSFER
    --------------------------------------------------- */

    const transfer =
      await prisma.$transaction(
        async (tx) => {
          const transferRecord =
            await tx.fundTransfer.create({
              data: {
                fromAccountId:
                  validated.fromAccountId,
                toAccountId:
                  validated.toAccountId,
                amount: validated.amount,
                referenceNo:
                  validated.referenceNo,
                notes: validated.notes,
              },
            })

          /* ---------------------------------------------
             SOURCE ACCOUNT ENTRY
          --------------------------------------------- */

          await tx.ledgerEntry.create({
            data: {
              accountId:
                validated.fromAccountId,
              type: "TRANSFER_OUT",
              amount: validated.amount,
              description: `Transfer to ${toAccount.name}`,
              referenceId:
                transferRecord.id,
              referenceType:
                "FUND_TRANSFER",
            },
          })

          /* ---------------------------------------------
             DESTINATION ACCOUNT ENTRY
          --------------------------------------------- */

          await tx.ledgerEntry.create({
            data: {
              accountId:
                validated.toAccountId,
              type: "TRANSFER_IN",
              amount: validated.amount,
              description: `Transfer from ${fromAccount.name}`,
              referenceId:
                transferRecord.id,
              referenceType:
                "FUND_TRANSFER",
            },
          })

          return transferRecord
        }
      )

    /* ---------------------------------------------------
       RECALCULATE BOTH ACCOUNTS
    --------------------------------------------------- */

    await recalculateRunningBalances(
      validated.fromAccountId
    )

    await recalculateRunningBalances(
      validated.toAccountId
    )

    revalidatePath("/dashboard/bank")
    revalidatePath(
      `/dashboard/bank/${validated.fromAccountId}`
    )
    revalidatePath(
      `/dashboard/bank/${validated.toAccountId}`
    )

    return {
      success: true,
      data: transfer,
    }
  } catch (error) {
    console.error(error)

    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create transfer",
    }
  }
}

/* -------------------------------------------------------
   GET ALL TRANSFERS
------------------------------------------------------- */

export async function getFundTransfers() {
  await requirePermission("bank", "read")

  return prisma.fundTransfer.findMany({
    include: {
      fromAccount: true,
      toAccount: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}


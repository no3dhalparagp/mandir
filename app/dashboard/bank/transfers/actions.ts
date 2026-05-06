"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const transferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.coerce.number().min(1),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
})

export async function createFundTransfer(data: z.infer<typeof transferSchema>) {
  try {
    const validated = transferSchema.parse(data)
    if (validated.fromAccountId === validated.toAccountId) {
      return { error: "Cannot transfer to the same account." }
    }

    const transfer = await prisma.fundTransfer.create({ data: validated })

    // Create two ledger entries: debit from source, credit to target
    await prisma.ledgerEntry.createMany({
      data: [
        {
          accountId: validated.fromAccountId,
          type: "TRANSFER_OUT",
          amount: validated.amount,
          description: `Fund transfer out${validated.referenceNo ? ` (Ref: ${validated.referenceNo})` : ""}`,
          referenceType: "TRANSFER",
          referenceId: transfer.id,
        },
        {
          accountId: validated.toAccountId,
          type: "TRANSFER_IN",
          amount: validated.amount,
          description: `Fund transfer in${validated.referenceNo ? ` (Ref: ${validated.referenceNo})` : ""}`,
          referenceType: "TRANSFER",
          referenceId: transfer.id,
        },
      ],
    })

    revalidatePath("/dashboard/bank/transfers")
    revalidatePath("/dashboard/ledger")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Failed to create transfer." }
  }
}

export async function getFundTransfers() {
  return prisma.fundTransfer.findMany({
    orderBy: { transferDate: "desc" },
    include: {
      fromAccount: { select: { name: true } },
      toAccount: { select: { name: true } },
    },
    take: 100,
  })
}

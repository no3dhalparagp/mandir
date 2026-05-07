"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requirePermission } from "@/lib/authorization"

const createChequeBookSchema = z.object({
  accountId: z.string().min(1),
  bookNo: z.string().min(1),
  startNumber: z.string().min(1),
  endNumber: z.string().min(1),
  notes: z.string().optional(),
})

function toPadded(value: number, width: number) {
  return String(value).padStart(width, "0")
}

export async function createChequeBook(data: z.infer<typeof createChequeBookSchema>) {
  try {
    await requirePermission("registers", "manage")
    const validated = createChequeBookSchema.parse(data)

    const start = Number(validated.startNumber)
    const end = Number(validated.endNumber)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      return { error: "Invalid cheque range. End number must be greater than or equal to start number." }
    }

    const width = Math.max(validated.startNumber.length, validated.endNumber.length)
    const leafNumbers = Array.from({ length: end - start + 1 }, (_, idx) => toPadded(start + idx, width))

    const existing = await prisma.chequeBookLeaf.findMany({
      where: {
        accountId: validated.accountId,
        chequeNumber: { in: leafNumbers },
      },
      select: { chequeNumber: true },
    })
    if (existing.length > 0) {
      return { error: `Cheque number(s) already exist for this account: ${existing.map((e) => e.chequeNumber).join(", ")}` }
    }

    await prisma.chequeBook.create({
      data: {
        accountId: validated.accountId,
        bookNo: validated.bookNo,
        startNumber: validated.startNumber,
        endNumber: validated.endNumber,
        notes: validated.notes || undefined,
        leaves: {
          create: leafNumbers.map((num) => ({
            chequeNumber: num,
            accountId: validated.accountId,
          })),
        },
      },
    })

    revalidatePath("/dashboard/registers/cheques")
    revalidatePath("/dashboard/expenses")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create cheque book."
    return { error: message }
  }
}

export async function cancelUnusedChequeLeaf(leafId: string, reason?: string) {
  try {
    await requirePermission("registers", "manage")
    const leaf = await prisma.chequeBookLeaf.findUnique({
      where: { id: leafId },
      select: { status: true },
    })
    if (!leaf) return { error: "Cheque leaf not found." }
    if (leaf.status !== "UNUSED") {
      return { error: "Only unused cheques can be cancelled." }
    }

    await prisma.chequeBookLeaf.update({
      where: { id: leafId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledReason: reason || "Cancelled before issue",
      },
    })

    revalidatePath("/dashboard/registers/cheques")
    revalidatePath("/dashboard/expenses")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel cheque leaf."
    return { error: message }
  }
}

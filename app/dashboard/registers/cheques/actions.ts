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

export async function updateChequeStatus(chequeId: string, status: "CLEARED" | "BOUNCED", clearedDate?: Date, bouncedReason?: string) {
  try {
    await requirePermission("registers", "manage")
    const cheque = await prisma.chequeRegister.findUnique({
      where: { id: chequeId },
      include: { account: true },
    })

    if (!cheque) return { error: "Cheque not found." }
    if (cheque.status === "CLEARED" || cheque.status === "BOUNCED") {
      return { error: "Cheque status cannot be changed once cleared or bounced." }
    }

    const updateData: any = {
      status,
      clearedDate: status === "CLEARED" ? (clearedDate || new Date()) : null,
      bouncedReason: status === "BOUNCED" ? bouncedReason : null,
    }

    if (status === "CLEARED") {
      const ledgerEntryType = cheque.nature === "RECEIVED" ? "INCOME" : "EXPENSE"
      const amount = cheque.nature === "RECEIVED" ? cheque.amount : -cheque.amount

      await prisma.ledgerEntry.create({
        data: {
          accountId: cheque.accountId!,
          date: clearedDate || new Date(),
          type: ledgerEntryType,
          amount: Math.abs(amount),
          description: `Cheque ${cheque.chequeNumber} ${status.toLowerCase()} - ${cheque.partyName || "Unknown"}`,
          referenceType: "CHEQUE",
          referenceId: chequeId,
        },
      })
    }

    await prisma.chequeRegister.update({
      where: { id: chequeId },
      data: updateData,
    })

    revalidatePath("/dashboard/registers/cheques")
    revalidatePath("/dashboard/bank")
    revalidatePath("/dashboard/journal")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update cheque status."
    return { error: message }
  }
}

export async function refreshPassbook(accountId?: string) {
  try {
    await requirePermission("registers", "read")
    revalidatePath("/dashboard/bank")
    revalidatePath("/dashboard/journal")
    revalidatePath("/dashboard/registers/cheques")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh passbook."
    return { error: message }
  }
}

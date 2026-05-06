"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ExpenseCategory, PaymentMode } from "@prisma/client"
import { auth } from "@/auth"

const expenseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  vendorName: z.string().optional(),
  vendorMobile: z.string().optional(),
  paymentMode: z.nativeEnum(PaymentMode),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().optional(),
  transactionId: z.string().optional(),
  billNumber: z.string().optional(),
  accountId: z.string().optional(),
  notes: z.string().optional(),
})

export async function createExpense(data: z.infer<typeof expenseSchema>) {
  try {
    const validatedData = expenseSchema.parse(data)
    const session = await auth()

    const isAutoApproved =
      session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "COMMITTEE_ADMIN"

    const expense = await prisma.expense.create({
      data: {
        title: validatedData.title,
        category: validatedData.category,
        amount: validatedData.amount,
        vendorName: validatedData.vendorName || undefined,
        vendorMobile: validatedData.vendorMobile || undefined,
        paymentMode: validatedData.paymentMode,
        chequeNumber: validatedData.chequeNumber || undefined,
        chequeDate: validatedData.chequeDate ? new Date(validatedData.chequeDate) : undefined,
        transactionId: validatedData.transactionId || undefined,
        billNumber: validatedData.billNumber || undefined,
        accountId: validatedData.accountId || undefined,
        notes: validatedData.notes || undefined,
        status: isAutoApproved ? "APPROVED" : "PENDING",
        approvedById: isAutoApproved ? session?.user?.id : undefined,
        approvedAt: isAutoApproved ? new Date() : undefined,
      },
    })

    // Create a ledger entry if approved and has an account
    if (isAutoApproved && validatedData.accountId) {
      await prisma.ledgerEntry.create({
        data: {
          accountId: validatedData.accountId,
          type: "EXPENSE",
          amount: expense.amount,
          description: `Expense: ${expense.title} (${expense.category})`,
          referenceType: "EXPENSE",
          referenceId: expense.id,
        },
      })
    }

    revalidatePath("/dashboard/expenses")
    revalidatePath("/dashboard")
    return { success: true, data: expense }
  } catch (error) {
    console.error("Expense creation failed:", error)
    return { error: "Failed to create expense." }
  }
}

export async function approveExpense(id: string) {
  try {
    const session = await auth()
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: session?.user?.id,
        approvedAt: new Date(),
      },
    })

    // Create ledger entry if has account
    if (expense.accountId) {
      await prisma.ledgerEntry.create({
        data: {
          accountId: expense.accountId,
          type: "EXPENSE",
          amount: expense.amount,
          description: `Expense: ${expense.title} (${expense.category})`,
          referenceType: "EXPENSE",
          referenceId: expense.id,
        },
      })
    }

    revalidatePath("/dashboard/expenses")
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Failed to approve expense." }
  }
}

export async function rejectExpense(id: string) {
  try {
    await prisma.expense.update({
      where: { id },
      data: { status: "REJECTED" },
    })
    revalidatePath("/dashboard/expenses")
    return { success: true }
  } catch {
    return { error: "Failed to reject expense." }
  }
}

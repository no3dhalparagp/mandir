"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ChequeNature, ExpenseCategory, PaymentMode } from "@prisma/client"
import { requirePermission, requireAuth } from "@/lib/authorization"
import { createAssetRecord } from "@/lib/accounting"

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
  chequeLeafId: z.string().optional(),
  isAssetPurchase: z.boolean().optional(),
  assetName: z.string().optional(),
  assetCategory: z.string().optional(),
  assetUsefulLifeYears: z.coerce.number().int().positive().optional(),
  assetLocation: z.string().optional(),
  notes: z.string().optional(),
})

export async function createExpense(data: z.infer<typeof expenseSchema>) {
  try {
    await requirePermission("expenses", "create")
    const validatedData = expenseSchema.parse(data)
    const user = await requireAuth()

    const isAutoApproved =
      user.role === "SUPER_ADMIN" || user.role === "COMMITTEE_ADMIN"

    let chequeLeaf:
      | {
          id: string
          chequeNumber: string
          status: "UNUSED" | "ISSUED" | "CANCELLED"
        }
      | null = null

    if (validatedData.paymentMode === "CHEQUE" && validatedData.chequeLeafId) {
      chequeLeaf = await prisma.chequeBookLeaf.findUnique({
        where: { id: validatedData.chequeLeafId },
        select: { id: true, chequeNumber: true, status: true },
      })
      if (!chequeLeaf || chequeLeaf.status !== "UNUSED") {
        return { error: "Selected cheque leaf is not available for use." }
      }
    }

    const chequeNumber = chequeLeaf?.chequeNumber || validatedData.chequeNumber

    const expense = await prisma.expense.create({
      data: {
        title: validatedData.title,
        category: validatedData.category,
        amount: validatedData.amount,
        vendorName: validatedData.vendorName || undefined,
        vendorMobile: validatedData.vendorMobile || undefined,
        paymentMode: validatedData.paymentMode,
        chequeNumber: chequeNumber || undefined,
        chequeDate: validatedData.chequeDate ? new Date(validatedData.chequeDate) : undefined,
        transactionId: validatedData.transactionId || undefined,
        billNumber: validatedData.billNumber || undefined,
        accountId: validatedData.accountId || undefined,
        chequeLeafId: chequeLeaf?.id,
        notes: validatedData.notes || undefined,
        status: isAutoApproved ? "APPROVED" : "PENDING",
        approvedById: isAutoApproved ? user.id : undefined,
        approvedAt: isAutoApproved ? new Date() : undefined,
      },
    })

    if (
      validatedData.paymentMode === "CHEQUE" &&
      chequeNumber &&
      validatedData.chequeDate
    ) {
      await prisma.chequeRegister.create({
        data: {
          chequeNumber: chequeNumber,
          chequeDate: new Date(validatedData.chequeDate),
          amount: expense.amount,
          partyName: validatedData.vendorName || expense.title,
          nature: ChequeNature.ISSUED,
          accountId: validatedData.accountId || undefined,
          expenseId: expense.id,
          chequeLeafId: chequeLeaf?.id,
          notes: `Auto-created from expense ${expense.title}`,
        },
      })

      if (chequeLeaf?.id) {
        await prisma.chequeBookLeaf.update({
          where: { id: chequeLeaf.id },
          data: { status: "ISSUED", issuedAt: new Date() },
        })
      }
    }

    if (validatedData.isAssetPurchase) {
      await createAssetRecord({
        name: validatedData.assetName || validatedData.title,
        category: validatedData.assetCategory || validatedData.category,
        purchaseDate: new Date(),
        purchaseValue: validatedData.amount,
        usefulLifeYears: validatedData.assetUsefulLifeYears,
        purchaseAccountId: validatedData.accountId || undefined,
        location: validatedData.assetLocation || undefined,
        vendorName: validatedData.vendorName || undefined,
        invoiceNumber: validatedData.billNumber || undefined,
        notes: `Asset created from expense ${expense.title}`,
      })
    }

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

      await recalculateBalancesForAccount(validatedData.accountId)
    }

    revalidatePath("/dashboard/expenses")
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/registers/cheques")
    revalidatePath("/dashboard/registers/assets")
    return { success: true, data: expense }
  } catch (error) {
    console.error("Expense creation failed:", error)
    const message = error instanceof Error ? error.message : "Failed to create expense."
    return { error: message }
  }
}

export async function approveExpense(id: string) {
  try {
    await requirePermission("expenses", "approve")
    const user = await requireAuth()
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: user.id,
        approvedAt: new Date(),
      },
    })

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

      await recalculateBalancesForAccount(expense.accountId)
    }

    revalidatePath("/dashboard/expenses")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve expense."
    return { error: message }
  }
}

export async function rejectExpense(id: string) {
  try {
    await requirePermission("expenses", "approve")
    await prisma.expense.update({
      where: { id },
      data: { status: "REJECTED" },
    })
    revalidatePath("/dashboard/expenses")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reject expense."
    return { error: message }
  }
}

export async function getExpenses() {
  await requirePermission("expenses", "read")
  return prisma.expense.findMany({
    orderBy: { createdAt: "desc" },
    include: { account: true, approvedBy: { select: { name: true } } },
    take: 100,
  })
}

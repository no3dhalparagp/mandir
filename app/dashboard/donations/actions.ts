"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ChequeNature, DonationCategory, PaymentMode } from "@prisma/client"
import { requirePermission } from "@/lib/authorization"
import { assertDateNotClosed } from "@/lib/book-closure"

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

const donationSchema = z.object({
  donorName: z.string().min(2, "Name must be at least 2 characters."),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  category: z.nativeEnum(DonationCategory),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  paymentMode: z.nativeEnum(PaymentMode),
  transactionId: z.string().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().optional(),
  bankNameCheque: z.string().optional(),
  accountId: z.string().optional(),
  collectedByMemberId: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => data.accountId || data.collectedByMemberId, {
  message: "Either select a Deposit Account or a Collected by Member.",
  path: ["accountId"],
})

export async function createDonation(data: z.infer<typeof donationSchema>) {
  try {
    await requirePermission("donations", "create")
    const validatedData = donationSchema.parse(data)
    await assertDateNotClosed(new Date(), "Donation entry")

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const randomStr = Math.floor(1000 + Math.random() * 9000)
    const receiptNo = `RCPT-${dateStr}-${randomStr}`

    const donation = await prisma.donation.create({
      data: {
        donorName: validatedData.donorName,
        mobileNumber: validatedData.mobileNumber || undefined,
        address: validatedData.address || undefined,
        category: validatedData.category,
        amount: validatedData.amount,
        paymentMode: validatedData.paymentMode,
        transactionId: validatedData.transactionId || undefined,
        chequeNumber: validatedData.chequeNumber || undefined,
        chequeDate: validatedData.chequeDate ? new Date(validatedData.chequeDate) : undefined,
        bankNameCheque: validatedData.bankNameCheque || undefined,
        accountId: validatedData.accountId || undefined,
        collectedByMemberId: validatedData.collectedByMemberId || undefined,
        receiptNo,
        notes: validatedData.notes || undefined,
      },
    })

    if (
      validatedData.paymentMode === "CHEQUE" &&
      validatedData.chequeNumber &&
      validatedData.chequeDate
    ) {
      await prisma.chequeRegister.create({
        data: {
          chequeNumber: validatedData.chequeNumber,
          chequeDate: new Date(validatedData.chequeDate),
          bankName: validatedData.bankNameCheque || undefined,
          amount: donation.amount,
          partyName: donation.donorName,
          nature: ChequeNature.RECEIVED,
          accountId: validatedData.accountId || undefined,
          donationId: donation.id,
          notes: `Auto-created from donation receipt ${donation.receiptNo}`,
        },
      })
    }

    if (validatedData.collectedByMemberId) {
      await prisma.memberCollection.create({
        data: {
          memberId: validatedData.collectedByMemberId,
          donationId: donation.id,
          collectedAmount: donation.amount,
        },
      })

      // Create or get member account
      let memberAccount = await prisma.memberAccount.findUnique({
        where: { memberId: validatedData.collectedByMemberId },
      })

      if (!memberAccount) {
        memberAccount = await prisma.memberAccount.create({
          data: {
            memberId: validatedData.collectedByMemberId,
            openingBalance: 0,
            currentBalance: 0,
          },
        })
      }

      // Get previous balance for passbook entry
      const lastEntry = await prisma.passbook.findFirst({
        where: { memberAccountId: memberAccount.id },
        orderBy: { date: "desc" },
      })

      const previousBalance = lastEntry?.balance || memberAccount.openingBalance
      const newBalance = previousBalance + donation.amount

      // Create passbook entry
      await prisma.passbook.create({
        data: {
          memberAccountId: memberAccount.id,
          date: new Date(),
          description: `Donation collected - ${donation.donorName} (${donation.category})`,
          referenceType: "DONATION",
          referenceId: donation.id,
          credit: donation.amount,
          debit: 0,
          balance: newBalance,
        },
      })

      // Update member account balance
      await prisma.memberAccount.update({
        where: { id: memberAccount.id },
        data: { currentBalance: newBalance },
      })
    }

    if (validatedData.accountId && !validatedData.collectedByMemberId) {
      await prisma.ledgerEntry.create({
        data: {
          accountId: validatedData.accountId,
          type: "INCOME",
          amount: donation.amount,
          description: `Donation from ${donation.donorName} (${donation.category})`,
          referenceType: "DONATION",
          referenceId: donation.id,
        },
      })

      await recalculateBalancesForAccount(validatedData.accountId)
    }

    revalidatePath("/dashboard/donations")
    revalidatePath("/dashboard/bank")
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/registers/cheques")
    return { success: true, data: donation }
  } catch (error) {
    console.error("Donation creation failed:", error)
    const message = error instanceof Error ? error.message : "Failed to create donation."
    return { error: message }
  }
}

export async function getDonationAccounts() {
  await requirePermission("donations", "read")
  return prisma.bankAccount.findMany({
    where: { isActive: true },
    select: { id: true, name: true, accountType: true },
    orderBy: { name: "asc" },
  })
}

export async function getCollectorMembers() {
  await requirePermission("donations", "read")
  return prisma.member.findMany({
    where: { canCollect: true, status: "ACTIVE" },
    select: { id: true, name: true, memberId: true },
    orderBy: { name: "asc" },
  })
}

export async function getDonations() {
  await requirePermission("donations", "read")
  return prisma.donation.findMany({
    orderBy: { createdAt: "desc" },
    include: { account: true, collectedByMember: true },
    take: 100,
  })
}

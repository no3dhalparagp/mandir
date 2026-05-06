"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { DonationCategory, PaymentMode } from "@prisma/client"

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
    const validatedData = donationSchema.parse(data)

    // Generate a receipt number: RCPT-YYYYMMDD-RANDOM
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

    // If collected by a member, create a MemberCollection entry
    if (validatedData.collectedByMemberId) {
      await prisma.memberCollection.create({
        data: {
          memberId: validatedData.collectedByMemberId,
          donationId: donation.id,
          collectedAmount: donation.amount,
        },
      })
    }

    // If payment goes directly to an account (not via member), create ledger entry
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
    }

    revalidatePath("/dashboard/donations")
    revalidatePath("/dashboard/bank")
    revalidatePath("/dashboard")
    return { success: true, data: donation }
  } catch (error) {
    console.error("Donation creation failed:", error)
    return { error: "Failed to create donation." }
  }
}

export async function getDonationAccounts() {
  return prisma.bankAccount.findMany({
    where: { isActive: true },
    select: { id: true, name: true, accountType: true },
    orderBy: { name: "asc" },
  })
}

export async function getCollectorMembers() {
  return prisma.member.findMany({
    where: { canCollect: true, status: "ACTIVE" },
    select: { id: true, name: true, memberId: true },
    orderBy: { name: "asc" },
  })
}

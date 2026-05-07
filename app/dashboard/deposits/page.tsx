import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DepositVerificationClient } from "@/components/deposits/deposit-verification-client"

export const metadata = {
  title: "Deposit Verification | Dashboard",
  description: "Verify and manage bank deposits",
}

export default async function DepositsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const isAdmin = ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"].includes(
    session.user.role
  )

  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Fetch bank accounts
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      bankName: true,
      accountNumber: true,
    },
    orderBy: { name: "asc" },
  })

  // Fetch pending and verified deposits
  const deposits = await prisma.depositVerification.findMany({
    where: {
      status: { in: ["PENDING", "VERIFIED"] },
    },
    include: {
      member: { select: { name: true, memberId: true } },
      bankAccount: { select: { id: true, name: true, bankName: true } },
    },
    orderBy: { depositDate: "desc" },
  })

  return (
    <DepositVerificationClient
      bankAccounts={bankAccounts}
      deposits={JSON.parse(JSON.stringify(deposits))}
    />
  )
}

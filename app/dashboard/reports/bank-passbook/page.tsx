import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { BankPassbookClient } from "@/components/reports/bank-passbook-client"

export const metadata = {
  title: "Bank Passbook | Reports",
  description: "Track bank account transactions by account",
}

export default async function BankPassbookPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Fetch all bank accounts
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      bankName: true,
      accountNumber: true,
      accountType: true,
    },
    orderBy: { name: "asc" },
  })

  // Fetch deposit verifications for pending/verified status
  const depositVerifications = await prisma.depositVerification.findMany({
    where: {
      status: { in: ["PENDING", "VERIFIED"] },
    },
    include: {
      member: { select: { name: true, memberId: true } },
      bankAccount: { select: { id: true, name: true } },
    },
    orderBy: { depositDate: "desc" },
  })

  return (
    <BankPassbookClient
      bankAccounts={bankAccounts as any}
      depositVerifications={JSON.parse(JSON.stringify(depositVerifications))}
      userRole={session.user.role}
    />
  )
}

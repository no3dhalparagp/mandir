import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getDonationAccounts, getCollectorMembers } from "./actions"
import { DonationsPageClient } from "@/components/donations/donations-page-client"

export default async function DonationsPage() {
  const session = await auth()
  const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id }, include: { member: true } }) : null
  const loggedInMemberId = user?.member?.id
  const isAdminOrAccountant = user && ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"].includes(user.role)

  const [donations, accounts, collectors] = await Promise.all([
    prisma.donation.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        account: { select: { name: true } },
        collectedByMember: { select: { name: true, memberId: true } },
      },
    }),
    getDonationAccounts(),
    getCollectorMembers(),
  ])

  return (
    <DonationsPageClient
      donations={JSON.parse(JSON.stringify(donations))}
      accounts={accounts}
      collectors={collectors}
      loggedInMemberId={loggedInMemberId}
      isAdminOrAccountant={isAdminOrAccountant}
    />
  )
}

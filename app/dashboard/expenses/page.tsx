import { prisma } from "@/lib/prisma"
import { ExpensesPageClient } from "@/components/expenses/expenses-page-client"

export default async function ExpensesPage() {
  const [expenses, accounts, chequeLeaves] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        account: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
    }),
    prisma.bankAccount.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.chequeBookLeaf.findMany({
      where: { status: "UNUSED" },
      select: {
        id: true,
        chequeNumber: true,
        accountId: true,
        account: { select: { name: true } },
      },
      orderBy: { chequeNumber: "asc" },
      take: 300,
    }),
  ])

  return (
    <ExpensesPageClient
      expenses={JSON.parse(JSON.stringify(expenses))}
      accounts={accounts}
      chequeLeaves={JSON.parse(JSON.stringify(chequeLeaves))}
    />
  )
}

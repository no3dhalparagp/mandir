import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExpensesPageClient } from "@/components/expenses/expenses-page-client"

export default async function ExpensesPage() {
  const [expenses, accounts] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        account: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
    }),
    prisma.bankAccount.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ])

  return (
    <ExpensesPageClient
      expenses={JSON.parse(JSON.stringify(expenses))}
      accounts={accounts}
    />
  )
}

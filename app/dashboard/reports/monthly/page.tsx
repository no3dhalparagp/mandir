import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function MonthlyReportPage() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [donations, expenses] = await Promise.all([
    prisma.donation.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } }),
    prisma.expense.findMany({ where: { expenseDate: { gte: monthStart, lte: monthEnd } } }),
  ])

  const totalIncome = donations.reduce((s, d) => s + d.amount, 0)
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)

  // Category-wise breakdown
  const donationByCategory: Record<string, number> = {}
  donations.forEach((d) => { donationByCategory[d.category] = (donationByCategory[d.category] || 0) + d.amount })

  const expenseByCategory: Record<string, number> = {}
  expenses.forEach((e) => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monthly Financial Statement</h1>
        <p className="text-muted-foreground">{format(now, "MMMM yyyy")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Income</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Expense</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">₹{totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2"><CardTitle className="text-sm opacity-80">Net Surplus / Deficit</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₹{(totalIncome - totalExpense).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Donations by Category</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount (₹)</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.keys(donationByCategory).length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-16">No data</TableCell></TableRow>
                ) : (
                  Object.entries(donationByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                    <TableRow key={cat}>
                      <TableCell>{cat.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount (₹)</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.keys(expenseByCategory).length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-16">No data</TableCell></TableRow>
                ) : (
                  Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                    <TableRow key={cat}>
                      <TableCell>{cat.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

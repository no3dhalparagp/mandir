import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function ExpenseReportPage() {
  const expenses = await prisma.expense.findMany({ orderBy: { expenseDate: "desc" } })

  const byCategory: Record<string, { count: number; total: number }> = {}
  const byStatus: Record<string, { count: number; total: number }> = {}

  expenses.forEach((e) => {
    if (!byCategory[e.category]) byCategory[e.category] = { count: 0, total: 0 }
    byCategory[e.category].count++
    byCategory[e.category].total += e.amount

    if (!byStatus[e.status]) byStatus[e.status] = { count: 0, total: 0 }
    byStatus[e.status].count++
    byStatus[e.status].total += e.amount
  })

  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expense Summary</h1>
        <p className="text-muted-foreground">{expenses.length} expenses · ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} total</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Count</TableHead><TableHead className="text-right">Total (₹)</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total).map(([cat, data]) => (
                  <TableRow key={cat}>
                    <TableCell><Badge variant="outline">{cat.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>{data.count}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">₹{data.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>By Status</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Count</TableHead><TableHead className="text-right">Total (₹)</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.entries(byStatus).map(([status, data]) => (
                  <TableRow key={status}>
                    <TableCell><Badge variant={status === "APPROVED" ? "default" : status === "REJECTED" ? "destructive" : "secondary"}>{status}</Badge></TableCell>
                    <TableCell>{data.count}</TableCell>
                    <TableCell className="text-right font-medium">₹{data.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

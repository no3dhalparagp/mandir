import { prisma } from "@/lib/prisma"
import { format, startOfDay, endOfDay } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function DailyReportPage() {
  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  const [donations, expenses] = await Promise.all([
    prisma.donation.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      orderBy: { date: "desc" },
    }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: todayStart, lte: todayEnd } },
      orderBy: { expenseDate: "desc" },
    }),
  ])

  const totalDonations = donations.reduce((s, d) => s + d.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Collection Report</h1>
        <p className="text-muted-foreground">{format(today, "EEEE, dd MMMM yyyy")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Today&apos;s Donations</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">₹{totalDonations.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">{donations.length} entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Today&apos;s Expenses</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">{expenses.length} entries</p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2"><CardTitle className="text-sm opacity-80">Net Today</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{(totalDonations - totalExpenses).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Donations Today</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-16 text-center text-muted-foreground">No donations today.</TableCell></TableRow>
              ) : (
                donations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.receiptNo}</TableCell>
                    <TableCell>{d.donorName}</TableCell>
                    <TableCell><Badge variant="outline">{d.category}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{d.paymentMode}</Badge></TableCell>
                    <TableCell className="text-right font-bold text-green-600">{d.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Expenses Today</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-16 text-center text-muted-foreground">No expenses today.</TableCell></TableRow>
              ) : (
                expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.title}</TableCell>
                    <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                    <TableCell><Badge variant={e.status === "APPROVED" ? "default" : "secondary"}>{e.status}</Badge></TableCell>
                    <TableCell className="text-right font-bold text-red-600">{e.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

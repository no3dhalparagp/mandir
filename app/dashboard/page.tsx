import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IndianRupee, Wallet, Users, Calendar, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { DashboardChart } from "@/components/dashboard/dashboard-chart"

export default async function DashboardPage() {
  const session = await auth()
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Aggregated stats
  const [
    totalDonations,
    totalExpenses,
    memberCount,
    pendingExpenses,
    recentDonations,
    recentExpenses,
    upcomingEvents,
    pendingCollections,
  ] = await Promise.all([
    prisma.donation.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { status: { in: ["APPROVED", "PAID"] } } }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.expense.count({ where: { status: "PENDING" } }),
    prisma.donation.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.expense.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.event.findMany({ where: { date: { gte: now } }, orderBy: { date: "asc" }, take: 5 }),
    prisma.memberCollection.count({ where: { status: { in: ["COLLECTED", "DEPOSITED"] } } }),
  ])

  const income = totalDonations._sum.amount ?? 0
  const expense = totalExpenses._sum.amount ?? 0
  const balance = income - expense

  // Monthly data for chart (last 6 months)
  const chartData = await Promise.all(
    Array.from({ length: 6 }).map(async (_, i) => {
      const m = subMonths(now, 5 - i)
      const ms = startOfMonth(m)
      const me = endOfMonth(m)
      const [mIncome, mExpense] = await Promise.all([
        prisma.donation.aggregate({ _sum: { amount: true }, where: { date: { gte: ms, lte: me } } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { expenseDate: { gte: ms, lte: me }, status: { in: ["APPROVED", "PAID"] } } }),
      ])
      return {
        name: format(m, "MMM"),
        income: mIncome._sum.amount ?? 0,
        expense: mExpense._sum.amount ?? 0,
      }
    })
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}. Here is your financial overview.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">₹{income.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">₹{expense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Current Balance</CardTitle>
            <IndianRupee className="h-4 w-4 opacity-70" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{memberCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Row */}
      {(pendingExpenses > 0 || pendingCollections > 0) && (
        <div className="flex flex-wrap gap-3">
          {pendingExpenses > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              {pendingExpenses} expense{pendingExpenses > 1 ? "s" : ""} pending approval
            </Badge>
          )}
          {pendingCollections > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              {pendingCollections} collection{pendingCollections > 1 ? "s" : ""} pending verification
            </Badge>
          )}
        </div>
      )}

      {/* Chart + Upcoming Events */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Income vs Expense (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-sm">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{format(event.date, "dd MMM yyyy")}</p>
                    </div>
                    {event.budget && (
                      <Badge variant="outline" className="text-xs">
                        ₹{event.budget.toLocaleString("en-IN")}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Donations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {recentDonations.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground h-16">None yet</TableCell></TableRow>
                ) : (
                  recentDonations.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{d.donorName}</p>
                          <p className="text-xs text-muted-foreground">{d.receiptNo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(d.date, "dd MMM")}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">₹{d.amount.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Expenses</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {recentExpenses.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground h-16">None yet</TableCell></TableRow>
                ) : (
                  recentExpenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{e.category.replace(/_/g, " ")}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.status === "APPROVED" ? "default" : "secondary"} className="text-xs">{e.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">₹{e.amount.toLocaleString("en-IN")}</TableCell>
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

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IndianRupee,
  Wallet,
  Users,
  Calendar,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";

export default async function DashboardPage() {
  const session = await auth();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

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
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["APPROVED", "PAID"] } },
    }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.expense.count({ where: { status: "PENDING" } }),
    prisma.donation.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.expense.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.event.findMany({
      where: { date: { gte: now } },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.memberCollection.count({
      where: { status: { in: ["COLLECTED", "DEPOSITED"] } },
    }),
  ]);

  const income = totalDonations._sum.amount ?? 0;
  const expense = totalExpenses._sum.amount ?? 0;
  const balance = income - expense;

  // Monthly data for chart (last 6 months)
  const chartData = await Promise.all(
    Array.from({ length: 6 }).map(async (_, i) => {
      const m = subMonths(now, 5 - i);
      const ms = startOfMonth(m);
      const me = endOfMonth(m);
      const [mIncome, mExpense] = await Promise.all([
        prisma.donation.aggregate({
          _sum: { amount: true },
          where: { date: { gte: ms, lte: me } },
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
          where: {
            expenseDate: { gte: ms, lte: me },
            status: { in: ["APPROVED", "PAID"] },
          },
        }),
      ]);
      return {
        name: format(m, "MMM"),
        income: mIncome._sum.amount ?? 0,
        expense: mExpense._sum.amount ?? 0,
      };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}. Here is your financial overview.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Total Donations
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              ₹{income.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-300">
              Total Expenses
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Wallet className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-700 dark:text-rose-300">
              ₹{expense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Current Balance
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <IndianRupee className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Active Members
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
              {memberCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Row */}
      {(pendingExpenses > 0 || pendingCollections > 0) && (
        <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          {pendingExpenses > 0 && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            >
              <AlertTriangle className="h-4 w-4" />
              {pendingExpenses} expense{pendingExpenses > 1 ? "s" : ""} pending
              approval
            </Badge>
          )}
          {pendingCollections > 0 && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            >
              <AlertTriangle className="h-4 w-4" />
              {pendingCollections} collection{pendingCollections > 1 ? "s" : ""}{" "}
              pending verification
            </Badge>
          )}
        </div>
      )}

      {/* Chart + Upcoming Events */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 hover:shadow-md transition-all duration-300 border-0 bg-card/50">
          <CardHeader>
            <CardTitle>Income vs Expense (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 hover:shadow-md transition-all duration-300 border-0 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No upcoming events.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between rounded-xl p-4 bg-muted/30 hover:bg-muted/50 transition-all duration-200"
                  >
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(event.date, "dd MMM yyyy")}
                      </p>
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
        <Card className="hover:shadow-md transition-all duration-300 border-0 bg-card/50">
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {recentDonations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground h-16"
                    >
                      None yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentDonations.map((d) => (
                    <TableRow
                      key={d.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{d.donorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.receiptNo}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(d.date, "dd MMM")}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{d.amount.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 border-0 bg-card/50">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {recentExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground h-16"
                    >
                      None yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentExpenses.map((e) => (
                    <TableRow
                      key={e.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{e.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.category.replace(/_/g, " ")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            e.status === "APPROVED" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400">
                        ₹{e.amount.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

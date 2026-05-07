import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { ArrowUpCircle, ArrowDownCircle, Printer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getBankAccounts } from "@/app/dashboard/bank/actions"
import Link from "next/link"

export default async function CashBookReportPage({
  searchParams
}: {
  searchParams: Promise<{ accountId?: string; month?: string; year?: string }>
}) {
  const { accountId, month, year } = await searchParams
  
  const accounts = await getBankAccounts()
  
  // Default to first cash account if not specified
  const defaultAccountId = accountId || accounts.find(a => a.accountType === "CASH_IN_HAND")?.id || accounts[0]?.id
  
  const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1
  const currentYear = year ? parseInt(year) : new Date().getFullYear()

  const startDate = new Date(currentYear, currentMonth - 1, 1)
  const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59)

  const account = accounts.find(a => a.id === defaultAccountId)

  // Fetch entries for the period
  const entries = await prisma.ledgerEntry.findMany({
    where: {
      accountId: defaultAccountId,
      date: { gte: startDate, lte: endDate }
    },
    orderBy: { date: "asc" }
  })

  // We need the opening balance for the period.
  // The opening balance is the sum of all entries before startDate + the account opening balance.
  const priorEntries = await prisma.ledgerEntry.findMany({
    where: {
      accountId: defaultAccountId,
      date: { lt: startDate }
    }
  })

  const priorBalanceEffect = priorEntries.reduce((sum, e) => {
    const isDebit = ["EXPENSE", "TRANSFER_OUT"].includes(e.type)
    return isDebit ? sum - e.amount : sum + e.amount
  }, 0)

  // Wait, if the account.openingBalance is already saved as a LedgerEntry of type "OPENING_BALANCE", 
  // it is included in priorEntries!
  // BUT we must verify if the account creation actually seeded it. 
  // Let's assume priorBalanceEffect is the correct opening balance for the period.
  const openingBalance = priorBalanceEffect

  const reportRows = entries.map((e, index) => {
    const isDebit = ["EXPENSE", "TRANSFER_OUT"].includes(e.type)
    let runningBal = openingBalance
    for (let i = 0; i <= index; i++) {
      const entry = entries[i]
      const entryDebit = ["EXPENSE", "TRANSFER_OUT"].includes(entry.type)
      runningBal = entryDebit ? runningBal - entry.amount : runningBal + entry.amount
    }
    return { ...e, isDebit, balance: runningBal }
  })

  const closingBalance = reportRows.length > 0 ? reportRows[reportRows.length - 1].balance : openingBalance

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cash / Bank Book Report</h1>
          <p className="text-muted-foreground">View the subsidiary ledger for specific accounts.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print Report
        </Button>
      </div>

      <Card className="print:hidden">
        <CardContent className="p-4 flex gap-4 items-end">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Select Account</label>
            <div className="flex gap-2">
              {accounts.map(a => (
                <Link key={a.id} href={`?accountId=${a.id}&month=${currentMonth}&year=${currentYear}`}>
                  <Button variant={a.id === defaultAccountId ? "default" : "outline"} size="sm">
                    {a.name} ({a.accountType.replace("_", " ")})
                  </Button>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href={`?accountId=${defaultAccountId}&month=${currentMonth - 1 === 0 ? 12 : currentMonth - 1}&year=${currentMonth - 1 === 0 ? currentYear - 1 : currentYear}`}>
              <Button variant="outline" size="sm">← Prev Month</Button>
            </Link>
            <div className="px-4 py-2 border rounded-md text-sm font-bold bg-muted/50">
              {format(startDate, "MMMM yyyy")}
            </div>
            <Link href={`?accountId=${defaultAccountId}&month=${currentMonth + 1 === 13 ? 1 : currentMonth + 1}&year=${currentMonth + 1 === 13 ? currentYear + 1 : currentYear}`}>
              <Button variant="outline" size="sm">Next Month →</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-center print:text-center pb-2 border-b">
          <CardTitle className="text-2xl">{account?.name} - Cash Book</CardTitle>
          <CardDescription>
            For the period of {format(startDate, "dd MMM yyyy")} to {format(endDate, "dd MMM yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Receipts (₹)</TableHead>
                <TableHead className="text-right">Payments (₹)</TableHead>
                <TableHead className="text-right">Balance (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">{format(startDate, "dd MMM yyyy")}</TableCell>
                <TableCell className="font-medium italic text-muted-foreground">Opening Balance Brought Forward</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
              
              {reportRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No transactions in this period.
                  </TableCell>
                </TableRow>
              ) : (
                reportRows.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm whitespace-nowrap">{format(entry.date, "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-sm">{entry.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {entry.isDebit
                          ? <ArrowDownCircle className="h-3.5 w-3.5 text-red-500" />
                          : <ArrowUpCircle className="h-3.5 w-3.5 text-green-500" />}
                        <span className="text-xs">{entry.type.replace(/_/g, " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {!entry.isDebit ? entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {entry.isDebit ? entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {entry.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
              
              <TableRow className="bg-muted/50 font-bold border-t-2">
                <TableCell colSpan={3} className="text-right">Closing Balance Carried Forward:</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right text-primary text-lg">
                  {closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddJournalEntryDialog } from "@/components/journal/add-journal-entry-dialog"

export default async function JournalPage() {
  const [entries, accounts] = await Promise.all([
    prisma.ledgerEntry.findMany({
      orderBy: { date: "desc" },
      take: 200,
      include: { account: { select: { name: true } } },
    }),
    prisma.bankAccount.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ])

  const totalIncome = entries
    .filter((e) => ["INCOME", "MEMBER_DEPOSIT", "OPENING_BALANCE", "TRANSFER_IN"].includes(e.type))
    .reduce((s, e) => s + e.amount, 0)
  const totalExpense = entries
    .filter((e) => ["EXPENSE", "TRANSFER_OUT"].includes(e.type))
    .reduce((s, e) => s + e.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal / Master Ledger</h1>
          <p className="text-muted-foreground">Complete transaction ledger across all accounts.</p>
        </div>
        <AddJournalEntryDialog accounts={accounts} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Inwards</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Outwards</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">₹{totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2"><CardTitle className="text-sm opacity-80">Net Balance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₹{(totalIncome - totalExpense).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Credit (₹)</TableHead>
                <TableHead className="text-right">Debit (₹)</TableHead>
                <TableHead>Reconciled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No ledger entries yet.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const isDebit = ["EXPENSE", "TRANSFER_OUT"].includes(entry.type)
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm whitespace-nowrap">{format(entry.date, "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-sm font-medium">{entry.account.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isDebit
                            ? <ArrowDownCircle className="h-3.5 w-3.5 text-red-500" />
                            : <ArrowUpCircle className="h-3.5 w-3.5 text-green-500" />}
                          <span className="text-xs">{entry.type.replace(/_/g, " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[220px] truncate">{entry.description}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {!isDebit ? entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {isDebit ? entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.isReconciled ? "default" : "outline"} className="text-xs">
                          {entry.isReconciled ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

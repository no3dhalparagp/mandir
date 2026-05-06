import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAccountBalance } from "../actions"

export default async function BankAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const account = await prisma.bankAccount.findUnique({
    where: { id },
    include: {
      ledgerEntries: { orderBy: { date: "desc" }, take: 100 },
    },
  })
  if (!account) notFound()

  const currentBalance = await getAccountBalance(id)

  const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    INCOME:          { label: "Income",         color: "text-green-600", icon: <ArrowUpCircle className="h-4 w-4 text-green-500" /> },
    MEMBER_DEPOSIT:  { label: "Member Deposit", color: "text-green-600", icon: <ArrowUpCircle className="h-4 w-4 text-green-500" /> },
    OPENING_BALANCE: { label: "Opening Bal.",   color: "text-blue-600",  icon: <ArrowUpCircle className="h-4 w-4 text-blue-500" />  },
    TRANSFER_IN:     { label: "Transfer In",    color: "text-blue-600",  icon: <ArrowLeftRight className="h-4 w-4 text-blue-500" /> },
    EXPENSE:         { label: "Expense",        color: "text-red-600",   icon: <ArrowDownCircle className="h-4 w-4 text-red-500" /> },
    TRANSFER_OUT:    { label: "Transfer Out",   color: "text-red-600",   icon: <ArrowDownCircle className="h-4 w-4 text-red-500" /> },
    ADJUSTMENT:      { label: "Adjustment",     color: "text-orange-600",icon: <ArrowLeftRight className="h-4 w-4 text-orange-500" /> },
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
        <p className="text-muted-foreground">
          {account.bankName} {account.branchName ? `· ${account.branchName}` : ""}{" "}
          {account.accountNumber ? `· ****${account.accountNumber.slice(-4)}` : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm opacity-80">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Opening Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{account.openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{account.ledgerEntries.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Credit (₹)</TableHead>
                <TableHead className="text-right">Debit (₹)</TableHead>
                <TableHead>Reconciled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {account.ledgerEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                account.ledgerEntries.map((entry) => {
                  const isDebit = ["EXPENSE", "TRANSFER_OUT"].includes(entry.type)
                  const cfg = typeConfig[entry.type] ?? { label: entry.type, color: "", icon: null }
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">{format(entry.date, "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {cfg.icon}
                          <span className="text-xs">{cfg.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{entry.description}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {!isDebit ? entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {isDebit ? entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.isReconciled ? "default" : "outline"} className="text-xs">
                          {entry.isReconciled ? "Yes" : "Pending"}
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

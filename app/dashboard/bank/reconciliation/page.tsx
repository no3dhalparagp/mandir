import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Plus, CreditCard } from "lucide-react"
import Link from "next/link"

export default async function ReconciliationPage() {
  const reconciliations = await prisma.bankReconciliation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      account: { select: { name: true } },
      reconciledBy: { select: { name: true } },
      items: true,
    },
  })

  const statusColors: Record<string, "default" | "secondary" | "outline"> = {
    COMPLETED: "default",
    IN_PROGRESS: "secondary",
    DRAFT: "outline",
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Reconciliation</h1>
          <p className="text-muted-foreground">
            Match bank statements against book entries to find discrepancies.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/registers/cheques">
            <Button variant="outline" className="gap-2">
              <CreditCard className="h-4 w-4" /> Cheque Management
            </Button>
          </Link>
          <Link href="/dashboard/bank/reconciliation/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Reconciliation
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Reconciliation Works</CardTitle>
          <CardDescription>
            Compare your ledger entries with the bank statement to identify
            unmatched transactions, timing differences, and errors.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Select a bank account and statement period.</p>
          <p>2. Enter the bank statement opening and closing balances.</p>
          <p>3. Mark each ledger entry as reconciled or flag discrepancies.</p>
          <p>4. The system calculates the difference between book and bank balances.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Book Balance</TableHead>
                <TableHead>Bank Balance</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No reconciliations yet.
                  </TableCell>
                </TableRow>
              ) : (
                reconciliations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.account.name}</TableCell>
                    <TableCell className="text-sm">
                      {format(r.statementFromDate, "dd MMM")} — {format(r.statementToDate, "dd MMM yy")}
                    </TableCell>
                    <TableCell>₹{r.closingBalanceBook.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>₹{r.closingBalanceBank.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className={r.difference !== 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                      ₹{r.difference.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell><Badge variant={statusColors[r.status]}>{r.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.reconciledBy?.name ?? "—"}</TableCell>
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

import { getFundTransfers } from "./actions"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { ArrowLeftRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FundTransferDialog } from "@/components/bank/fund-transfer-dialog"

export default async function FundTransfersPage() {
  const [transfers, accounts] = await Promise.all([
    getFundTransfers(),
    prisma.bankAccount.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fund Transfers</h1>
          <p className="text-muted-foreground">Transfer funds between bank and cash accounts.</p>
        </div>
        <FundTransferDialog accounts={accounts} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From Account</TableHead>
                <TableHead></TableHead>
                <TableHead>To Account</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No transfers recorded.
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{format(t.transferDate, "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-medium">{t.fromAccount.name}</TableCell>
                    <TableCell><ArrowLeftRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                    <TableCell className="font-medium">{t.toAccount.name}</TableCell>
                    <TableCell className="text-right font-bold">₹{t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.referenceNo ?? "—"}</TableCell>
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

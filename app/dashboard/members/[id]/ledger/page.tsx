import { prisma } from "@/lib/prisma"
import { getMemberLedger } from "@/app/dashboard/collections/actions"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function MemberLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const member = await prisma.member.findUnique({ where: { id } })
  if (!member) notFound()

  const { collections, totalCollected, totalDeposited, totalVerified, pendingDeposit, pendingVerification, outstanding } = await getMemberLedger(id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{member.name} — Ledger</h1>
        <p className="text-muted-foreground">{member.memberId} · {member.designation}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Collected</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₹{totalCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Deposit</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">₹{pendingDeposit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Verification</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">₹{pendingVerification.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Deposited</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₹{totalDeposited.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Verified</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">₹{totalVerified.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card className={outstanding > 0 ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : ""}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Available Balance (Cash)</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-bold ${outstanding > 0 ? "text-amber-600" : "text-green-600"}`}>₹{outstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Collection History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Donor / Receipt</TableHead>
                <TableHead>Collected (₹)</TableHead>
                <TableHead>Deposited To</TableHead>
                <TableHead>Verified (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No collections found for this member.
                  </TableCell>
                </TableRow>
              ) : (
                collections.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{format(c.collectedDate, "dd MMM yy")}</TableCell>
                    <TableCell>
                      <p className="text-sm">{c.donation.donorName}</p>
                      <p className="text-xs text-muted-foreground">{c.donation.receiptNo}</p>
                    </TableCell>
                    <TableCell className="font-medium">₹{c.collectedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-sm">{c.depositedToAccount?.name ?? "—"}</TableCell>
                    <TableCell className="font-medium">{c.verifiedAmount != null ? `₹${c.verifiedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}</TableCell>
                    <TableCell><Badge variant={c.status === "VERIFIED" ? "default" : c.status === "DISCREPANT" ? "destructive" : "secondary"} className="text-xs">{c.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.verifiedBy?.name ?? "—"}</TableCell>
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

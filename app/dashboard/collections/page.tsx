import { getAllCollections } from "./actions"
import { getBankAccounts } from "@/app/dashboard/bank/actions"
import { format } from "date-fns"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VerifyCollectionButton } from "@/components/collections/verify-collection-button"
import { DepositCollectionButton } from "@/components/collections/deposit-collection-button"

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  COLLECTED: "secondary",
  DEPOSITED: "outline",
  VERIFIED: "default",
  DISCREPANT: "destructive",
}

export default async function CollectionsPage() {
  const session = await auth()
  const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null
  const isAdminOrAccountant = user && ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"].includes(user.role)

  const collections = await getAllCollections()
  const accounts = await getBankAccounts()

  const pending = collections.filter((c) => ["COLLECTED", "DEPOSITED"].includes(c.status))
  const verified = collections.filter((c) => c.status === "VERIFIED")
  const discrepant = collections.filter((c) => c.status === "DISCREPANT")

  const totalPending = pending.reduce((s, c) => s + c.collectedAmount, 0)
  const totalVerified = verified.reduce((s, c) => s + (c.verifiedAmount ?? c.collectedAmount), 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Member Collections</h1>
        <p className="text-muted-foreground">
          Funds collected by committee members, pending accountant verification.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              ₹{totalPending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">{pending.length} entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Verified &amp; Deposited</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ₹{totalVerified.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">{verified.length} entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Discrepancies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{discrepant.length}</p>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Collections Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Collections</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Donor / Receipt</TableHead>
                <TableHead>Collected (₹)</TableHead>
                <TableHead>Deposited To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified By</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No member collections recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                collections.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{format(c.collectedDate, "dd MMM yy")}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{c.member.name}</p>
                        <p className="text-xs text-muted-foreground">{c.member.memberId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{c.donation.donorName}</p>
                        <p className="text-xs text-muted-foreground">{c.donation.receiptNo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      ₹{c.collectedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.depositedToAccount?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[c.status] ?? "outline"}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.verifiedBy?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.status === "COLLECTED" && (
                        <DepositCollectionButton collectionId={c.id} accounts={accounts} />
                      )}
                      {isAdminOrAccountant && ["DEPOSITED", "COLLECTED"].includes(c.status) && (
                        <div className="ml-2 inline-block">
                          <VerifyCollectionButton collectionId={c.id} collectedAmount={c.collectedAmount} />
                        </div>
                      )}
                    </TableCell>
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

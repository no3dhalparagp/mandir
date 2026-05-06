import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function DonationReportPage() {
  const donations = await prisma.donation.findMany({ orderBy: { date: "desc" } })

  const byCategory: Record<string, { count: number; total: number }> = {}
  const byMode: Record<string, { count: number; total: number }> = {}

  donations.forEach((d) => {
    if (!byCategory[d.category]) byCategory[d.category] = { count: 0, total: 0 }
    byCategory[d.category].count++
    byCategory[d.category].total += d.amount

    if (!byMode[d.paymentMode]) byMode[d.paymentMode] = { count: 0, total: 0 }
    byMode[d.paymentMode].count++
    byMode[d.paymentMode].total += d.amount
  })

  const grandTotal = donations.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Donation Summary</h1>
        <p className="text-muted-foreground">{donations.length} donations · ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} total</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Count</TableHead><TableHead className="text-right">Total (₹)</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total).map(([cat, data]) => (
                  <TableRow key={cat}>
                    <TableCell><Badge variant="outline">{cat.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>{data.count}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">₹{data.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>By Payment Mode</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Mode</TableHead><TableHead>Count</TableHead><TableHead className="text-right">Total (₹)</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.entries(byMode).sort((a, b) => b[1].total - a[1].total).map(([mode, data]) => (
                  <TableRow key={mode}>
                    <TableCell><Badge variant="secondary">{mode.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>{data.count}</TableCell>
                    <TableCell className="text-right font-medium">₹{data.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

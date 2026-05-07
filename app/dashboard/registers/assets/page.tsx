import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/authorization"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AssetRegisterPage() {
  await requirePermission("assets", "read")

  const assets = await prisma.assetRegister.findMany({
    orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }],
    include: {
      purchaseAccount: { select: { name: true } },
      _count: { select: { depreciationEntries: true } },
    },
    take: 200,
  })

  const totalCost = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0)
  const totalBookValue = assets.reduce(
    (sum, asset) => sum + (typeof asset.currentBookValue === "number" ? asset.currentBookValue : asset.purchaseValue),
    0
  )
  const activeCount = assets.filter((asset) => asset.status === "ACTIVE").length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asset Register</h1>
        <p className="text-muted-foreground">
          Maintain fixed assets, purchase value, and depreciation history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gross Asset Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Current Book Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ₹{totalBookValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Funding Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Cost (₹)</TableHead>
                <TableHead className="text-right">Book Value (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                    No assets recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.assetCode}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{asset.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {asset._count.depreciationEntries} depreciation posting(s)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>{format(asset.purchaseDate, "dd MMM yyyy")}</TableCell>
                    <TableCell>{asset.purchaseAccount?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={asset.status === "ACTIVE" ? "default" : "outline"}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {asset.purchaseValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {(typeof asset.currentBookValue === "number" ? asset.currentBookValue : asset.purchaseValue).toLocaleString(
                        "en-IN",
                        { minimumFractionDigits: 2 }
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

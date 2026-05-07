"use client"

import * as React from "react"
import { format } from "date-fns"
import { Download, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DonationForm } from "@/components/donations/donation-form"

interface DonationRow {
  id: string
  receiptNo: string
  date: string
  donorName: string
  category: string
  paymentMode: string
  amount: number
  account?: { name: string } | null
  collectedByMember?: { name: string; memberId: string } | null
}

interface DonationsPageClientProps {
  donations: DonationRow[]
  accounts: { id: string; name: string }[]
  collectors: { id: string; name: string; memberId: string }[]
  loggedInMemberId?: string
  isAdminOrAccountant?: boolean | null
}

export function DonationsPageClient({ 
  donations, accounts, collectors, loggedInMemberId, isAdminOrAccountant 
}: DonationsPageClientProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Donations</h1>
          <p className="text-muted-foreground">Manage and view all mandir donations.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="shadow-md hover:shadow-lg transition-all duration-300" />}>
            <Plus className="mr-2 h-4 w-4" /> Add Donation
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Add New Donation</DialogTitle>
              <DialogDescription>Enter donor details and payment information.</DialogDescription>
            </DialogHeader>
            <DonationForm
              accounts={accounts}
              collectors={collectors}
              loggedInMemberId={loggedInMemberId}
              isAdminOrAccountant={isAdminOrAccountant}
              onSuccess={() => {
                setOpen(false)
                window.location.reload()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 bg-card/50 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Collected By</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No donations found.
                  </TableCell>
                </TableRow>
              ) : (
                donations.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs">{d.receiptNo}</TableCell>
                    <TableCell className="text-sm">{format(new Date(d.date), "dd MMM yy")}</TableCell>
                    <TableCell className="font-medium">{d.donorName}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{d.category}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{d.paymentMode}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.account?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.collectedByMember ? `${d.collectedByMember.name}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {d.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`/api/receipt/${d.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105"
                      >
                        <Download className="h-4 w-4" />
                      </a>
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

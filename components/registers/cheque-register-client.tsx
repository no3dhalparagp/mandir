"use client"

import * as React from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cancelUnusedChequeLeaf, createChequeBook } from "@/app/dashboard/registers/cheques/actions"

type ChequeEntry = {
  id: string
  chequeDate: string
  chequeNumber: string
  nature: "RECEIVED" | "ISSUED"
  partyName?: string | null
  status: "PENDING" | "CLEARED" | "BOUNCED" | "CANCELLED"
  amount: number
  account?: { name: string } | null
  donation?: { receiptNo: string } | null
  expense?: { title: string } | null
}

type ChequeLeaf = {
  id: string
  chequeNumber: string
  status: "UNUSED" | "ISSUED" | "CANCELLED"
  issuedAt?: string | null
  cancelledAt?: string | null
  cancelledReason?: string | null
  account: { name: string }
}

export function ChequeRegisterClient({
  cheques,
  leaves,
  accounts,
}: {
  cheques: ChequeEntry[]
  leaves: ChequeLeaf[]
  accounts: { id: string; name: string }[]
}) {
  const [isPending, startTransition] = React.useTransition()
  const [form, setForm] = React.useState({
    accountId: "",
    bookNo: "",
    startNumber: "",
    endNumber: "",
    notes: "",
  })

  const totalReceived = cheques.filter((c) => c.nature === "RECEIVED").reduce((sum, c) => sum + c.amount, 0)
  const totalIssued = cheques.filter((c) => c.nature === "ISSUED").reduce((sum, c) => sum + c.amount, 0)
  const pendingCount = cheques.filter((c) => c.status === "PENDING").length

  function submitChequeBook() {
    startTransition(async () => {
      const res = await createChequeBook(form)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success("Cheque book added.")
      window.location.reload()
    })
  }

  function cancelLeaf(id: string) {
    startTransition(async () => {
      const res = await cancelUnusedChequeLeaf(id)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success("Cheque leaf cancelled.")
      window.location.reload()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cheque Register</h1>
        <p className="text-muted-foreground">Track cheques and manage cheque-book leaves.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Received</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">₹{totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Issued</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">₹{totalIssued.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Clearance</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{pendingCount}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Add Cheque Book</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Account</Label>
            <Select onValueChange={(v) => setForm((f) => ({ ...f, accountId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Book No.</Label><Input value={form.bookNo} onChange={(e) => setForm((f) => ({ ...f, bookNo: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Start</Label><Input value={form.startNumber} onChange={(e) => setForm((f) => ({ ...f, startNumber: e.target.value }))} /></div>
          <div className="space-y-2"><Label>End</Label><Input value={form.endNumber} onChange={(e) => setForm((f) => ({ ...f, endNumber: e.target.value }))} /></div>
          <div className="flex items-end"><Button onClick={submitChequeBook} disabled={isPending}>Save</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cheque Entries</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Cheque No.</TableHead><TableHead>Nature</TableHead><TableHead>Party</TableHead><TableHead>Account</TableHead><TableHead>Status</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount (₹)</TableHead></TableRow></TableHeader>
            <TableBody>
              {cheques.map((cheque) => (
                <TableRow key={cheque.id}>
                  <TableCell className="text-sm">{format(new Date(cheque.chequeDate), "dd MMM yyyy")}</TableCell>
                  <TableCell className="font-medium">{cheque.chequeNumber}</TableCell>
                  <TableCell><Badge variant={cheque.nature === "RECEIVED" ? "default" : "secondary"}>{cheque.nature}</Badge></TableCell>
                  <TableCell>{cheque.partyName || "-"}</TableCell>
                  <TableCell>{cheque.account?.name || "-"}</TableCell>
                  <TableCell><Badge variant={cheque.status === "CLEARED" ? "default" : "outline"}>{cheque.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{cheque.donation?.receiptNo || cheque.expense?.title || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">{cheque.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cheque Book Leaves</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Cheque No.</TableHead><TableHead>Account</TableHead><TableHead>Status</TableHead><TableHead>Remarks</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-16 text-center text-muted-foreground">No cheque leaves found.</TableCell></TableRow>
              ) : (
                leaves.map((leaf) => (
                  <TableRow key={leaf.id}>
                    <TableCell className="font-medium">{leaf.chequeNumber}</TableCell>
                    <TableCell>{leaf.account.name}</TableCell>
                    <TableCell><Badge variant={leaf.status === "UNUSED" ? "outline" : leaf.status === "ISSUED" ? "default" : "destructive"}>{leaf.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{leaf.cancelledReason || "-"}</TableCell>
                    <TableCell className="text-right">
                      {leaf.status === "UNUSED" && (
                        <Button variant="destructive" size="sm" onClick={() => cancelLeaf(leaf.id)} disabled={isPending}>Cancel</Button>
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

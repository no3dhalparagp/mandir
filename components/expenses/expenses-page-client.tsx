"use client"

import * as React from "react"
import { format } from "date-fns"
import { Plus, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { approveExpense, rejectExpense } from "@/app/dashboard/expenses/actions"

interface ExpenseRow {
  id: string
  title: string
  category: string
  amount: number
  paymentMode: string
  status: string
  expenseDate: string
  account?: { name: string } | null
  approvedBy?: { name: true } | null
}

interface ExpensesPageClientProps {
  expenses: ExpenseRow[]
  accounts: { id: string; name: string }[]
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  APPROVED: "default",
  PENDING: "secondary",
  REJECTED: "destructive",
  PAID: "outline",
}

export function ExpensesPageClient({ expenses, accounts }: ExpensesPageClientProps) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  function handleApprove(id: string) {
    startTransition(async () => {
      const res = await approveExpense(id)
      if (res.error) toast.error(res.error)
      else { toast.success("Expense approved!"); window.location.reload() }
    })
  }

  function handleReject(id: string) {
    startTransition(async () => {
      const res = await rejectExpense(id)
      if (res.error) toast.error(res.error)
      else { toast.success("Expense rejected."); window.location.reload() }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Manage and track mandir expenses with approval workflow.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Record New Expense</DialogTitle>
              <DialogDescription>Enter expense details. Admins auto-approve.</DialogDescription>
            </DialogHeader>
            <ExpenseForm
              accounts={accounts}
              onSuccess={() => { setOpen(false); window.location.reload() }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No expenses found.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell className="text-sm">{format(new Date(e.expenseDate), "dd MMM yy")}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{e.category.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{e.paymentMode}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.account?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant={statusColors[e.status]} className="text-xs">{e.status}</Badge></TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {e.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {e.status === "PENDING" && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleApprove(e.id)} disabled={pending}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => handleReject(e.id)} disabled={pending}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
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

"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createExpense } from "@/app/dashboard/expenses/actions"

const expenseSchema = z.object({
  title: z.string().min(2, "Title is required."),
  category: z.string(),
  amount: z.coerce.number().min(1, "Amount is required"),
  vendorName: z.string().optional(),
  vendorMobile: z.string().optional(),
  paymentMode: z.string(),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().optional(),
  transactionId: z.string().optional(),
  billNumber: z.string().optional(),
  accountId: z.string().optional(),
  notes: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  onSuccess: () => void
  accounts: { id: string; name: string }[]
}

export function ExpenseForm({ onSuccess, accounts }: ExpenseFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [paymentMode, setPaymentMode] = React.useState("CASH")

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: "MISC", paymentMode: "CASH" },
  })

  function onSubmit(data: ExpenseFormData) {
    startTransition(async () => {
      const result = await createExpense(data)
      if (result.error) toast.error(result.error)
      else { toast.success("Expense recorded!"); onSuccess() }
    })
  }

  const showCheque = paymentMode === "CHEQUE" || paymentMode === "DD"
  const showTxn = ["UPI", "NEFT", "RTGS", "IMPS"].includes(paymentMode)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select onValueChange={(v) => setValue("category", v as string)} defaultValue="MISC">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PUJA_MATERIALS">Puja Materials</SelectItem>
              <SelectItem value="ELECTRICITY">Electricity</SelectItem>
              <SelectItem value="SALARY">Salary</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="DECORATION">Decoration</SelectItem>
              <SelectItem value="FOOD_PRASAD">Food / Prasad</SelectItem>
              <SelectItem value="CONSTRUCTION">Construction</SelectItem>
              <SelectItem value="PRINTING">Printing</SelectItem>
              <SelectItem value="TRANSPORT">Transport</SelectItem>
              <SelectItem value="MISC">Miscellaneous</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Amount (₹) *</Label>
          <Input type="number" step="0.01" {...register("amount")} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vendor Name</Label>
          <Input {...register("vendorName")} />
        </div>
        <div className="space-y-2">
          <Label>Bill Number</Label>
          <Input {...register("billNumber")} />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payment Mode</Label>
          <Select onValueChange={(v) => { setValue("paymentMode", v as string); setPaymentMode(v as string) }} defaultValue="CASH">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="CHEQUE">Cheque</SelectItem>
              <SelectItem value="NEFT">NEFT</SelectItem>
              <SelectItem value="RTGS">RTGS</SelectItem>
              <SelectItem value="IMPS">IMPS</SelectItem>
              <SelectItem value="DD">Demand Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Paid from Account</Label>
          <Select onValueChange={(v) => setValue("accountId", (v as string) === "__none" ? "" : v as string)}>
            <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— Not specified —</SelectItem>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showCheque && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cheque No.</Label>
            <Input {...register("chequeNumber")} />
          </div>
          <div className="space-y-2">
            <Label>Cheque Date</Label>
            <Input type="date" {...register("chequeDate")} />
          </div>
        </div>
      )}
      {showTxn && (
        <div className="space-y-2">
          <Label>Transaction / Reference ID</Label>
          <Input {...register("transactionId")} placeholder="UTR / Ref Number" />
        </div>
      )}

      <div className="space-y-2">
        <Label>Notes</Label>
        <Input {...register("notes")} />
      </div>

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Expense
      </Button>
    </form>
  )
}

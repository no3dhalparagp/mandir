"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowUpCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createFundTransfer } from "@/app/dashboard/bank/transfers/actions"

const schema = z.object({
  fromAccountId: z.string().min(1, "Select source cash account"),
  toAccountId: z.string().min(1, "Select target bank account"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function DepositCashDialog({ 
  accounts 
}: { 
  accounts: { id: string; name: string; accountType: string; currentBalance?: number }[] 
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fromAccountId: "", toAccountId: "" }
  })

  // Filter accounts for the dropdowns
  const cashAccounts = accounts.filter(a => a.accountType === "CASH_IN_HAND")
  const bankAccounts = accounts.filter(a => a.accountType !== "CASH_IN_HAND")
  const cannotSubmit = cashAccounts.length === 0 || bankAccounts.length === 0

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await createFundTransfer(data)
      if (res.error) toast.error(res.error)
      else { 
        toast.success("Cash deposited successfully!")
        reset()
        setOpen(false) 
        window.location.reload()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" className="gap-2">
          <ArrowUpCircle className="h-4 w-4 text-green-600" />
          Deposit Cash
        </Button>
      } />
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader><DialogTitle>Deposit Cash to Bank</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>From Cash Account *</Label>
            <Select onValueChange={(v) => setValue("fromAccountId", v as string)}>
              <SelectTrigger><SelectValue placeholder="Select cash account" /></SelectTrigger>
              <SelectContent>
                {cashAccounts.length === 0 ? (
                  <SelectItem value="__none" disabled>No cash accounts found. Please add one first.</SelectItem>
                ) : (
                  cashAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} (Bal: ₹{a.currentBalance?.toLocaleString("en-IN") || "0"})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.fromAccountId && <p className="text-xs text-destructive">{errors.fromAccountId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Deposit To Bank Account *</Label>
            <Select onValueChange={(v) => setValue("toAccountId", v as string)}>
              <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
              <SelectContent>
                {bankAccounts.length === 0 ? (
                  <SelectItem value="__none" disabled>No bank accounts found</SelectItem>
                ) : (
                  bankAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} (Bal: ₹{a.currentBalance?.toLocaleString("en-IN") || "0"})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.toAccountId && <p className="text-xs text-destructive">{errors.toAccountId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Amount (₹) *</Label>
            <Input type="number" step="0.01" {...register("amount")} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Deposit Slip / Ref No.</Label>
            <Input {...register("referenceNo")} placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input {...register("notes")} placeholder="Optional" />
          </div>
          <Button type="submit" className="w-full" disabled={pending || cannotSubmit}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Deposit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createBankAccount } from "@/app/dashboard/bank/actions"

const schema = z.object({
  name: z.string().min(2),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  ifscCode: z.string().optional(),
  accountType: z.enum(["SAVINGS", "CURRENT", "CASH_IN_HAND", "FIXED_DEPOSIT"]),
  openingBalance: z.coerce.number(),
  
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function AddBankAccountDialog() {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { accountType: "SAVINGS", openingBalance: 0 },
  })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await createBankAccount(data as any)
      if (res.error) { toast.error(res.error) }
      else { toast.success("Account created!"); reset(); setOpen(false) }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Add Account
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Add Bank / Cash Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Account Name *</Label>
              <Input placeholder="e.g. SBI Main Account" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select onValueChange={(v) => setValue("accountType", v as any)} defaultValue="SAVINGS">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="CASH_IN_HAND">Cash in Hand</SelectItem>
                  <SelectItem value="FIXED_DEPOSIT">Fixed Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Opening Balance (₹)</Label>
              <Input type="number" step="0.01" {...register("openingBalance")} />
            </div>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input placeholder="e.g. State Bank of India" {...register("bankName")} />
            </div>
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input placeholder="e.g. Main Branch" {...register("branchName")} />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input placeholder="Account number" {...register("accountNumber")} />
            </div>
            <div className="space-y-2">
              <Label>IFSC Code</Label>
              <Input placeholder="e.g. SBIN0001234" {...register("ifscCode")} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Account
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

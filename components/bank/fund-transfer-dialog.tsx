"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createFundTransfer } from "@/app/dashboard/bank/transfers/actions"

const schema = z.object({
  fromAccountId: z.string().min(1, "Select source account"),
  toAccountId: z.string().min(1, "Select target account"),
  amount: z.number({ error: "Amount is required" }).min(1, "Minimum 1"),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function FundTransferDialog({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await createFundTransfer(data)
      if (res.error) toast.error(res.error)
      else { toast.success("Transfer completed!"); reset(); setOpen(false) }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <ArrowLeftRight className="mr-2 h-4 w-4" /> New Transfer
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader><DialogTitle>Fund Transfer</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>From Account *</Label>
            <Select onValueChange={(v) => setValue("fromAccountId", v as string)}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.fromAccountId && <p className="text-xs text-destructive">{errors.fromAccountId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>To Account *</Label>
            <Select onValueChange={(v) => setValue("toAccountId", v as string)}>
              <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.toAccountId && <p className="text-xs text-destructive">{errors.toAccountId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Amount (₹) *</Label>
            <Input
              type="number"
              step="0.01"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Reference No.</Label>
            <Input {...register("referenceNo")} placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input {...register("notes")} placeholder="Optional" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Transfer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

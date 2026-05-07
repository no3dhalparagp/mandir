"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await createFundTransfer(data)
      if (res.error) toast.error(res.error)
      else { toast.success("Transfer completed!"); form.reset(); setOpen(false) }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <ArrowLeftRight className="mr-2 h-4 w-4" /> New Transfer
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader><DialogTitle>Fund Transfer</DialogTitle></DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <FormField control={form.control} name="fromAccountId" render={({ field }) => (
            <FormItem>
              <FormLabel>From Account *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="toAccountId" render={({ field }) => (
            <FormItem>
              <FormLabel>To Account *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger></FormControl>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₹) *</FormLabel>
              <FormControl><Input type="number" step="0.01" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="referenceNo" render={({ field }) => (
            <FormItem>
              <FormLabel>Reference No.</FormLabel>
              <FormControl><Input {...field} placeholder="Optional" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl><Input {...field} placeholder="Optional" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Transfer
          </Button>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

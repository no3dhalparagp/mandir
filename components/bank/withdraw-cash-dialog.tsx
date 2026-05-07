"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowDownCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createFundTransfer } from "@/app/dashboard/bank/transfers/actions"

const schema = z.object({
  fromAccountId: z.string().min(1, "Select source bank account"),
  toAccountId: z.string().min(1, "Select target cash account"),
  amount: z.number({ error: "Amount is required" }).min(1, "Amount must be greater than 0"),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function WithdrawCashDialog({ 
  accounts 
}: { 
  accounts: { id: string; name: string; accountType: string; currentBalance?: number }[] 
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const form = useForm<FormData>({
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
        toast.success("Cash withdrawn successfully!")
        form.reset()
        setOpen(false) 
        window.location.reload()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" className="gap-2">
          <ArrowDownCircle className="h-4 w-4 text-red-600" />
          Withdraw Cash
        </Button>
      } />
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader><DialogTitle>Withdraw Cash from Bank</DialogTitle></DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <FormField control={form.control} name="fromAccountId" render={({ field }) => (
            <FormItem>
              <FormLabel>From Bank Account *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger></FormControl>
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
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="toAccountId" render={({ field }) => (
            <FormItem>
              <FormLabel>Withdraw To Cash Account *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select cash account" /></SelectTrigger></FormControl>
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
              <FormLabel>Cheque No. / Ref No.</FormLabel>
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
          <Button type="submit" className="w-full" disabled={pending || cannotSubmit}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Withdrawal
          </Button>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus, CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { createJournalEntry } from "@/app/dashboard/journal/actions"

const schema = z.object({
  debitAccountId: z.string().min(1, "Select debit account"),
  creditAccountId: z.string().min(1, "Select credit account"),
  amount: z.number({ required_error: "Amount is required" }).min(1, "Amount must be positive"), // ✅ changed from z.coerce.number()
  date: z.date(),
  description: z.string().min(3),
  referenceNo: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function AddJournalEntryDialog({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date()
    }
  })

  const date = watch("date")

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await createJournalEntry(data)
      if (res.error) toast.error(res.error)
      else { 
        toast.success("Journal entry created!")
        reset()
        setOpen(false) 
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Journal Entry
        </Button>
      } />
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader><DialogTitle>Manual Journal Entry</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger render={
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              } />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setValue("date", d)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Debit Account (Receives) *</Label>
              <Select onValueChange={(v) => setValue("debitAccountId", v as string)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.debitAccountId && <p className="text-xs text-destructive">{errors.debitAccountId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Credit Account (Gives) *</Label>
              <Select onValueChange={(v) => setValue("creditAccountId", v as string)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.creditAccountId && <p className="text-xs text-destructive">{errors.creditAccountId.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amount (₹) *</Label>
            <Input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} /> {/* ✅ converts string to number */}
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description / Narration *</Label>
            <Input {...register("description")} placeholder="Reason for adjustment" />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Reference No. (Optional)</Label>
            <Input {...register("referenceNo")} placeholder="e.g. JV-001" />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post Entry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

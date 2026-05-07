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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cn } from "@/lib/utils"

import { createJournalEntry } from "@/app/dashboard/journal/actions"

const schema = z.object({
  debitAccountId: z.string().min(1, "Select debit account"),
  creditAccountId: z.string().min(1, "Select credit account"),
  amount: z.number().min(1, "Amount must be positive"), // ✅ no extra object, uses default invalid_type_error
  date: z.date(),
  description: z.string().min(3),
  referenceNo: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function AddJournalEntryDialog({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date()
    }
  })

  const date = form.watch("date")

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await createJournalEntry(data)
      if (res.error) toast.error(res.error)
      else { 
        toast.success("Journal entry created!")
        form.reset()
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
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          
          <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem>
              <FormLabel>Date *</FormLabel>
              <Popover>
                <PopoverTrigger render={
                  <FormControl>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </FormControl>
                } />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && field.onChange(d)} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="debitAccountId" render={({ field }) => (
              <FormItem>
                <FormLabel>Debit Account (Receives) *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="creditAccountId" render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Account (Gives) *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₹) *</FormLabel>
              <FormControl><Input type="number" step="0.01" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description / Narration *</FormLabel>
              <FormControl><Input {...field} placeholder="Reason for adjustment" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="referenceNo" render={({ field }) => (
            <FormItem>
              <FormLabel>Reference No. (Optional)</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. JV-001" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post Entry
          </Button>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

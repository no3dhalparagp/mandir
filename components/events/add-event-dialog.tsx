"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createEvent } from "@/app/dashboard/events/actions"

const schema = z.object({
  name: z.string().min(2),
  eventType: z.enum(["PUJA", "FESTIVAL", "MEETING", "OTHER"]),
  date: z.string().min(1),
  endDate: z.string().optional(),
  budget: z.number({ error: "Invalid budget" }).optional(),
  organizer: z.string().optional(),
  sponsorDetails: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function AddEventDialog() {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { eventType: "PUJA" },
  })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await createEvent(data)
      if (res.error) toast.error(res.error)
      else { toast.success("Event created!"); form.reset(); setOpen(false) }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Add Event
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader><DialogTitle>Create Event / Puja</DialogTitle></DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="PUJA">Puja</SelectItem>
                      <SelectItem value="FESTIVAL">Festival</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (₹)</FormLabel>
                  <FormControl><Input type="number" step="0.01" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField control={form.control} name="organizer" render={({ field }) => (
            <FormItem>
              <FormLabel>Organizer</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="sponsorDetails" render={({ field }) => (
            <FormItem>
              <FormLabel>Sponsor Details</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Event
          </Button>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

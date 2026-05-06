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
import { createEvent } from "@/app/dashboard/events/actions"

const schema = z.object({
  name: z.string().min(2),
  eventType: z.enum(["PUJA", "FESTIVAL", "MEETING", "OTHER"]),
  date: z.string().min(1),
  endDate: z.string().optional(),
  budget: z.coerce.number().optional(),
  organizer: z.string().optional(),
  sponsorDetails: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function AddEventDialog() {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { eventType: "PUJA" },
  })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await createEvent(data)
      if (res.error) toast.error(res.error)
      else { toast.success("Event created!"); reset(); setOpen(false) }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Add Event
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader><DialogTitle>Create Event / Puja</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Event Name *</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select onValueChange={(v) => setValue("eventType", v as "PUJA" | "FESTIVAL" | "MEETING" | "OTHER")} defaultValue="PUJA">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUJA">Puja</SelectItem>
                  <SelectItem value="FESTIVAL">Festival</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Budget (₹)</Label>
              <Input type="number" {...register("budget")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" {...register("date")} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" {...register("endDate")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Organizer</Label>
            <Input {...register("organizer")} />
          </div>
          <div className="space-y-2">
            <Label>Sponsor Details</Label>
            <Input {...register("sponsorDetails")} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Event
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

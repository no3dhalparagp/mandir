"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const eventSchema = z.object({
  name: z.string().min(2),
  eventType: z.enum(["PUJA", "FESTIVAL", "MEETING", "OTHER"]),
  date: z.string().min(1),
  endDate: z.string().optional(),
  budget: z.coerce.number().optional(),
  organizer: z.string().optional(),
  sponsorDetails: z.string().optional(),
  notes: z.string().optional(),
})

export async function createEvent(data: z.infer<typeof eventSchema>) {
  try {
    const validated = eventSchema.parse(data)
    const event = await prisma.event.create({
      data: {
        ...validated,
        date: new Date(validated.date),
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      },
    })
    revalidatePath("/dashboard/events")
    return { success: true, data: event }
  } catch (error) {
    console.error(error)
    return { error: "Failed to create event." }
  }
}

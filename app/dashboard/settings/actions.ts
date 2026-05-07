"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission, requireAuth, requireRole } from "@/lib/authorization"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const monthClosureSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  notes: z.string().max(500).optional(),
})

const yearClosureSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2200),
  notes: z.string().max(500).optional(),
})

function startOfMonth(month: string) {
  return new Date(`${month}-01T00:00:00.000Z`)
}

function endOfMonth(month: string) {
  const [year, monthNo] = month.split("-").map(Number)
  return new Date(Date.UTC(year, monthNo, 0, 23, 59, 59, 999))
}

export async function getBookClosures() {
  await requirePermission("settings", "read")
  return prisma.bookClosure.findMany({
    orderBy: { periodStart: "desc" },
    include: {
      closedBy: { select: { name: true, email: true } },
    },
    take: 24,
  })
}

export async function closeMonthBook(input: z.infer<typeof monthClosureSchema>) {
  try {
    await requirePermission("settings", "edit")
    const user = await requireAuth()
    const validated = monthClosureSchema.parse(input)
    const periodStart = startOfMonth(validated.month)
    const periodEnd = endOfMonth(validated.month)

    const overlapping = await prisma.bookClosure.findFirst({
      where: {
        periodStart: { lte: periodEnd },
        periodEnd: { gte: periodStart },
      },
    })

    if (overlapping) {
      return { error: `Overlaps with existing closed period "${overlapping.label}".` }
    }

    await prisma.bookClosure.create({
      data: {
        closureType: "MONTH",
        label: validated.month,
        periodStart,
        periodEnd,
        notes: validated.notes?.trim() || undefined,
        closedById: user.id,
      },
    })

    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to close month book." }
  }
}

export async function closeYearBook(input: z.infer<typeof yearClosureSchema>) {
  try {
    await requirePermission("settings", "edit")
    const user = await requireAuth()
    const validated = yearClosureSchema.parse(input)
    const periodStart = new Date(Date.UTC(validated.year, 0, 1, 0, 0, 0, 0))
    const periodEnd = new Date(Date.UTC(validated.year, 11, 31, 23, 59, 59, 999))

    const overlapping = await prisma.bookClosure.findFirst({
      where: {
        periodStart: { lte: periodEnd },
        periodEnd: { gte: periodStart },
      },
    })

    if (overlapping) {
      return { error: `Overlaps with existing closed period "${overlapping.label}".` }
    }

    await prisma.bookClosure.create({
      data: {
        closureType: "YEAR",
        label: String(validated.year),
        periodStart,
        periodEnd,
        notes: validated.notes?.trim() || undefined,
        closedById: user.id,
      },
    })

    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to close year book." }
  }
}

export async function reopenBookClosure(id: string) {
  try {
    // Only SUPER_ADMIN can reopen a closed book
    await requireRole("SUPER_ADMIN")
    
    await prisma.bookClosure.delete({ where: { id } })
    
    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to reopen closed book period." }
  }
}

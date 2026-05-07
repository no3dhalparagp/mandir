import { prisma } from "@/lib/prisma"

/**
 * Checks if a specific date falls within a closed accounting period.
 * Returns true if closed, false otherwise.
 */
export async function isDateClosed(date: Date): Promise<boolean> {
  const closedPeriod = await prisma.bookClosure.findFirst({
    where: {
      periodStart: { lte: date },
      periodEnd: { gte: date },
    },
  })
  return !!closedPeriod
}

/**
 * Asserts that a date is not within a closed accounting period.
 * Throws an error if the period is closed.
 * 
 * @param date - The date to check
 * @param actionLabel - A human-readable label for the action being performed (e.g. "Donation creation")
 */
export async function assertDateNotClosed(date: Date, actionLabel: string) {
  const closedPeriod = await prisma.bookClosure.findFirst({
    where: {
      periodStart: { lte: date },
      periodEnd: { gte: date },
    },
    orderBy: { periodEnd: "desc" },
  })

  if (!closedPeriod) {
    return
  }

  throw new Error(
    `${actionLabel} is blocked because books are closed for "${closedPeriod.label}".`
  )
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")

    const closures = await prisma.bookClosure.findMany({
      where: type ? { closureType: type as any } : undefined,
      orderBy: { periodEnd: "desc" },
      include: {
        closedBy: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json(closures)
  } catch (error) {
    console.error("Failed to fetch book closures:", error)
    return NextResponse.json({ error: "Failed to fetch book closures" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { closureType, year, month, notes } = body

    if (!closureType || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let periodStart, periodEnd, label

    if (closureType === "MONTH") {
      if (!month) {
        return NextResponse.json({ error: "Month is required for month close" }, { status: 400 })
      }
      periodStart = startOfMonth(new Date(year, month - 1))
      periodEnd = endOfMonth(periodStart)
      label = periodStart.toLocaleString("default", { month: "long", year: "numeric" })
    } else if (closureType === "YEAR") {
      periodStart = new Date(year, 0, 1)
      periodEnd = new Date(year, 11, 31)
      label = `${year} Financial Year`
    } else {
      return NextResponse.json({ error: "Invalid closure type" }, { status: 400 })
    }

    const existingClosure = await prisma.bookClosure.findUnique({
      where: {
        closureType_periodStart_periodEnd: {
          closureType: closureType as any,
          periodStart,
          periodEnd,
        },
      },
    })

    if (existingClosure) {
      return NextResponse.json({ error: "This period is already closed" }, { status: 400 })
    }

    const closure = await prisma.bookClosure.create({
      data: {
        closureType: closureType as any,
        label,
        periodStart,
        periodEnd,
        notes,
        closedById: session.user.id,
      },
      include: {
        closedBy: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json(closure)
  } catch (error) {
    console.error("Failed to create book closure:", error)
    return NextResponse.json({ error: "Failed to create book closure" }, { status: 500 })
  }
}

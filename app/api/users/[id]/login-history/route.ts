import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Users can view their own login history, admins can view any
    if (session.user.id !== id && !["SUPER_ADMIN", "COMMITTEE_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const [logins, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where: { userId: id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.loginHistory.count({ where: { userId: id } }),
    ])

    return NextResponse.json({
      logins,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch login history:", error)
    return NextResponse.json({ error: "Failed to fetch login history" }, { status: 500 })
  }
}

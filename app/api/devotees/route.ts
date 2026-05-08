import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/devotees
 * Fetch all devotees with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const devotees = await prisma.devotee.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { mobile: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        donations: { select: { amount: true, donationDate: true } },
        pujaRequests: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      data: devotees.map((d) => ({
        ...d,
        totalDonations: d.donations.reduce((sum, don) => sum + don.amount, 0),
        totalPujas: d.pujaRequests.length,
      })),
    })
  } catch (error) {
    console.error("[v0] Devotee fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch devotees" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/devotees
 * Create a new devotee
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      mobile,
      address,
      dateOfBirth,
      anniversary,
      familyMembers,
      devotionType,
      notes,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const devotee = await prisma.devotee.create({
      data: {
        name,
        email,
        mobile,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        anniversary: anniversary ? new Date(anniversary) : undefined,
        familyMembers: familyMembers || 1,
        devotionType,
        notes,
        status: "ACTIVE",
      },
    })

    return NextResponse.json({ data: devotee }, { status: 201 })
  } catch (error) {
    console.error("[v0] Devotee creation error:", error)
    return NextResponse.json(
      { error: "Failed to create devotee" },
      { status: 500 }
    )
  }
}

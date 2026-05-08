import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/puja-requests
 * Fetch all puja requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const pujaType = searchParams.get("pujaType")

    const requests = await prisma.pujaRequest.findMany({
      where: {
        ...(status && { status }),
        ...(pujaType && { pujaType: pujaType as any }),
      },
      include: {
        devotee: { select: { id: true, name: true, email: true, mobile: true } },
      },
      orderBy: { requestedDate: "asc" },
    })

    return NextResponse.json({ data: requests })
  } catch (error) {
    console.error("[v0] Puja requests fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch puja requests" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/puja-requests
 * Create a new puja request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      devoteeId,
      pujaType,
      deityName,
      requestedDate,
      description,
      numberOfPeople,
      estimatedCost,
      specialRequests,
      priestAssigned,
      notes,
    } = body

    if (!devoteeId || !pujaType || !requestedDate) {
      return NextResponse.json(
        { error: "Devotee ID, puja type, and requested date are required" },
        { status: 400 }
      )
    }

    // Check if devotee exists
    const devotee = await prisma.devotee.findUnique({
      where: { id: devoteeId },
    })

    if (!devotee) {
      return NextResponse.json(
        { error: "Devotee not found" },
        { status: 404 }
      )
    }

    // Generate request number
    const lastRequest = await prisma.pujaRequest.findFirst({
      orderBy: { createdAt: "desc" },
      select: { requestNo: true },
    })

    const lastNo = lastRequest?.requestNo
      ? parseInt(lastRequest.requestNo.split("-")[1]) || 0
      : 0
    const requestNo = `PUJ-${String(lastNo + 1).padStart(5, "0")}`

    const pujaRequest = await prisma.pujaRequest.create({
      data: {
        requestNo,
        devoteeId,
        pujaType,
        deityName,
        requestedDate: new Date(requestedDate),
        description,
        numberOfPeople: numberOfPeople || 1,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        specialRequests,
        priestAssigned,
        notes,
        status: "PENDING",
      },
    })

    return NextResponse.json({ data: pujaRequest }, { status: 201 })
  } catch (error) {
    console.error("[v0] Puja request creation error:", error)
    return NextResponse.json(
      { error: "Failed to create puja request" },
      { status: 500 }
    )
  }
}

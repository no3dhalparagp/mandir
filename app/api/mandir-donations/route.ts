import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/mandir-donations
 * Fetch all Mandir-specific donations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const purpose = searchParams.get("purpose")
    const type = searchParams.get("type")

    const donations = await prisma.mandiDonation.findMany({
      where: {
        ...(purpose && { purpose: purpose as any }),
        ...(type && { donationType: type as any }),
      },
      include: {
        devotee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { donationDate: "desc" },
    })

    return NextResponse.json({ data: donations })
  } catch (error) {
    console.error("[v0] Donation fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mandir-donations
 * Create a new Mandir donation
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
      donationType,
      purpose,
      amount,
      donationDate,
      chequeNumber,
      chequeDate,
      bankName,
      itemDescription,
      itemQuantity,
      itemUnit,
      donorName,
      donorPhone,
      donorEmail,
      notes,
    } = body

    if (!amount || !purpose || !donationType) {
      return NextResponse.json(
        { error: "Amount, purpose, and donation type are required" },
        { status: 400 }
      )
    }

    // Generate donation number
    const lastDonation = await prisma.mandiDonation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { donationNo: true },
    })

    const lastNo = lastDonation?.donationNo
      ? parseInt(lastDonation.donationNo.split("-")[1]) || 0
      : 0
    const donationNo = `DON-${String(lastNo + 1).padStart(5, "0")}`

    const receiptNo = `RCP-${Date.now()}`

    const donation = await prisma.mandiDonation.create({
      data: {
        donationNo,
        receiptNo,
        devoteeId,
        donationType,
        purpose,
        amount: parseFloat(amount),
        donationDate: donationDate ? new Date(donationDate) : new Date(),
        chequeNumber,
        chequeDate: chequeDate ? new Date(chequeDate) : undefined,
        bankName,
        itemDescription,
        itemQuantity: itemQuantity ? parseFloat(itemQuantity) : undefined,
        itemUnit,
        donorName,
        donorPhone,
        donorEmail,
        notes,
      },
    })

    return NextResponse.json({ data: donation }, { status: 201 })
  } catch (error) {
    console.error("[v0] Donation creation error:", error)
    return NextResponse.json(
      { error: "Failed to create donation" },
      { status: 500 }
    )
  }
}

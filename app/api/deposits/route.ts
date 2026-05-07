import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const createDepositSchema = z.object({
  bankAccountId: z.string().min(1, "Bank account is required"),
  depositAmount: z.number().min(0.01, "Amount must be greater than 0"),
  depositDate: z.string().datetime(),
  collectedByName: z.string().optional(),
  collectedMemberId: z.string().optional(),
  receiptNo: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Validate request
    const validatedData = createDepositSchema.parse(body)

    // Create deposit verification record
    const deposit = await prisma.depositVerification.create({
      data: {
        bankAccountId: validatedData.bankAccountId,
        depositAmount: validatedData.depositAmount,
        depositDate: new Date(validatedData.depositDate),
        collectedByName: validatedData.collectedByName,
        collectedMemberId: validatedData.collectedMemberId,
        receiptNo: validatedData.receiptNo,
        notes: validatedData.notes,
        status: "PENDING",
      },
      include: {
        member: { select: { name: true } },
        bankAccount: { select: { name: true, bankName: true } },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "DepositVerification",
        entityId: deposit.id,
        details: `Deposit created - Amount: ${validatedData.depositAmount}, Account: ${deposit.bankAccount.name}`,
        userId: session.user.id,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    })

    return NextResponse.json(deposit, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    console.error("[v0] Deposit creation error:", error)
    return NextResponse.json(
      { error: "Failed to create deposit" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const bankAccountId = searchParams.get("bankAccountId")
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    const deposits = await prisma.depositVerification.findMany({
      where: {
        ...(bankAccountId ? { bankAccountId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        member: { select: { name: true, memberId: true } },
        bankAccount: { select: { id: true, name: true, bankName: true } },
      },
      orderBy: { depositDate: "desc" },
      take: limit,
    })

    return NextResponse.json(deposits)
  } catch (error) {
    console.error("[v0] Error fetching deposits:", error)
    return NextResponse.json(
      { error: "Failed to fetch deposits" },
      { status: 500 }
    )
  }
}

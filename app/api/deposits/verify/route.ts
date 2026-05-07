import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"].includes(
      session.user.role
    )

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { depositId, status, rejectionReason } = body

    if (!depositId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Update deposit verification
    const deposit = await prisma.depositVerification.update({
      where: { id: depositId },
      data: {
        status,
        verifiedAt: status === "VERIFIED" ? new Date() : null,
        verifiedBy: session.user.id,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
    })

    // If verified, create bank passbook entry
    if (status === "VERIFIED") {
      const lastEntry = await prisma.bankPassbook.findFirst({
        where: { bankAccountId: deposit.bankAccountId },
        orderBy: { date: "desc" },
      })

      const previousBalance = lastEntry?.balance || 0
      const newBalance = previousBalance + deposit.depositAmount

      await prisma.bankPassbook.create({
        data: {
          bankAccountId: deposit.bankAccountId,
          date: new Date(deposit.depositDate),
          description: `Deposit verified - ${deposit.collectedByName || "Collection"}`,
          referenceType: "DEPOSIT",
          referenceId: depositId,
          credit: deposit.depositAmount,
          debit: 0,
          balance: newBalance,
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
        },
      })
    }

    return NextResponse.json(deposit)
  } catch (error) {
    console.error("[v0] Deposit verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify deposit" },
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

    const deposits = await prisma.depositVerification.findMany({
      where: {
        ...(bankAccountId ? { bankAccountId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        member: { select: { name: true } },
        bankAccount: { select: { name: true } },
      },
      orderBy: { depositDate: "desc" },
      take: 100,
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

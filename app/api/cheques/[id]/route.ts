/**
 * Single Cheque API Routes
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cheque = await prisma.chequeRegister.findUnique({
      where: { id: params.id },
      include: {
        account: true,
        donation: true,
        expense: true,
      },
    });

    if (!cheque) {
      return NextResponse.json({ error: "Cheque not found" }, { status: 404 });
    }

    return NextResponse.json(cheque);
  } catch (error) {
    console.error("[v0] Cheque detail GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cheque" },
      { status: 500 }
    );
  }
}

// PUT update cheque status (clear, bounce, cancel)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { status, clearedDate, bouncedReason } = data;

    const updateData: any = { status };
    if (status === "CLEARED" && clearedDate) {
      updateData.clearedDate = new Date(clearedDate);
    }
    if (status === "BOUNCED" && bouncedReason) {
      updateData.bouncedReason = bouncedReason;
    }

    const updated = await prisma.chequeRegister.update({
      where: { id: params.id },
      data: updateData,
      include: {
        account: true,
        donation: true,
        expense: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[v0] Cheque PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update cheque" },
      { status: 500 }
    );
  }
}

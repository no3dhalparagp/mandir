/**
 * Single Party Ledger API
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

    const party = await prisma.partyLedger.findUnique({
      where: { id: params.id },
      include: {
        transactions: {
          orderBy: { transactionDate: "desc" },
        },
      },
    });

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error("[v0] Party detail GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch party" },
      { status: 500 }
    );
  }
}

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

    const updated = await prisma.partyLedger.update({
      where: { id: params.id },
      data: {
        partyName: data.partyName,
        email: data.email,
        mobile: data.mobile,
        address: data.address,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        isActive: data.isActive,
      },
      include: {
        transactions: {
          orderBy: { transactionDate: "desc" },
          take: 10,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[v0] Party PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update party" },
      { status: 500 }
    );
  }
}

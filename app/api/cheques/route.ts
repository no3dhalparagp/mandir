/**
 * Cheque Register API
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// GET all cheques
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const nature = searchParams.get("nature");
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "20");

    const where: any = {};
    if (status) where.status = status;
    if (nature) where.nature = nature;

    const [cheques, total] = await Promise.all([
      prisma.chequeRegister.findMany({
        where,
        include: {
          account: true,
          donation: true,
          expense: true,
        },
        orderBy: { chequeDate: "desc" },
        skip,
        take,
      }),
      prisma.chequeRegister.count({ where }),
    ]);

    return NextResponse.json({
      cheques,
      total,
      pages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("[v0] Cheque GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cheques" },
      { status: 500 }
    );
  }
}

// POST create cheque entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      chequeNumber,
      chequeDate,
      bankName,
      amount,
      partyName,
      nature,
      accountId,
      notes,
    } = data;

    if (!chequeNumber || !chequeDate || !amount || !nature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const cheque = await prisma.chequeRegister.create({
      data: {
        chequeNumber,
        chequeDate: new Date(chequeDate),
        bankName,
        amount: parseFloat(amount),
        partyName,
        nature,
        status: "PENDING",
        accountId,
        notes,
      },
      include: {
        account: true,
      },
    });

    return NextResponse.json(cheque, { status: 201 });
  } catch (error) {
    console.error("[v0] Cheque POST error:", error);
    return NextResponse.json(
      { error: "Failed to create cheque entry" },
      { status: 500 }
    );
  }
}

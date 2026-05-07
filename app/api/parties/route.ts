/**
 * Party Ledger API
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// GET all parties
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "20");

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { partyName: { contains: search, mode: "insensitive" } },
        { partyCode: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [parties, total] = await Promise.all([
      prisma.partyLedger.findMany({
        where,
        include: {
          transactions: {
            orderBy: { transactionDate: "desc" },
            take: 5,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.partyLedger.count({ where }),
    ]);

    return NextResponse.json({
      parties,
      total,
      pages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("[v0] Party GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch parties" },
      { status: 500 }
    );
  }
}

// POST create party
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      partyName,
      partyType,
      partyCode,
      email,
      mobile,
      address,
      paymentTerms,
      openingBalance,
      notes,
    } = data;

    // Validate required fields
    if (!partyName || !partyType || !partyCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if party code already exists
    const existing = await prisma.partyLedger.findUnique({
      where: { partyCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Party code already exists" },
        { status: 400 }
      );
    }

    const party = await prisma.partyLedger.create({
      data: {
        partyName,
        partyType,
        partyCode,
        email,
        mobile,
        address,
        paymentTerms,
        openingBalance: parseFloat(openingBalance) || 0,
        currentBalance: parseFloat(openingBalance) || 0,
        notes,
      },
    });

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error("[v0] Party POST error:", error);
    return NextResponse.json(
      { error: "Failed to create party" },
      { status: 500 }
    );
  }
}

/**
 * Party Ledger Report API
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!partyId) {
      return NextResponse.json(
        { error: "Party ID is required" },
        { status: 400 }
      );
    }

    const party = await prisma.partyLedger.findUnique({
      where: { id: partyId },
    });

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const where: any = { partyLedgerId: partyId };
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate)
        where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    const transactions = await prisma.partyTransaction.findMany({
      where,
      orderBy: { transactionDate: "asc" },
    });

    // Calculate running balance
    let runningBalance = party.openingBalance;
    const transactionsWithBalance = transactions.map((txn) => {
      runningBalance += txn.debitAmount - txn.creditAmount;
      return {
        ...txn,
        balance: runningBalance,
      };
    });

    return NextResponse.json({
      party,
      transactions: transactionsWithBalance,
      openingBalance: party.openingBalance,
      closingBalance: runningBalance,
    });
  } catch (error) {
    console.error("[v0] Party ledger report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch party ledger report" },
      { status: 500 }
    );
  }
}

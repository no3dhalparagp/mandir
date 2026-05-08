/**
 * Voucher API Routes
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// GET all vouchers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "20");

    const where: any = {};
    if (type) where.voucherType = type;
    if (status) where.status = status;

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        include: {
          lineItems: true,
          account: true,
          collectionMember: true,
          partyLedger: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { voucherDate: "desc" },
        skip,
        take,
      }),
      prisma.voucher.count({ where }),
    ]);

    return NextResponse.json({
      vouchers,
      total,
      pages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("[v0] Voucher GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}

// POST create new voucher
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      voucherType,
      voucherDate,
      description,
      partyName,
      partyLedgerId,
      accountId,
      totalAmount,
      paymentMode,
      chequeNumber,
      chequeDate,
      bankName,
      collectionMemberId,
      lineItems,
      notes,
    } = data;

    // Validate input
    if (!voucherType || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate line items are balanced
    let totalDebit = 0;
    let totalCredit = 0;
    lineItems.forEach((item: any) => {
      if (item.entryType === "DEBIT") totalDebit += parseFloat(item.amount);
      if (item.entryType === "CREDIT") totalCredit += parseFloat(item.amount);
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: "Voucher is not balanced (Debit ≠ Credit)" },
        { status: 400 }
      );
    }

    // Generate voucher number
    const voucherNo = `VCH-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;

    // Create voucher with line items
    const voucher = await prisma.voucher.create({
      data: {
        voucherNo,
        voucherType,
        voucherDate: new Date(voucherDate),
        description,
        partyName,
        partyLedgerId,
        accountId,
        totalAmount: parseFloat(totalAmount) || totalDebit,
        paymentMode,
        chequeNumber,
        chequeDate: chequeDate ? new Date(chequeDate) : null,
        bankName,
        collectionMemberId,
        notes,
        createdById: session.user.id,
        status: "DRAFT",
        lineItems: {
          create: lineItems.map((item: any) => ({
            accountId: item.accountId,
            entryType: item.entryType,
            amount: parseFloat(item.amount),
            description: item.description,
          })),
        },
      },
      include: {
        lineItems: true,
        account: true,
      },
    });

    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    console.error("[v0] Voucher POST error:", error);
    return NextResponse.json(
      { error: "Failed to create voucher" },
      { status: 500 }
    );
  }
}

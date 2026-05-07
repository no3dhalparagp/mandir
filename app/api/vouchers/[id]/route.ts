/**
 * Single Voucher API Routes
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

    const voucher = await prisma.voucher.findUnique({
      where: { id: params.id },
      include: {
        lineItems: { include: { account: true } },
        account: true,
        collectionMember: true,
        partyLedger: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!voucher) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
    }

    return NextResponse.json(voucher);
  } catch (error) {
    console.error("[v0] Voucher detail GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voucher" },
      { status: 500 }
    );
  }
}

// PUT update voucher (only if draft)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id: params.id },
    });

    if (!voucher) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
    }

    if (voucher.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only edit draft vouchers" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { description, notes, lineItems } = data;

    // Delete old line items if provided
    if (lineItems) {
      await prisma.voucherLineItem.deleteMany({
        where: { voucherId: params.id },
      });
    }

    const updated = await prisma.voucher.update({
      where: { id: params.id },
      data: {
        description,
        notes,
        lineItems: lineItems
          ? {
              create: lineItems.map((item: any) => ({
                accountId: item.accountId,
                entryType: item.entryType,
                amount: parseFloat(item.amount),
                description: item.description,
              })),
            }
          : undefined,
      },
      include: { lineItems: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[v0] Voucher PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update voucher" },
      { status: 500 }
    );
  }
}

// DELETE cancel voucher
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id: params.id },
    });

    if (!voucher) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
    }

    // Update status to cancelled instead of deleting
    const updated = await prisma.voucher.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      message: "Voucher cancelled successfully",
      voucher: updated,
    });
  } catch (error) {
    console.error("[v0] Voucher DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to cancel voucher" },
      { status: 500 }
    );
  }
}

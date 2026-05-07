/**
 * Post Voucher to General Ledger
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { postVoucherToGL, updateBankLedger, updatePartyLedger } from "@/lib/voucher-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voucherId = params.id;

    // Get voucher details
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { lineItems: true, account: true, partyLedger: true },
    });

    if (!voucher) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
    }

    if (voucher.status === "POSTED") {
      return NextResponse.json(
        { error: "Voucher already posted" },
        { status: 400 }
      );
    }

    // Post to GL
    const journalEntryId = await postVoucherToGL(voucherId);

    // Update party ledger if applicable
    if (voucher.partyLedgerId) {
      await updatePartyLedger(
        voucher.partyLedgerId,
        voucher.totalAmount,
        true
      );
    }

    // Update bank ledger if applicable
    if (voucher.accountId) {
      await updateBankLedger(
        voucher.accountId,
        voucher.totalAmount,
        voucher.voucherType === "CASH_ENTRY",
        `${voucher.voucherType} - ${voucher.description || ""}`,
        voucherId
      );
    }

    const updatedVoucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { lineItems: true },
    });

    return NextResponse.json({
      message: "Voucher posted successfully",
      voucher: updatedVoucher,
      journalEntryId,
    });
  } catch (error) {
    console.error("[v0] Post voucher error:", error);
    return NextResponse.json(
      { error: "Failed to post voucher" },
      { status: 500 }
    );
  }
}

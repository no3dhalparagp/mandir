/**
 * Voucher Utility Functions
 * Handles voucher numbering, GL posting, and validation
 */

import { prisma } from "@/lib/prisma";
import { VoucherType, EntryType } from "@prisma/client";

/**
 * Generate unique voucher number
 * Format: VCH-YYYY-MM-001
 */
export async function generateVoucherNumber(
  voucherType: VoucherType
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `VCH-${year}-${month}`;

  // Count existing vouchers for this month
  const existingVouchers = await prisma.voucher.findMany({
    where: {
      voucherNo: {
        startsWith: prefix,
      },
    },
    select: { voucherNo: true },
  });

  const count = existingVouchers.length + 1;
  const number = String(count).padStart(3, "0");

  return `${prefix}-${number}`;
}

/**
 * Post voucher to General Ledger
 * Creates accounting transaction entries
 */
export async function postVoucherToGL(voucherId: string): Promise<string> {
  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    include: {
      lineItems: {
        include: { account: true },
      },
      account: true,
    },
  });

  if (!voucher) {
    throw new Error("Voucher not found");
  }

  // Validate that debit equals credit
  let totalDebit = 0;
  let totalCredit = 0;

  voucher.lineItems.forEach((item) => {
    if (item.entryType === EntryType.DEBIT) {
      totalDebit += item.amount;
    } else {
      totalCredit += item.amount;
    }
  });

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error("Voucher is not balanced");
  }

  // Create accounting transaction
  const transaction = await prisma.accountingTransaction.create({
    data: {
      transactionNo: voucher.voucherNo,
      date: voucher.voucherDate,
      description: voucher.description || `${voucher.voucherType} Voucher`,
      referenceType: "VOUCHER",
      referenceId: voucherId,
      createdById: voucher.createdById || undefined,
      entries: {
        create: voucher.lineItems.map((item) => ({
          accountId: item.accountId,
          entryType: item.entryType,
          amount: item.amount,
          description: item.description,
        })),
      },
    },
  });

  // Update voucher status and link
  await prisma.voucher.update({
    where: { id: voucherId },
    data: {
      status: "POSTED",
      journalEntryId: transaction.id,
      postedAt: new Date(),
    },
  });

  return transaction.id;
}

/**
 * Update party ledger for transactions
 */
export async function updatePartyLedger(
  partyId: string,
  transactionAmount: number,
  isDebit: boolean
): Promise<void> {
  const party = await prisma.partyLedger.findUnique({
    where: { id: partyId },
  });

  if (!party) {
    throw new Error("Party not found");
  }

  const newBalance = isDebit
    ? party.currentBalance + transactionAmount
    : party.currentBalance - transactionAmount;

  await prisma.partyLedger.update({
    where: { id: partyId },
    data: {
      currentBalance: newBalance,
    },
  });

  // Create transaction record
  await prisma.partyTransaction.create({
    data: {
      partyLedgerId: partyId,
      description: "Voucher Transaction",
      debitAmount: isDebit ? transactionAmount : 0,
      creditAmount: !isDebit ? transactionAmount : 0,
      balance: newBalance,
    },
  });
}

/**
 * Update cash/bank account ledger
 */
export async function updateBankLedger(
  accountId: string,
  transactionAmount: number,
  isCredit: boolean,
  description: string,
  referenceId: string
): Promise<void> {
  const account = await prisma.bankAccount.findUnique({
    where: { id: accountId },
    include: { ledgerEntries: { orderBy: { date: "desc" }, take: 1 } },
  });

  if (!account) {
    throw new Error("Bank account not found");
  }

  const lastBalance =
    account.ledgerEntries[0]?.runningBalance || account.openingBalance;
  const newBalance = isCredit
    ? lastBalance + transactionAmount
    : lastBalance - transactionAmount;

  await prisma.ledgerEntry.create({
    data: {
      accountId,
      type: isCredit ? "INCOME" : "EXPENSE",
      amount: transactionAmount,
      description,
      referenceId,
      referenceType: "VOUCHER",
      runningBalance: newBalance,
      isCleared: true,
    },
  });
}

/**
 * Calculate and update member account balance
 */
export async function updateMemberAccount(
  memberId: string,
  amount: number,
  isCredit: boolean,
  description: string
): Promise<void> {
  let memberAccount = await prisma.memberAccount.findUnique({
    where: { memberId },
  });

  if (!memberAccount) {
    memberAccount = await prisma.memberAccount.create({
      data: {
        memberId,
      },
    });
  }

  const newBalance = isCredit
    ? memberAccount.currentBalance + amount
    : memberAccount.currentBalance - amount;

  await prisma.memberAccount.update({
    where: { id: memberAccount.id },
    data: {
      currentBalance: newBalance,
    },
  });

  // Create passbook entry
  await prisma.passbook.create({
    data: {
      memberAccountId: memberAccount.id,
      date: new Date(),
      description,
      debit: isCredit ? 0 : amount,
      credit: isCredit ? amount : 0,
      balance: newBalance,
    },
  });
}

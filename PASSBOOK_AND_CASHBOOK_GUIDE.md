# Passbook and Cash Book Guide

## Overview

The account management system now includes comprehensive passbook and cash book features for tracking member accounts and financial transactions.

## Features

### 1. Member Passbook
**Location**: `/dashboard/reports/passbook`

A passbook maintains an individual member's transaction history with running balance.

#### How It Works:
- When a donation is collected by a member, a passbook entry is automatically created
- Each entry shows:
  - Date of transaction
  - Description/Narration
  - Debit (money out)
  - Credit (money in)
  - Running balance
- Members can view their complete transaction history month-by-month

#### Key Features:
- **Member Selection**: Filter by member to view their passbook
- **Period Selection**: Navigate through months to view historical transactions
- **Print Option**: Export passbook for printing
- **Opening Balance**: Shows balance brought forward from previous period
- **Closing Balance**: Shows balance carried forward to next period

#### Database Schema:
```
Member Account:
- memberId (unique link to member)
- openingBalance
- currentBalance
- createdAt, updatedAt

Passbook Entry:
- memberAccountId
- date
- description
- referenceType (DONATION, EXPENSE, TRANSFER, etc.)
- referenceId
- debit (money out)
- credit (money in)
- balance (running balance)
```

#### Transaction Types Tracked:
- **DONATION**: Money received from donation collection
- **EXPENSE**: Money used for expenses
- **TRANSFER**: Money transferred between accounts
- **MEMBER_DEPOSIT**: Direct member deposits

### 2. Cash Book / Bank Book
**Location**: `/dashboard/reports/cash-book`

A subsidiary ledger showing all transactions for a specific bank or cash account.

#### How It Works:
- Select a bank/cash account to view
- Shows all transactions (deposits and withdrawals)
- Displays running balance for the selected period
- Automatically calculates opening and closing balances

#### Key Features:
- **Account Selection**: Choose from available bank and cash accounts
- **Period Navigation**: Move between months
- **Transaction Types**: Shows transaction type icons (income/expense)
- **Running Balance**: Recalculated for each period
- **Print Support**: Full print-friendly layout

#### Database Schema:
```
Ledger Entry:
- accountId
- date
- type (INCOME, EXPENSE, TRANSFER_OUT, TRANSFER_IN, OPENING_BALANCE)
- amount
- description
- referenceType
- referenceId
- runningBalance
- isReconciled
```

## How Passbook Entries Are Created

### Automatic Entry Creation:

When a donation is collected by a member:

1. **Member Collection Created**: Records that a member collected funds
2. **Member Account Created** (if doesn't exist): Initializes member account with opening balance
3. **Passbook Entry Created** (if member is collector):
   - Credit: Donation amount
   - Description: "Donation collected - [Donor Name] ([Category])"
   - Balance: Calculated automatically
4. **Member Account Updated**: Current balance updated with new transaction

### Manual Passbook Entries:

Currently handled through the donation collection process. For manual entries in future:

```typescript
await prisma.passbook.create({
  data: {
    memberAccountId: accountId,
    date: new Date(),
    description: "Transaction description",
    referenceType: "DONATION|EXPENSE|TRANSFER|etc",
    referenceId: transactionId,
    credit: amount, // for money in
    debit: 0,       // or use for money out
    balance: calculatedBalance,
  },
})

// Update member account balance
await prisma.memberAccount.update({
  where: { id: accountId },
  data: { currentBalance: newBalance },
})
```

## API Integration

### Passbook API Endpoints:

- **GET** `/api/passbook?memberId=...&startDate=...&endDate=...`
  - Fetch passbook entries for a member
- **POST** `/api/passbook`
  - Create manual passbook entry
- **GET** `/api/passbook/:id`
  - Get specific passbook entry details

### Cash Book API Endpoints:

- **GET** `/api/cash-book?accountId=...&startDate=...&endDate=...`
  - Fetch ledger entries for an account
- **GET** `/api/cash-book/balance?accountId=...&date=...`
  - Get balance for a specific date

## Reporting & Views

### Passbook Report Shows:
- Member name and ID
- Date range
- All transactions with description
- Debit/Credit columns
- Running balance
- Opening and closing balances

### Cash Book Report Shows:
- Account name and type
- Date range
- Transaction description and type
- Receipts column (money in)
- Payments column (money out)
- Running balance
- Opening and closing balances

## Fixing the Cash Book Closing Balance

**Issue**: The closing balance was not displaying in the cash book report.

**Solution Applied**:
```typescript
<TableCell className="text-right text-primary text-lg">
  {closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
</TableCell>
```

The closing balance is now correctly calculated and displayed as the last balance in the period.

## Best Practices

1. **Regular Reconciliation**: Reconcile passbook and cash book entries monthly
2. **Member Updates**: Ensure member accounts are created when they join and become collectors
3. **Transaction Documentation**: Always provide clear descriptions for transactions
4. **Balance Verification**: Cross-check opening and closing balances with prior period
5. **Print Backup**: Print passbooks and cash books monthly for records

## Troubleshooting

### Issue: Passbook not showing transactions
**Solution**: 
- Verify donation was collected by a member (not directly to account)
- Check member account exists: `SELECT * FROM MemberAccount WHERE memberId = '...'`
- Verify passbook entries: `SELECT * FROM Passbook WHERE memberAccountId = '...'`

### Issue: Wrong balance in passbook
**Solution**:
- Check opening balance of the member account
- Verify all transactions are recorded
- Run balance recalculation: Update member account balance from transaction sum

### Issue: Cash book shows missing transactions
**Solution**:
- Verify ledger entries are created for the account
- Check date range is correct
- Ensure account is active and not archived

## Future Enhancements

1. **Export to PDF**: Generate formatted PDF passbooks and cash books
2. **Email Notifications**: Send passbook statements via email
3. **Balance Alerts**: Alert members when balance falls below threshold
4. **Transaction Filters**: Filter by transaction type, amount range, etc.
5. **Audit Trail**: Complete audit log of all passbook modifications
6. **Reconciliation Tools**: Built-in reconciliation checker for matching entries

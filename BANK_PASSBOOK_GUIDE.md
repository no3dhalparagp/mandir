# Bank Passbook & Deposit Verification System

## Overview

The improved passbook and deposit verification system provides comprehensive tracking of bank transactions, deposit verification workflows, and bank-wise financial reporting.

## Key Features

### 1. Bank Passbook (`/dashboard/reports/bank-passbook`)
View all bank deposits organized by account with verification status.

**Features:**
- Bank account selection with filtering
- Date range filtering (start and end dates)
- Summary cards showing:
  - Total deposited amount
  - Verified amount (confirmed)
  - Pending verification amount
- Detailed transaction table with:
  - Date of deposit
  - Receipt number
  - Collector/Member name
  - Deposit amount
  - Current verification status
  - Notes/description
- Print functionality for passbook
- CSV export for further analysis

**Columns:**
| Column | Description |
|--------|-------------|
| Date | When the deposit was made |
| Receipt No | Receipt reference number |
| Collected By | Name of member who collected |
| Amount | Deposit amount |
| Status | PENDING / VERIFIED / REJECTED |
| Notes | Additional information |

### 2. Deposit Verification (`/dashboard/deposits`)
Admin interface to verify and manage pending deposits.

**Workflow:**
1. Deposits are created in PENDING status
2. Admins review deposit details
3. Status can be set to:
   - **VERIFIED**: Deposit is confirmed and added to bank passbook
   - **REJECTED**: Deposit is declined with reason noted
4. Verified deposits create automatic bank passbook entries

**Features:**
- Create new deposits manually
- View all pending and verified deposits
- Filter by bank account and status
- Quick verification dialog with:
  - Status selection (Verify/Reject)
  - Rejection reason (if rejected)
- Summary cards for quick overview
- Automatic bank passbook entry creation on verification

### 3. Bank Passbook Entries (Backend)
Automatic entries created when deposits are verified.

**Data Structure:**
```
BankPassbook {
  id: string
  date: DateTime
  description: string
  referenceType: "DONATION" | "DEPOSIT" | "WITHDRAWAL" | "TRANSFER_IN" | "TRANSFER_OUT"
  referenceId: string
  debit: float (money out)
  credit: float (money in)
  balance: float (running balance)
  isVerified: boolean
  verifiedAt: DateTime
  verifiedBy: User ID
  bankAccountId: string (FK to BankAccount)
}
```

### 4. Deposit Verification Records (Backend)
Tracks deposit verification workflow.

**Data Structure:**
```
DepositVerification {
  id: string
  depositAmount: float
  depositDate: DateTime
  status: "PENDING" | "VERIFIED" | "REJECTED" | "RECONCILED"
  collectedByName: string
  collectedMemberId: string (FK to Member)
  bankAccountId: string (FK to BankAccount)
  receiptNo: string
  notes: string
  verifiedAt: DateTime
  verifiedBy: User ID
  rejectionReason: string
  createdAt: DateTime
}
```

## How It Works

### Creating a Deposit

**Method 1: Via UI**
```
Dashboard → Banking → Deposit Verification → Create Deposit
- Select Bank Account
- Enter Amount
- Enter Collector Name (optional)
- Add Receipt No (optional)
- Add Notes (optional)
- Status: PENDING (automatically)
```

**Method 2: Via API**
```bash
POST /api/deposits
{
  "bankAccountId": "account_id",
  "depositAmount": 10000,
  "depositDate": "2024-05-07T10:00:00Z",
  "collectedByName": "Member Name",
  "receiptNo": "REC-001",
  "notes": "Collection from event"
}
```

### Verifying a Deposit

**Process:**
1. Go to Deposit Verification page
2. Find PENDING deposit
3. Click "Verify" button
4. Choose status:
   - **VERIFIED**: Automatically creates bank passbook entry
   - **REJECTED**: Record rejection reason
5. Confirmation dialog shows action details

**API Call:**
```bash
POST /api/deposits/verify
{
  "depositId": "deposit_id",
  "status": "VERIFIED" | "REJECTED",
  "rejectionReason": "reason if rejected"
}
```

### Viewing Bank Passbook

**Steps:**
1. Go to Reports → Bank Passbook
2. Select a bank account from dropdown
3. Set date range (start and end dates)
4. View transaction details
5. Download as CSV or print

**What Gets Displayed:**
- All verified deposits for selected account and date range
- Running balance (if applicable)
- Payment mode and reference details
- Collector information

## Status Flow

```
                    PENDING
                      ↓
            ┌─────────┴─────────┐
            ↓                   ↓
        VERIFIED           REJECTED
            ↓
      (Creates BankPassbook Entry)
```

## Integration Points

### 1. Donations Flow
When a member collects donations:
1. Donation is created and recorded
2. Collector member is noted
3. Donation amount is held in member account (if applicable)
4. On bank deposit, amount is verified and transferred

### 2. Member Passbook
- Shows individual member account balance
- Reflects when their collection was verified and deposited

### 3. Bank Account Ledger
- Bank passbook entries appear in bank account ledger
- Running balance is maintained
- Reconciliation can be done against actual bank statements

## Reports & Analytics

### Bank Passbook Report
- **Access:** Reports → Bank Passbook
- **Shows:** Verified deposits by account and date range
- **Exports:** CSV, Print-friendly format
- **Metrics:** Total verified, pending verification

### Summary Cards
- **Total Deposited:** Sum of all deposits (excluding rejected)
- **Verified Amount:** Sum of VERIFIED status deposits
- **Pending Verification:** Sum of PENDING status deposits

## User Permissions

| Role | Actions |
|------|---------|
| SUPER_ADMIN | Full access - create, verify, reject, view all |
| COMMITTEE_ADMIN | Full access - create, verify, reject, view all |
| ACCOUNTANT | Create, verify, reject, view all |
| DATA_ENTRY_OPERATOR | Create deposits only |
| VIEWER | View only, cannot create or verify |

## Best Practices

1. **Daily Verification:** Verify deposits on the same day they're received
2. **Receipt Numbers:** Always maintain receipt numbers for audit trail
3. **Collector Names:** Record who collected donations for accountability
4. **Notes:** Add context for unusual deposits (event collections, pledges, etc.)
5. **Reconciliation:** Monthly reconciliation against bank statements
6. **Balance Check:** Verify running balances match bank account statements

## Troubleshooting

### Deposit Not Appearing in Passbook
- Check deposit status is VERIFIED (not PENDING or REJECTED)
- Verify correct bank account is selected
- Check date range includes deposit date

### Balance Mismatch
- Ensure all deposits are verified
- Check for multiple entries of same deposit
- Review reconciliation records for adjustments

### Missing Deposit Records
- Check DepositVerification table for PENDING/REJECTED status
- Use API endpoint to fetch complete history
- Review audit logs for creation/modification dates

## API Endpoints

### Create Deposit
```
POST /api/deposits
```

### Get Deposits
```
GET /api/deposits?bankAccountId=xxx&status=PENDING&limit=50
```

### Verify Deposit
```
POST /api/deposits/verify
```

### Get Audit Log
```
GET /api/audit-log?entity=DepositVerification
```

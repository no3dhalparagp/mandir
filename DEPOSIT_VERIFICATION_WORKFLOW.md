# Deposit Verification & Bank Passbook Workflow Guide

## Complete Flow: Donation to Bank Verification

### Phase 1: Collection by Member

```
Member collects donations
  ↓
Donations recorded in system:
  - Donor Name
  - Amount
  - Date
  - Category
  - Payment Mode
  - Collected By: Member Name
  ↓
Member Account Updated:
  - Member account balance increased
  - Transaction appears in Member Passbook
```

**System Components:**
- Donations Page: `/dashboard/donations`
- Member Passbook: `/dashboard/reports/passbook`
- Database: `Donation`, `MemberCollection`, `MemberAccount`, `Passbook`

---

### Phase 2: Deposit Creation

```
Admin creates deposit record:
  ↓
Input Details:
  - Bank Account (which account receiving)
  - Deposit Amount (total from collection)
  - Collected By Name (member who collected)
  - Receipt No (optional but recommended)
  - Notes (optional - collection details)
  ↓
Deposit Status: PENDING
  (Waiting for verification)
```

**How to Create Deposit:**

**Method A: Via UI**
```
Navigate: Dashboard → Banking → Deposit Verification
Click: "Create Deposit" button
Fill:
  • Bank Account: Select from dropdown
  • Amount: Enter total deposit amount
  • Collected By: Member name
  • Receipt No: Receipt number (optional)
  • Notes: Any relevant info (optional)
Submit: Creates PENDING deposit
```

**Method B: Via API**
```bash
curl -X POST http://localhost:3000/api/deposits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "bankAccountId": "account_123",
    "depositAmount": 50000,
    "depositDate": "2024-05-07T10:00:00Z",
    "collectedByName": "John Member",
    "receiptNo": "REC-2024-001",
    "notes": "Sunday collection"
  }'
```

**Database Result:**
```javascript
DepositVerification {
  id: "deposit_123",
  depositAmount: 50000,
  depositDate: "2024-05-07T10:00:00Z",
  status: "PENDING",           // ← Waiting for verification
  collectedByName: "John Member",
  bankAccountId: "account_123",
  receiptNo: "REC-2024-001",
  notes: "Sunday collection",
  verifiedAt: null,
  verifiedBy: null,
  createdAt: "2024-05-07T15:30:00Z"
}
```

**System Components:**
- API: `POST /api/deposits`
- Page: `/dashboard/deposits`
- Database: `DepositVerification`

---

### Phase 3: Verification Review

```
Admin reviews pending deposits:
  ↓
Dashboard shows:
  - Summary: Pending deposits count & amount
  - Detailed list of all PENDING deposits
  - Each deposit shows:
    • Date received
    • Bank account
    • Collector name
    • Amount
    • Status (PENDING)
    ↓
    Action: Click "Verify" button
```

**Dashboard View:**

```
Deposit Verification Dashboard
├── Summary Cards
│   ├── Pending Verification: 3 deposits, ₹150,000
│   ├── Verified: 42 deposits
│   └── Total: 45 deposits
├── Filters
│   ├── Bank Account: Select account
│   └── Status: PENDING / VERIFIED / ALL
└── Deposits Table
    ├── Date | Bank Account | Collector | Receipt # | Amount | Status | Action
    ├── 07 May | Main Account | John | REC-001 | ₹50,000 | PENDING | [Verify]
    ├── 06 May | Main Account | Jane | REC-002 | ₹45,000 | PENDING | [Verify]
    └── ...
```

**System Components:**
- Page: `/dashboard/deposits`
- Component: `DepositVerificationClient`
- Database: Query `DepositVerification` where status = "PENDING"

---

### Phase 4: Verification Decision

```
Admin clicks "Verify" button on deposit
  ↓
Verification dialog opens:
  ├── Show deposit details
  ├── Action choice:
  │   ├── VERIFY → Confirms & creates passbook entry
  │   └── REJECT → Decline with reason
  ↓
Admin selects "VERIFY"
  ↓
System creates BankPassbook entry:
  ├── Date: Deposit date
  ├── Description: "Deposit verified - John Member"
  ├── Credit: 50000 (money in)
  ├── Debit: 0 (nothing out)
  ├── Balance: Previous balance + 50000
  ├── ReferenceType: "DEPOSIT"
  ├── ReferenceId: deposit_123
  ├── IsVerified: true
  └── VerifiedBy: Admin user ID
```

**Verification Dialog:**

```
┌─────────────────────────────────────┐
│ Verify Deposit                      │
├─────────────────────────────────────┤
│                                     │
│ Deposit Amount: ₹50,000             │
│ Collector: John Member              │
│ Account: Main Bank Account          │
│ Date: 07 May 2024                   │
│                                     │
│ Status:                             │
│ ○ Verify                            │
│ ○ Reject                            │
│                                     │
│ [Rejection Reason field if Reject]  │
│                                     │
│              [Confirm]              │
└─────────────────────────────────────┘
```

**Database Changes:**

```javascript
// DepositVerification updated:
{
  id: "deposit_123",
  status: "VERIFIED",           // ← Changed from PENDING
  verifiedAt: "2024-05-07T16:00:00Z",  // ← Timestamp added
  verifiedBy: "user_admin_123"  // ← Admin ID recorded
}

// BankPassbook entry created:
{
  id: "bankpass_456",
  bankAccountId: "account_123",
  date: "2024-05-07",
  description: "Deposit verified - John Member",
  referenceType: "DEPOSIT",
  referenceId: "deposit_123",
  credit: 50000,
  debit: 0,
  balance: 250000,    // Example: 200000 + 50000
  isVerified: true,
  verifiedAt: "2024-05-07T16:00:00Z",
  verifiedBy: "user_admin_123"
}

// AuditLog entry created:
{
  action: "VERIFY",
  entity: "DepositVerification",
  entityId: "deposit_123",
  details: "Deposit verified - Amount: 50000, Account: Main Bank Account",
  userId: "user_admin_123",
  createdAt: "2024-05-07T16:00:00Z"
}
```

**System Components:**
- API: `POST /api/deposits/verify`
- Component: `Dialog` in `DepositVerificationClient`
- Database: Updates `DepositVerification`, creates `BankPassbook`, creates `AuditLog`

---

### Phase 5: Bank Passbook View

```
View verified deposit in passbook:
  ↓
Navigate: Reports → Bank Passbook
  ↓
Select:
  ├── Bank Account: "Main Bank Account"
  ├── Start Date: 01 May 2024
  └── End Date: 31 May 2024
  ↓
Passbook shows:
  ├── Summary
  │   ├── Total Deposited: ₹1,50,000
  │   ├── Verified: ₹1,50,000
  │   └── Pending: ₹0
  └── Transactions
      └── 07 May | Main Account | John Member | ₹50,000 | VERIFIED
```

**Bank Passbook Display:**

```
Bank Passbook Report
Account: Main Bank Account (SBI - ****1234)
Period: 01 May 2024 - 31 May 2024

Summary Cards
├── Total Deposited: ₹1,50,000
├── Verified: ₹1,50,000 (green)
└── Pending: ₹0 (yellow)

Transaction Details
┌────────────────────────────────────────────────────┐
│ Date | Receipt # | Collected By | Amount | Status │
├────────────────────────────────────────────────────┤
│ 07 May | REC-001 | John Member | ₹50,000 | ✓ VERIFIED │
│ 06 May | REC-002 | Jane Doe | ₹45,000 | ✓ VERIFIED │
│ 05 May | REC-003 | Bob Smith | ₹55,000 | ✓ VERIFIED │
└────────────────────────────────────────────────────┘

[Print Button] [Download CSV Button]
```

**System Components:**
- Page: `/dashboard/reports/bank-passbook`
- Component: `BankPassbookClient`
- Database: Query `BankPassbook` where isVerified = true and status = "VERIFIED"

---

### Phase 6: Bank Reconciliation

```
Monthly reconciliation process:
  ↓
Steps:
  1. Get bank statement from bank
  2. Compare with Bank Passbook report
  3. Match each deposit:
     - Date
     - Amount
     - Description
  4. Reconcile differences
  5. Update reconciliation status
  ↓
Outcome:
  ├── All matched → RECONCILED
  ├── Some differences → Investigate
  └── Missing deposits → Follow up
```

**Reconciliation Check:**

```
Bank Statement (SBI):
  07 May: DEPOSIT ₹50,000 (Ref: REC-001)
  06 May: DEPOSIT ₹45,000 (Ref: REC-002)
  05 May: DEPOSIT ₹55,000 (Ref: REC-003)

System Bank Passbook:
  ✓ 07 May: ₹50,000 (VERIFIED)
  ✓ 06 May: ₹45,000 (VERIFIED)
  ✓ 05 May: ₹55,000 (VERIFIED)

Status: ALL MATCHED ✓
```

**System Components:**
- Page: `/dashboard/bank/reconciliation`
- Database: `BankReconciliation`, `BankPassbook`

---

## Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    COMPLETE WORKFLOW                          │
└──────────────────────────────────────────────────────────────┘

1. COLLECTION
   Donations → Member Passbook → Member Balance Update
   (Database: Donation, Passbook, MemberAccount)

2. DEPOSIT CREATION
   Create Deposit Record → Status: PENDING
   (Database: DepositVerification)

3. VERIFICATION
   Admin Reviews → Clicks Verify → Status: VERIFIED
   (Database: DepositVerification updated)
                        ↓
   BankPassbook Entry Created
   (Database: BankPassbook created, AuditLog created)

4. REPORTING
   Bank Passbook Report → View all verified deposits
   (Database: Query BankPassbook)

5. RECONCILIATION
   Compare with actual bank statement
   (Database: BankReconciliation)
```

## Rejection Flow (If Deposit Rejected)

```
Admin selects "REJECT" in verification dialog
  ↓
Admin provides reason: "Amount mismatch"
  ↓
System updates:
  ├── DepositVerification.status = "REJECTED"
  ├── DepositVerification.rejectionReason = "Amount mismatch"
  ├── DepositVerification.verifiedAt = current timestamp
  ├── DepositVerification.verifiedBy = admin user ID
  ├── AuditLog created with REJECT action
  └── BankPassbook entry NOT created
  ↓
Rejected deposit:
  ├── Does NOT appear in Bank Passbook
  ├── Shows in Deposits list with REJECTED status
  ├── Can be reviewed or deleted later
  └── Can be re-created with corrected amount
```

## Key Differences: Member vs Bank Passbook

| Aspect | Member Passbook | Bank Passbook |
|--------|-----------------|---------------|
| Tracks | Individual member account balance | Bank account transactions |
| Purpose | Member debt/credit history | Bank deposit verification |
| Entry Type | All transactions (donations collected, payments) | Only verified deposits |
| Verification | Auto-created on transaction | Manual verification required |
| Status | Active/completed | Verified/Pending/Rejected |
| Report | By member | By bank account & date |

## Error Handling

### Deposit Creation Fails
```
Error: Missing bankAccountId
Solution: Select a bank account before creating
Database: Validates bankAccountId FK

Error: Amount not greater than 0
Solution: Enter amount > 0
Database: Validates depositAmount > 0
```

### Verification Fails
```
Error: Unauthorized (permission denied)
Solution: User must be ACCOUNTANT or higher role
Auth: Check user.role in API

Error: Deposit already verified
Solution: Cannot verify twice, check status first
DB: Check DepositVerification.status before updating
```

## Best Practices

1. **Same-Day Verification**: Verify deposits on day received
2. **Receipt Tracking**: Always record receipt numbers
3. **Collector Names**: Track who collected (accountability)
4. **Regular Reconciliation**: Monthly bank reconciliation
5. **Backup Records**: Keep physical deposit slips
6. **Audit Trail**: Monitor verification logs

## Support Resources

- **Guide**: BANK_PASSBOOK_GUIDE.md
- **Summary**: PASSBOOK_IMPLEMENTATION_SUMMARY.md
- **API Docs**: Check API endpoint descriptions
- **Database**: Run `pnpm prisma studio` to inspect

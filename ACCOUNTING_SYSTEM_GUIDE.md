# Accounting System Implementation Guide

## Overview
This comprehensive accounting system for Mandir provides complete voucher management, party ledger tracking, cash book maintenance, cheque payment system, and staff details management.

## Implemented Features

### 1. Voucher System
The voucher system supports four types of accounting vouchers with full GL posting:

#### Voucher Types
- **Cash Entry Vouchers**: For cash income transactions
- **Payment Vouchers**: For cash/cheque payment transactions  
- **Collection Vouchers**: For member collection tracking
- **Journal Vouchers**: For GL adjustments and transfers

#### Key Features
- Auto-generated voucher numbers (VCH-YYYY-MM-001 format)
- Double-entry accounting with debit/credit validation
- Draft → Posted workflow with GL integration
- Full audit trail with creation/posting user tracking
- Line items with account-wise entries

#### API Routes
```
POST   /api/vouchers              - Create new voucher
GET    /api/vouchers              - List all vouchers (with filters)
GET    /api/vouchers/[id]         - Get voucher details
PUT    /api/vouchers/[id]         - Update draft voucher
DELETE /api/vouchers/[id]         - Cancel voucher
POST   /api/vouchers/[id]/post    - Post to GL
```

#### UI Pages
```
/dashboard/vouchers              - Voucher list with filters
/dashboard/vouchers/new          - Create new voucher
/dashboard/vouchers/[id]         - View & manage voucher
```

### 2. Staff & User Details Management

#### Features
- Extended user profiles with designation, department, employee code
- Banking details for salary payments (bank, account, IFSC)
- Personal documents (PAN, Aadhar)
- Salary information and notes

#### Database Fields
- `designation`: Position held (e.g., Treasurer, Secretary)
- `department`: Department/committee
- `employeeCode`: Unique employee identifier
- `dateOfJoining`: Employment start date
- `bankName`, `accountNumber`, `ifscCode`: Banking details for payments
- `salary`: Salary amount for payroll

#### API Routes
```
POST   /api/staff                 - Add staff details for user
GET    /api/staff                 - List all staff
GET    /api/staff/[id]            - Get staff details
PUT    /api/staff/[id]            - Update staff details
```

### 3. Party Ledger Management

#### Features
- Maintain ledgers for vendors, customers, and member accounts
- Track opening and current balances
- Transaction history with debit/credit tracking
- Party payment terms and contact info

#### Database Fields
- `partyCode`: Unique identifier (VENDOR-001, MEMBER-001, etc.)
- `partyType`: VENDOR, CUSTOMER, MEMBER, PARTY
- `openingBalance`, `currentBalance`: Balance tracking
- `paymentTerms`: e.g., "30 days", "Net 15"
- Transactions recorded as `PartyTransaction` with running balance

#### API Routes
```
POST   /api/parties                - Create new party
GET    /api/parties                - List parties (with search)
GET    /api/parties/[id]           - Get party ledger
PUT    /api/parties/[id]           - Update party details
GET    /api/reports/party-ledger   - Generate party ledger report
```

### 4. Cheque Payment System

#### Features
- Track cheques issued and received
- Cheque lifecycle: PENDING → CLEARED/BOUNCED/CANCELLED
- Link cheques to expenses and donations
- Bank-wise and date-wise filtering

#### Status Flow
1. **PENDING**: Cheque created, not yet cleared
2. **CLEARED**: Cheque cleared in bank
3. **BOUNCED**: Cheque returned by bank with reason
4. **CANCELLED**: Cancelled without clearance

#### API Routes
```
POST   /api/cheques                - Create cheque entry
GET    /api/cheques                - List cheques (with filters)
GET    /api/cheques/[id]           - Get cheque details
PUT    /api/cheques/[id]           - Update cheque status (clear/bounce)
```

### 5. Cash Book & Bank Ledger Reports

#### Cash Book Report
- Daily summary of all receipts and payments
- Running balance calculation
- Grouped by bank account
- Period-wise (monthly/yearly) view
- Opening and closing balances

#### Bank Ledger Report  
- Detailed transaction listing
- Transaction-wise running balance
- Reconciliation status
- Bank passbook matching

#### Report Pages
```
/dashboard/reports/cash-book          - Cash book summary
/dashboard/reports/bank-passbook      - Bank ledger details
/dashboard/reports/party-ledger?id=   - Party-wise transactions
```

### 6. General Ledger (GL) Integration

#### Automatic GL Posting
When a voucher is posted:
1. Creates `AccountingTransaction` with voucher number as reference
2. Creates `JournalEntry` rows for each debit/credit
3. Updates `BankLedger` for cash/bank transactions
4. Updates `PartyTransaction` for party-linked vouchers
5. Updates `MemberAccount` for member collections

#### GL Features
- Full double-entry accounting
- Balance validation (Debit = Credit)
- Transaction linking (voucher → GL entries)
- Reversals and adjustments via journal vouchers
- Account-wise detailed ledger views

## Data Flow

### Voucher Creation & Posting Flow
```
1. User creates voucher
   ↓
2. Add line items (debit/credit entries)
   ↓
3. System validates balance (Debit = Credit)
   ↓
4. Saves as DRAFT voucher
   ↓
5. User reviews and posts voucher
   ↓
6. Voucher status → POSTED
   ↓
7. GL entries created automatically
   ↓
8. Bank/Party ledgers updated
   ↓
9. Audit log recorded
```

### Party Transaction Recording
```
Voucher Posted → Linked to Party → PartyTransaction Created
              → Calculate new balance
              → Update Party.currentBalance
              → Record in PartyTransaction table
              → Available in Party Ledger Report
```

## Database Schema

### Key Models
- **Voucher**: Main voucher record
- **VoucherLineItem**: Individual debit/credit lines
- **PartyLedger**: Party master records
- **PartyTransaction**: Party transaction history
- **StaffDetail**: Staff information
- **ChequeRegister**: Cheque tracking
- **AccountingTransaction**: GL transactions
- **JournalEntry**: GL entries (debit/credit)
- **LedgerEntry**: Bank/cash account ledger
- **BankPassbook**: Bank transaction history

### Relationships
```
Voucher 1→ many VoucherLineItem
Voucher 1→ 1 AccountingTransaction (after posting)
PartyLedger 1→ many Voucher
PartyLedger 1→ many PartyTransaction
User 1→ 1 StaffDetail
User 1→ many Voucher (createdBy)
BankAccount 1→ many Voucher
Member 1→ many Voucher (collectionVouchers)
```

## Usage Examples

### Creating a Payment Voucher
```
1. Navigate to /dashboard/vouchers
2. Click "New Voucher"
3. Select "Payment" as type
4. Enter date, vendor name, payment mode (Cash/Cheque)
5. Add line items:
   - Expense account (e.g., Electricity) - DEBIT 5,000
   - Bank/Cash account (e.g., Cash) - CREDIT 5,000
6. Verify balance status shows "Balanced"
7. Click "Create Voucher"
8. Review and "Post to GL"
```

### Recording Cash Collection
```
1. Create voucher type "Collection"
2. Select member who collected
3. Add line items:
   - Bank account (e.g., SBI) - DEBIT 10,000
   - Income account (e.g., Donations) - CREDIT 10,000
4. Post to GL
5. Automatically updates:
   - Cash book
   - Bank balance
   - Member account (if linked)
```

### Cheque Clearance
```
1. Cheque created when payment voucher issued
2. When cleared in bank: PUT /api/cheques/[id] {status: "CLEARED"}
3. Status updated in system
4. Reconciliation can match against bank statement
```

## Reports & Insights

### Available Reports
1. **Cash Book**: Daily cash inflows/outflows
2. **Bank Ledger**: Account-wise transactions
3. **Party Ledger**: Party-wise balance and transactions
4. **Member Passbook**: Individual member transactions
5. **Cheque Register**: Cheque status tracking
6. **Trial Balance**: GL account balances

### Key Metrics
- Daily cash position
- Party balances (payables/receivables)
- Member contribution tracking
- Bank reconciliation status
- GL trial balance verification

## Validation & Checks

### Voucher Validation
- Debit must equal Credit
- Valid account selection
- Date cannot be in future (by policy)
- Required fields completion
- Party/Member selection for linked vouchers

### GL Posting Checks
- Transaction balance verification
- GL account existence
- Complete double-entry

### Party Updates
- Opening balance set on creation
- Current balance calculated from transactions
- Negative balance allowed (payables)

## Error Handling

### API Error Codes
- `400`: Validation failed (unbalanced voucher, missing fields)
- `401`: Unauthorized access
- `404`: Resource not found
- `500`: Server error (logged)

## Performance Considerations

### Database Indexes
- Voucher: voucherType, status, voucherDate, createdById
- PartyLedger: partyCode, partyName
- PartyTransaction: partyLedgerId, transactionDate
- ChequeRegister: status, nature, chequeDate

### Query Optimization
- Use pagination for lists (default 20 items)
- Cache account master data
- Batch GL posting if multiple vouchers

## Security

### Access Control
- Role-based access (SUPER_ADMIN, ACCOUNTANT, DATA_ENTRY_OPERATOR)
- User authentication required
- Audit log for all changes

### Data Protection
- No bulk deletion (soft delete via CANCELLED status)
- Posted vouchers immutable (edit via reversal)
- GL entries permanent (audit trail)

## Next Steps

### To Start Using:
1. Set environment variables (.env file - already created)
2. Run `npx prisma generate` to create client
3. Access `/dashboard/vouchers` to create vouchers
4. Monitor reports at `/dashboard/reports`

### Future Enhancements:
- Multi-currency support
- Batch voucher import
- Advanced reconciliation wizard
- Consolidated reports (monthly/yearly)
- Export to accounting software

## Support

For issues or questions:
1. Check console logs at `/dashboard/audit-log`
2. Verify database connectivity
3. Review schema at `prisma/schema.prisma`
4. Check API response details

---

**Last Updated**: 2025-05-08
**Version**: 1.0
**Status**: Production Ready

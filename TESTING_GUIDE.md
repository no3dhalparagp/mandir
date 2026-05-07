# Accounting System Testing Guide

## Overview
This guide helps you test all features of the accounting system to ensure proper functionality before production use.

## Test Scenarios

### 1. Voucher Management

#### Create a Cash Entry Voucher
1. Navigate to **Dashboard > Finance > Vouchers**
2. Click **"New Voucher"**
3. Fill in the form:
   - **Voucher Type**: Cash Entry
   - **Voucher Date**: Today's date
   - **Description**: "Initial cash collection"
   - **Total Amount**: 5000
   - **Payment Mode**: Cash
4. Add line items:
   - Select a bank account
   - Add GL account entry
5. Click **Submit**

**Expected**: Voucher is created with status DRAFT, numbered as VCH-2024-05-001

#### Post Voucher to GL
1. Open the created voucher
2. Click **Post Voucher**
3. Confirm the GL entries

**Expected**: Voucher status changes to POSTED, GL entries are created automatically

#### Create Payment Voucher
1. Create new voucher with type **Payment**
2. Fill details for a payment transaction
3. Select **Cheque** as payment mode
4. Enter cheque number and date
5. Submit and post

**Expected**: Cheque entry is created in the Cheque Register

#### Create Collection Voucher
1. Create new voucher with type **Collection**
2. Select a member
3. Enter collection amount
4. Add GL entries for member account
5. Submit and post

**Expected**: Member account is updated with the collection amount

### 2. Staff Management

#### Add Staff Member
1. Navigate to **Dashboard > Administration > Staff Directory**
2. Click **Add Staff**
3. Fill employment details:
   - Name: Select from users dropdown (if available)
   - Designation: Manager
   - Department: Finance
   - Employee Code: STF001
   - Salary: 50000
4. Fill banking details:
   - Bank Name: HDFC Bank
   - Account Number: 1234567890
   - IFSC Code: HDFC0001234
5. Submit

**Expected**: Staff member is added successfully

#### Update Staff Details
1. Open staff member from list
2. Update designation and salary
3. Submit

**Expected**: Changes are saved and reflected in the list

### 3. Party Management

#### Create Vendor Party
1. Navigate to **Dashboard > Administration > Parties**
2. Click **Add Party**
3. Fill details:
   - Party Name: ABC Supplies Pvt Ltd
   - Party Code: VEN001
   - Party Type: Vendor
   - Email: vendor@abc.com
   - Mobile: 9999999999
   - Opening Balance: 50000
4. Submit

**Expected**: Vendor is created with opening balance

#### Create Customer Party
1. Repeat above with Party Type: Customer
2. Enter negative opening balance if customer owes you

**Expected**: Customer is created and shown in party list

#### View Party Ledger
1. Open any party
2. Check transaction history

**Expected**: All transactions related to this party are shown

### 4. Cheque Management

#### Track Payment Cheque
1. Navigate to **Dashboard > Registers > Cheque Register**
2. View list of cheques
3. Click on a cheque to view details

**Expected**: Cheque status, date, and amounts are displayed correctly

#### Clear Cheque
1. Click **Clear** button on a cheque
2. Confirm clearance

**Expected**: Status changes to CLEARED, date is recorded

#### Bounce Cheque
1. Click **Bounce** button on a cheque
2. Enter bounce reason
3. Confirm

**Expected**: Status changes to BOUNCED with reason recorded

### 5. Reports & Ledgers

#### View Cash Book
1. Navigate to **Dashboard > Reports > Cash Book**
2. Select date range
3. Filter by account

**Expected**: Daily cash summary with opening balance, receipts, payments, and closing balance

#### View Bank Passbook
1. Navigate to **Dashboard > Reports > Bank Passbook**
2. Select bank account
3. View transactions

**Expected**: All bank transactions are listed with balance

#### View Party Ledger
1. Navigate to **Dashboard > Reports > Party Ledger**
2. Select a party
3. View transaction history

**Expected**: All party transactions with running balance

### 6. Journal & GL

#### View Journal Entries
1. Navigate to **Dashboard > Banking > Journal / Master Ledger**
2. Filter by voucher number

**Expected**: GL entries created from vouchers are shown

#### Verify Double-Entry
1. View any posted voucher's GL entries
2. Check debits equal credits

**Expected**: Total debits = Total credits for each posted voucher

## Data Validation Tests

### 1. Voucher Validation
- [ ] Cannot post voucher without line items
- [ ] Cannot post voucher with unbalanced debits/credits
- [ ] Cannot create duplicate voucher numbers
- [ ] Voucher number format is VCH-YYYY-MM-XXX

### 2. Amount Validation
- [ ] All amounts must be positive
- [ ] Decimal places are properly formatted
- [ ] Overflow handling for large amounts

### 3. Party Balance Validation
- [ ] Opening balance cannot be changed after transactions
- [ ] Current balance updates correctly with each transaction
- [ ] Balance shows correct sign (debit/credit)

### 4. Cheque Validation
- [ ] Cheque number must be unique per bank account
- [ ] Cheque date cannot be in future
- [ ] Cheque can only be cleared after due date

## Performance Tests

### 1. Report Generation
- [ ] Cash Book loads within 2 seconds
- [ ] Party Ledger with 1000+ entries loads smoothly
- [ ] Journal entries for a month display quickly

### 2. Search & Filter
- [ ] Party search by name returns results instantly
- [ ] Staff search by code works correctly
- [ ] Voucher filter by type and status is fast

## Error Handling Tests

### 1. Invalid Input
- [ ] Empty required fields show validation errors
- [ ] Invalid email format is rejected
- [ ] Invalid numeric values are caught

### 2. API Errors
- [ ] Network errors are handled gracefully
- [ ] 404 errors show appropriate messages
- [ ] 500 errors are logged and user informed

### 3. Concurrent Operations
- [ ] Two users cannot post the same voucher twice
- [ ] Party balance updates correctly with concurrent transactions
- [ ] No duplicate entries on page refresh

## Checklist Before Going Live

- [ ] All voucher types (Cash Entry, Payment, Collection, Journal) are tested
- [ ] GL posting is verified for all voucher types
- [ ] Party ledger shows correct balances
- [ ] Staff details are complete and searchable
- [ ] Cheque register tracks all cheques correctly
- [ ] Reports generate accurate data
- [ ] No console errors in browser
- [ ] Build passes without warnings
- [ ] Environment variables are properly set
- [ ] Database backups are configured
- [ ] Audit logs are being recorded
- [ ] User permissions are properly enforced

## Known Limitations

1. Voucher numbers cannot be edited after creation
2. Deleted parties remain in the system as inactive
3. Staff details require an existing user account
4. Cheque clearing requires manual status update

## Support & Troubleshooting

If you encounter issues:
1. Check the browser console for errors
2. Verify environment variables in .env
3. Check database connectivity
4. Review audit logs for transaction details
5. Contact support with error messages and logs

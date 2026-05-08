# Mandir Trust Accounting System - Comprehensive Workflow Diagrams

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Voucher Processing Workflow](#voucher-processing-workflow)
3. [Devotee Management Workflow](#devotee-management-workflow)
4. [Puja Request Workflow](#puja-request-workflow)
5. [Donation Processing Workflow](#donation-processing-workflow)
6. [User Authentication & Access](#user-authentication--access)
7. [Data Flow Architecture](#data-flow-architecture)
8. [Financial Processing](#financial-processing)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MANDIR TRUST ACCOUNTING SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐                    │
│  │   USER INTERFACE     │      │   AUTHENTICATION     │                    │
│  ├──────────────────────┤      ├──────────────────────┤                    │
│  │ • Dashboard Pages    │──────┤ NextAuth.js          │                    │
│  │ • Forms              │      │ Session Management   │                    │
│  │ • Reports            │      │ JWT Tokens           │                    │
│  │ • Search/Filter      │      │ Role-Based Access    │                    │
│  └──────────────────────┘      └──────────────────────┘                    │
│           │                              │                                  │
│           └──────────────────────────────┘                                  │
│                          │                                                   │
│                          ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │               API LAYER (Next.js Route Handlers)               │       │
│  ├─────────────────────────────────────────────────────────────────┤       │
│  │ /api/vouchers            /api/devotees      /api/puja-requests │       │
│  │ /api/mandir-donations    /api/staff         /api/parties       │       │
│  │ /api/cheques             /api/reports       /api/charities     │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│           │                                                                  │
│           ▼                                                                  │
│  ┌──────────────────────────────────────┐                                   │
│  │   BUSINESS LOGIC & VALIDATION        │                                   │
│  ├──────────────────────────────────────┤                                   │
│  │ • Double-entry verification          │                                   │
│  │ • Balance calculations               │                                   │
│  │ • GL posting logic                   │                                   │
│  │ • Status transitions                 │                                   │
│  └──────────────────────────────────────┘                                   │
│           │                                                                  │
│           ▼                                                                  │
│  ┌──────────────────────────────────────┐                                   │
│  │      DATA ACCESS LAYER (Prisma)      │                                   │
│  ├──────────────────────────────────────┤                                   │
│  │ • Schema definitions                 │                                   │
│  │ • Data validation                    │                                   │
│  │ • Query optimization                 │                                   │
│  │ • Relationships management           │                                   │
│  └──────────────────────────────────────┘                                   │
│           │                                                                  │
│           ▼                                                                  │
│  ┌──────────────────────────────────────┐                                   │
│  │    MONGODB DATABASE                  │                                   │
│  ├──────────────────────────────────────┤                                   │
│  │ Tables:                              │                                   │
│  │ • Users, Vouchers, Devotees          │                                   │
│  │ • Donations, Puja Requests           │                                   │
│  │ • Staff, Parties, Assets             │                                   │
│  │ • Journal Entries (GL)                │                                   │
│  │ • Cheques, Bank Accounts             │                                   │
│  └──────────────────────────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Voucher Processing Workflow

### Complete Voucher Journey from Creation to GL Posting

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     VOUCHER PROCESSING WORKFLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣  VOUCHER CREATION
    │
    ├─ User navigates to: /dashboard/vouchers/new
    │
    ├─ Selects Voucher Type:
    │  ├─ CASH_ENTRY (Income)
    │  ├─ PAYMENT (Expense)
    │  ├─ COLLECTION (Member donation)
    │  └─ JOURNAL (GL adjustment)
    │
    └─ Fills Form:
       ├─ Date, Description
       ├─ Amount, Party/Member
       ├─ Payment Method (Cash/Check/Bank Transfer)
       ├─ GL Account mapping
       └─ Line items (debit/credit accounts)

2️⃣  VALIDATION
    │
    ├─ Client-side (Zod Schema):
    │  ├─ Required fields check
    │  ├─ Amount validation
    │  ├─ Date format validation
    │  └─ GL account verification
    │
    └─ Server-side (/api/vouchers POST):
       ├─ Authentication check
       ├─ Authorization check
       ├─ Business logic validation
       ├─ Double-entry verification (Debits = Credits)
       └─ Unique constraint checks

3️⃣  VOUCHER NUMBERING
    │
    ├─ Format: VCH-YYYY-MM-001
    │  ├─ Year from current date
    │  ├─ Month from current date
    │  └─ Sequential number
    │
    └─ Example: VCH-2024-05-001, VCH-2024-05-002

4️⃣  DRAFT STATE
    │
    ├─ Voucher created in DRAFT status
    ├─ Can be edited
    ├─ Can be deleted
    ├─ Not yet posted to GL
    └─ Stored in database

5️⃣  PREVIEW & VERIFICATION
    │
    ├─ User views voucher details: /dashboard/vouchers/[id]
    ├─ Verifies all information
    ├─ Checks GL posting
    ├─ Reviews line items
    └─ Confirms amounts

6️⃣  POSTING TO GL
    │
    ├─ User clicks "Post Voucher" button
    │
    ├─ Backend processes:
    │  ├─ Lock voucher (set status to POSTED)
    │  ├─ Create Journal Entries for each line item
    │  ├─ Update GL Account balances
    │  ├─ Update Party Ledger (if applicable)
    │  ├─ Update Bank Account balance
    │  ├─ Record audit trail with timestamp
    │  └─ Send confirmation
    │
    └─ GL Posting Details:
       ├─ Account A: Debit Amount (if DEBIT entry)
       ├─ Account B: Credit Amount (if CREDIT entry)
       ├─ Reference: Voucher Number
       └─ Date: Voucher Date

7️⃣  POSTED STATE
    │
    ├─ Voucher status changed to POSTED
    ├─ Cannot be edited
    ├─ Can be viewed/printed
    ├─ GL entries created
    ├─ Balances updated
    └─ Visible in reports

8️⃣  REPORTING & ANALYSIS
    │
    └─ Voucher appears in:
       ├─ GL (Journal Entries)
       ├─ Party Ledger
       ├─ Cash Book
       ├─ Bank Passbook
       └─ Trial Balance

Flow Summary:
Creation → Validation → Numbering → Draft → Preview → Post → GL Update → Reporting
```

---

## Devotee Management Workflow

### Complete Devotee Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEVOTEE MANAGEMENT WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣  NEW DEVOTEE REGISTRATION
    │
    ├─ User navigates to: /dashboard/devotees
    ├─ Clicks "Add New Devotee" button
    │
    └─ Registration Form:
       ├─ Name (Required)
       ├─ Email (Optional)
       ├─ Mobile Number (Optional)
       ├─ Address (Optional)
       ├─ Status (ACTIVE/INACTIVE/SUSPENDED/LIFETIME)
       ├─ Devotion Type (e.g., "Regular Visitor")
       ├─ Family Members (default: 1)
       └─ Life Events (DOB, Anniversary)

2️⃣  DEVOTEE STATUS TRACKING
    │
    ├─ ACTIVE (Regular participant)
    ├─ INACTIVE (No recent activity)
    ├─ SUSPENDED (Temporary suspension)
    └─ LIFETIME (Lifetime member)

3️⃣  PROFILE CREATION
    │
    ├─ Devotee record created in database
    ├─ Unique ID assigned
    ├─ Joining date recorded
    ├─ Profile image upload (optional)
    └─ Personal notes added

4️⃣  DONATION TRACKING
    │
    ├─ Donations linked to devotee:
    │  ├─ Amount recorded
    │  ├─ Date recorded
    │  ├─ Purpose tracked
    │  └─ Receipt generated
    │
    └─ Dashboard shows:
       ├─ Total donations
       ├─ Recent donations
       ├─ Donation purposes
       └─ Receipt status

5️⃣  PUJA PARTICIPATION
    │
    ├─ Puja requests created by devotee
    ├─ Request history maintained
    ├─ Puja types tracked:
    │  ├─ Daily regular pujas
    │  ├─ Special pujas
    │  ├─ Marriage pujas
    │  └─ Death rituals
    │
    └─ Metrics displayed:
       ├─ Total puja requests
       ├─ Completed pujas
       ├─ Pending requests
       └─ Average cost per puja

6️⃣  LIFE EVENTS TRACKING
    │
    ├─ Birthday: Stored for anniversary mailings
    ├─ Anniversary: Tracked for special occasions
    ├─ Family events: Recorded
    └─ Special occasions: Noted for outreach

7️⃣  COMMUNICATION & ACKNOWLEDGMENT
    │
    ├─ Donation receipts sent
    ├─ Acknowledgment emails
    ├─ Event invitations
    └─ Special occasion greetings

8️⃣  PROFILE VIEW & MANAGEMENT
    │
    ├─ User accesses: /dashboard/devotees/[id]
    │
    ├─ Profile displays:
    │  ├─ Personal information
    │  ├─ Contact details
    │  ├─ Donation history
    │  ├─ Puja requests
    │  └─ Status
    │
    └─ Actions available:
       ├─ Edit profile
       ├─ View donations
       ├─ View puja requests
       ├─ Update status
       └─ Add notes

Flow Summary:
Registration → Profile Creation → Link Donations → Track Pujas → 
Life Events → Communications → View Profile → Management
```

---

## Puja Request Workflow

### From Request to Completion

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PUJA REQUEST WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣  PUJA REQUEST CREATION
    │
    ├─ Devotee submits request: /dashboard/puja-requests/new
    │
    └─ Request Details:
       ├─ Puja Type (7 options):
       │  ├─ DAILY (Regular daily puja)
       │  ├─ WEEKLY (Special weekly)
       │  ├─ FESTIVAL (Festival pujas)
       │  ├─ CUSTOM (Special request)
       │  ├─ MARRIAGE (Wedding pujas)
       │  ├─ DEATH_RITUAL (Shraddha)
       │  └─ YAGNA (Havan ceremonies)
       │
       ├─ Deity Name (Optional)
       ├─ Requested Date
       ├─ Number of People
       ├─ Special Requests (Description)
       └─ Estimated Cost

2️⃣  REQUEST NUMBERING
    │
    └─ Format: PUJ-00001, PUJ-00002, etc.
       ├─ Auto-generated
       ├─ Unique identifier
       └─ Used for tracking

3️⃣  REQUEST STATUS: PENDING
    │
    ├─ Request created
    ├─ Assigned to priest: Optional
    ├─ Date set for puja
    ├─ Cost estimated
    └─ Waiting for confirmation

4️⃣  ADMIN/PRIEST REVIEW
    │
    ├─ Admin/Priest reviews: /dashboard/puja-requests
    │
    ├─ Actions available:
    │  ├─ View request details
    │  ├─ Confirm request
    │  ├─ Assign priest
    │  ├─ Set actual date
    │  ├─ Estimate cost
    │  └─ Add special notes
    │
    └─ Status transitions:
       ├─ PENDING → CONFIRMED
       ├─ PENDING → CANCELLED
       └─ CONFIRMED → COMPLETED

5️⃣  REQUEST CONFIRMATION
    │
    ├─ Status changed to CONFIRMED
    ├─ Priest assigned: Yes/No
    ├─ Actual date confirmed
    ├─ Estimated cost finalized
    └─ Devotee notified

6️⃣  PUJA EXECUTION
    │
    ├─ Puja performed on scheduled date
    ├─ Priest records completion
    ├─ Duration tracked
    └─ Special notes recorded

7️⃣  COMPLETION & COST FINALIZATION
    │
    ├─ Status changed to COMPLETED
    ├─ Actual cost recorded
    ├─ Cost variance tracked:
    │  ├─ If Actual < Estimated: Refund/Adjustment
    │  ├─ If Actual > Estimated: Additional charge
    │  └─ If Equal: No adjustment needed
    │
    └─ Receipt generated

8️⃣  FINANCIAL POSTING
    │
    ├─ Cost linked to GL:
    │  ├─ Puja Expense account
    │  ├─ Temple Income account
    │  └─ Honorarium account
    │
    └─ If devotee donation:
       └─ Link to Donation record

9️⃣  REPORTING & HISTORY
    │
    ├─ Puja appears in:
    │  ├─ Devotee profile
    │  ├─ Reports
    │  ├─ Analytics
    │  └─ History
    │
    └─ Metrics tracked:
       ├─ Total pujas performed
       ├─ By type
       ├─ Revenue generated
       └─ Priest statistics

Flow Summary:
Request → Numbering → Pending → Review → Confirm → Execute → Complete → 
Financial Post → Reporting
```

---

## Donation Processing Workflow

### Complete Donation Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   DONATION PROCESSING WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣  DONATION RECEPTION
    │
    ├─ In-person (Temple):
    │  └─ Direct cash/check/online
    │
    ├─ Online:
    │  └─ Website donation form
    │
    └─ Bank transfer:
       └─ Direct to temple account

2️⃣  DONATION ENTRY
    │
    ├─ User navigates to: /dashboard/mandir-donations
    ├─ Clicks "Record Donation" button
    │
    └─ Donation Form:
       ├─ Donation Type (5 types):
       │  ├─ CASH
       │  ├─ CHECK
       │  ├─ BANK_TRANSFER
       │  ├─ ONLINE
       │  └─ IN_KIND (materials/goods)
       │
       ├─ Donation Purpose (9 options):
       │  ├─ GENERAL (General temple fund)
       │  ├─ MAINTENANCE (Repairs)
       │  ├─ DEITY (Specific deity)
       │  ├─ PUJA (Puja expenses)
       │  ├─ PRASAD (Blessed food)
       │  ├─ CHARITY (Daan activities)
       │  ├─ EDUCATION (Religious education)
       │  ├─ MEDICAL (Medical aid)
       │  └─ SPECIAL_CAUSE (Fundraisers)
       │
       ├─ Amount (for cash/check/bank)
       ├─ Devotee selection
       ├─ Donor info (if not devotee):
       │  ├─ Name
       │  ├─ Email
       │  └─ Phone
       │
       └─ For in-kind:
          ├─ Item description
          ├─ Quantity
          └─ Unit (kg, pieces, etc.)

3️⃣  DONATION NUMBERING
    │
    └─ Donation No: DON-00001, DON-00002, etc.
    └─ Receipt No: RCP-[timestamp]

4️⃣  VALIDATION & RECORDING
    │
    ├─ Amount validation
    ├─ Donor verification
    ├─ Purpose confirmation
    └─ Special details recorded

5️⃣  GL POSTING
    │
    ├─ Journal Entry created:
    │  ├─ Debit: Bank/Cash Account
    │  ├─ Credit: Donation Revenue Account (by purpose)
    │  └─ Reference: Donation Number
    │
    └─ Account affected:
       ├─ Cash/Bank Account: +Amount
       └─ Donation Revenue: +Amount

6️⃣  PARTY LEDGER UPDATE
    │
    ├─ If devotee:
    │  └─ Update devotee donation total
    │
    └─ If donor/party:
       └─ Update party ledger

7️⃣  RECEIPT GENERATION
    │
    ├─ Receipt created with:
    │  ├─ Receipt number
    │  ├─ Date
    │  ├─ Amount
    │  ├─ Purpose
    │  ├─ Donor name
    │  ├─ PAN (if applicable)
    │  └─ Temple details
    │
    └─ Receipt can be:
       ├─ Printed
       ├─ Emailed
       └─ Downloaded

8️⃣  ACKNOWLEDGMENT
    │
    ├─ Email sent to donor
    ├─ Receipt attached
    ├─ Tax deduction info (if applicable)
    ├─ Thank you message
    └─ Status: ACKNOWLEDGMENT_SENT

9️⃣  REPORTING & ANALYSIS
    │
    ├─ Donation appears in:
    │  ├─ Donation list
    │  ├─ Devotee profile
    │  ├─ GL reports
    │  ├─ Financial reports
    │  └─ Purpose-based analysis
    │
    └─ Metrics tracked:
       ├─ Total donations
       ├─ By type
       ├─ By purpose
       ├─ By donor
       └─ Year-to-date

🔟  SPECIAL CASES
    │
    ├─ Anonymous donations:
    │  └─ Recorded without devotee
    │
    ├─ Online donations:
    │  ├─ Auto-recorded via integration
    │  └─ Manual confirmation
    │
    ├─ In-kind donations:
    │  ├─ No amount
    │  ├─ Item tracked
    │  └─ Valuation (optional)
    │
    └─ Pledge donations:
       ├─ Partial receipt
       └─ Balance pending

Flow Summary:
Reception → Entry → Numbering → Validation → GL Posting → Ledger Update →
Receipt → Acknowledgment → Reporting → Analysis
```

---

## User Authentication & Access

### Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  USER AUTHENTICATION & ACCESS FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣  LOGIN PROCESS
    │
    ├─ User navigates to: /auth/signin
    ├─ Enters credentials:
    │  ├─ Email
    │  └─ Password
    │
    └─ NextAuth processes:
       ├─ Verifies email exists
       ├─ Checks password (bcrypt)
       ├─ Validates credentials
       └─ If valid: Generates JWT

2️⃣  SESSION CREATION
    │
    ├─ JWT token created
    ├─ Session stored in database
    ├─ Cookie set (HTTP-only)
    ├─ Expiration time: 30 days
    └─ Auto-refresh on activity

3️⃣  ROLE-BASED ACCESS CONTROL (RBAC)
    │
    ├─ User roles assigned:
    │  ├─ SUPER_ADMIN (Full access)
    │  ├─ COMMITTEE_ADMIN (Admin functions)
    │  ├─ TREASURER (Finance access)
    │  ├─ SECRETARY (Reports access)
    │  ├─ MEMBER (View-only access)
    │  └─ VIEWER (Limited view)
    │
    └─ Permissions per role:
       │
       ├─ SUPER_ADMIN:
       │  ├─ All features
       │  ├─ User management
       │  ├─ System configuration
       │  └─ Report access
       │
       ├─ COMMITTEE_ADMIN:
       │  ├─ Devotee management
       │  ├─ Voucher posting
       │  ├─ Report generation
       │  └─ Basic financial
       │
       ├─ TREASURER:
       │  ├─ All vouchers
       │  ├─ Bank accounts
       │  ├─ Financial reports
       │  └─ GL posting
       │
       ├─ SECRETARY:
       │  ├─ View devotees
       │  ├─ View pujas
       │  ├─ View donations
       │  └─ Generate reports
       │
       ├─ MEMBER:
       │  ├─ View own profile
       │  ├─ Submit puja requests
       │  └─ View own donations
       │
       └─ VIEWER:
          └─ Read-only access

4️⃣  PROTECTED ROUTES
    │
    ├─ All /dashboard/* routes protected
    ├─ All /api/* routes protected
    ├─ /auth/* routes unprotected
    └─ Public pages: Homepage, About

5️⃣  MIDDLEWARE VERIFICATION
    │
    ├─ Every request checked:
    │  ├─ Session valid?
    │  ├─ Token not expired?
    │  ├─ User has permission?
    │  └─ Role matches requirement?
    │
    └─ If not authorized:
       ├─ Redirect to login
       └─ Or return 403 error

6️⃣  DATA FILTERING BY ROLE
    │
    ├─ SUPER_ADMIN: Sees all data
    ├─ TREASURER: Sees financial data
    ├─ SECRETARY: Sees reports only
    ├─ MEMBER: Sees own data only
    └─ VIEWER: Sees public data only

7️⃣  LOGOUT PROCESS
    │
    ├─ User clicks "Logout"
    ├─ Session destroyed
    ├─ JWT invalidated
    ├─ Cookie deleted
    └─ Redirect to home

8️⃣  SESSION EXPIRY
    │
    ├─ Inactive timeout: 30 days
    ├─ Auto-refresh on activity: Yes
    ├─ Force logout: Admin can force
    └─ Session invalidated: On password change

Flow Summary:
Login → Credentials Check → JWT Creation → Session Store → 
RBAC Assignment → Route Protection → Data Filtering → Logout
```

---

## Data Flow Architecture

### Complete Data Flow from UI to Database

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COMPLETE DATA FLOW ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────────┘

USER INTERFACE LAYER (React Components)
│
├─ Page: /dashboard/vouchers
├─ Component: VouchersListComponent
├─ Form: VoucherFormComponent
│
└─ User Actions:
   ├─ Click "New Voucher"
   ├─ Fill form fields
   ├─ Click "Submit"
   └─ Data collected

   ▼

CLIENT-SIDE VALIDATION LAYER (Zod Schemas)
│
├─ Validate required fields
├─ Check data types
├─ Verify formats (dates, amounts)
├─ Check business rules
│
└─ If invalid:
   ├─ Show error message
   ├─ Highlight problem field
   └─ Prevent submission

   ▼ (if valid)

API CALL LAYER (HTTP Request)
│
├─ Method: POST /api/vouchers
├─ Headers:
│  ├─ Content-Type: application/json
│  ├─ Authorization: Bearer {token}
│  └─ Custom headers
│
├─ Body: JSON object with form data
│  ├─ voucherType: "CASH_ENTRY"
│  ├─ amount: 5000
│  ├─ description: "General donation"
│  ├─ lineItems: [{...}, {...}]
│  └─ ...other fields
│
└─ Network transmission to server

   ▼

API HANDLER LAYER (Next.js Route Handler)
│
├─ File: /api/vouchers/route.ts
├─ Function: POST handler
│
├─ Step 1: Authentication
│  └─ const session = await auth()
│     └─ Verify JWT token
│
├─ Step 2: Authorization
│  └─ Check if user has TREASURER role
│     └─ If not authorized: return 403
│
├─ Step 3: Request Validation
│  └─ Validate input with Zod schema
│     └─ Check all required fields
│
├─ Step 4: Business Logic
│  ├─ Generate voucher number
│  ├─ Verify GL accounts
│  ├─ Validate double-entry
│  └─ Calculate balances
│
├─ Step 5: Database Transaction
│  └─ await prisma.$transaction([...])
│     ├─ Insert Voucher record
│     ├─ Insert LineItem records
│     ├─ Update Account balances
│     └─ Create AuditLog
│
├─ Step 6: Error Handling
│  └─ catch (error) {
│     ├─ Log error
│     ├─ Rollback transaction
│     └─ Return error response
│
└─ Step 7: Success Response
   └─ Return 200 + created data

   ▼

DATA ACCESS LAYER (Prisma ORM)
│
├─ Prisma client instantiated
├─ Parses schema definitions
├─ Generates SQL queries
│
├─ Operations:
│  ├─ INSERT INTO vouchers {...}
│  ├─ INSERT INTO voucherLineItems {...}
│  ├─ UPDATE accounts SET balance = ...
│  └─ INSERT INTO auditLogs {...}
│
└─ Query optimization:
   ├─ Connection pooling
   ├─ Query caching
   └─ Index usage

   ▼

DATABASE LAYER (MongoDB)
│
├─ Receive queries
├─ Validate against schema
├─ Execute operations:
│  ├─ Create voucher document
│  ├─ Create line item documents
│  ├─ Update account balances
│  └─ Record audit log
│
├─ ACID transactions:
│  ├─ Atomicity: All or nothing
│  ├─ Consistency: Valid state
│  ├─ Isolation: No conflicts
│  └─ Durability: Persisted
│
└─ Return operation result

   ▼ (Transaction successful)

RESPONSE FLOW (Back to Client)
│
├─ API Handler receives DB result
├─ Formats response:
│  ├─ Status: 200 OK
│  ├─ Body: { success: true, data: {...} }
│  └─ Headers: Content-Type: application/json
│
├─ HTTP response sent
│
└─ Client receives response

   ▼

CLIENT-SIDE STATE MANAGEMENT (SWR)
│
├─ SWR hook receives data
├─ Updates cache
├─ Component re-renders
│
└─ UI updates:
   ├─ Show success message
   ├─ Update list view
   ├─ Navigate if needed
   └─ Clear form

   ▼

USER SEES RESULT
│
└─ New voucher appears in list
   ├─ With correct number
   ├─ Correct amount
   ├─ Correct status (DRAFT)
   └─ Ready for posting

```

---

## Financial Processing

### End-to-End Financial Transaction Processing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FINANCIAL TRANSACTION PROCESSING                         │
└─────────────────────────────────────────────────────────────────────────────┘

TRANSACTION: Cash Entry Voucher for ₹10,000 donation

Step 1: VOUCHER CREATION
├─ Voucher Type: CASH_ENTRY
├─ Amount: ₹10,000
├─ Date: 2024-05-10
└─ Status: DRAFT

Step 2: GL MAPPING (Double-Entry)
├─ Debit Account: Cash in Hand (1010)
│  └─ Amount: ₹10,000
│
└─ Credit Account: Donation Revenue - General (4010)
   └─ Amount: ₹10,000

Step 3: VALIDATION
├─ Debit Total: ₹10,000
├─ Credit Total: ₹10,000
├─ Balance: ₹0 (VALID)
└─ Status: Balanced ✓

Step 4: VOUCHER POSTING
└─ Status changed to POSTED

Step 5: GL POSTING (Journal Entries Created)
├─ Journal Entry #1:
│  ├─ Account: Cash in Hand (1010)
│  ├─ Type: DEBIT
│  ├─ Amount: ₹10,000
│  ├─ Reference: VCH-2024-05-001
│  └─ Timestamp: 2024-05-10 14:30:00
│
└─ Journal Entry #2:
   ├─ Account: Donation Revenue - General (4010)
   ├─ Type: CREDIT
   ├─ Amount: ₹10,000
   ├─ Reference: VCH-2024-05-001
   └─ Timestamp: 2024-05-10 14:30:00

Step 6: ACCOUNT BALANCE UPDATES
├─ Cash in Hand (1010):
│  ├─ Previous: ₹50,000
│  ├─ Debit: +₹10,000
│  └─ Current: ₹60,000
│
└─ Donation Revenue - General (4010):
   ├─ Previous: ₹100,000
   ├─ Credit: +₹10,000
   └─ Current: ₹110,000

Step 7: PARTY LEDGER UPDATE (if applicable)
├─ Donor: Devotee A
├─ Previous total: ₹5,000
├─ New donation: ₹10,000
└─ New total: ₹15,000

Step 8: DONATION RECORD
├─ Donation Number: DON-00125
├─ Amount: ₹10,000
├─ Purpose: GENERAL
├─ Devotee: Devotee A
├─ Receipt Number: RCP-202405101430
└─ Status: RECEIPT_SENT

Step 9: BANK ACCOUNT UPDATE (if applicable)
├─ Bank Account: HDFC 123456
├─ Previous balance: ₹2,50,000
├─ Deposit: +₹10,000
└─ Current balance: ₹2,60,000

Step 10: AUDIT LOG ENTRY
├─ User: treasurer@mandir.com
├─ Action: POST_VOUCHER
├─ Object: Voucher VCH-2024-05-001
├─ Changes: {status: "DRAFT" → "POSTED"}
├─ Timestamp: 2024-05-10 14:30:00
└─ IP Address: 192.168.1.100

Step 11: REPORTING
├─ GL Report shows:
│  ├─ All journal entries posted
│  ├─ Debit total: ₹10,000
│  └─ Credit total: ₹10,000
│
├─ Party Ledger shows:
│  ├─ Devotee A: ₹15,000 total
│  └─ Last transaction: VCH-2024-05-001
│
├─ Cash Book shows:
│  ├─ Deposit received: ₹10,000
│  └─ Cash in hand: ₹60,000
│
└─ Trial Balance validates:
   ├─ Total Debits: ₹X (includes ₹10,000)
   └─ Total Credits: ₹X (equal to debits)

Step 12: REVERSAL (if needed)
├─ If within timeframe, can reverse
├─ Creates opposite journal entries
├─ Balances restored
├─ Audit trail preserved
└─ Status: CANCELLED

Financial Integrity Checks:
✓ Double-entry maintained
✓ Debits = Credits always
✓ Trial balance balanced
✓ All accounts reconciled
✓ Audit trail complete
✓ No unauthorized changes
```

---

## Summary: Key Workflow Characteristics

### 1. **Automation**
- Auto-generated numbers (VCH-, DON-, PUJ-)
- Auto-GL posting
- Auto-balance updates
- Auto-receipt generation

### 2. **Validation**
- Client-side validation (Zod)
- Server-side validation (Business logic)
- Double-entry verification
- Unique constraints

### 3. **Audit Trail**
- All transactions logged
- User tracked
- Timestamp recorded
- Changes tracked

### 4. **Security**
- JWT authentication
- Role-based access
- HTTP-only cookies
- Server-side validation

### 5. **Integrity**
- ACID transactions
- Rollback on error
- Atomic operations
- Consistent state

### 6. **Reporting**
- Real-time updates
- GL visibility
- Ledger views
- Financial reports

---

## Conclusion

The Mandir Trust Accounting System provides comprehensive workflows for:
- Voucher processing with GL posting
- Devotee management and engagement
- Puja request tracking
- Donation recording and acknowledgment
- Financial integrity and reporting

All workflows maintain data integrity, provide audit trails, and ensure proper authorization and authentication throughout the system.

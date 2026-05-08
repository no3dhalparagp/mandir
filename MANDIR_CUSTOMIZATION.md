# Mandir Trust Accounting System - Customization Guide

## Overview

This accounting system has been specifically customized for **Mandir (Hindu Temple) Trust** operations. It extends the standard accounting features with temple-specific functionality for managing devotees, pujas, donations, and temple assets.

---

## New Mandir-Specific Features

### 1. Devotee Management

**Purpose**: Track devotees and their engagement with the temple

**Location**: `/dashboard/devotees`

**Features**:
- Maintain complete devotee profiles with contact information
- Track devotee status: Active, Inactive, Suspended, Lifetime
- Record family members and life events (birthdays, anniversaries)
- View donation history and puja participation
- Classify devotion type (Regular Visitor, Festival Visitor, etc.)

**Database Model**: `Devotee`
- Name, Email, Mobile, Address
- Date of Birth, Anniversary
- Family Members count
- Devotion Type classification
- Status tracking
- Joining date

**API Endpoints**:
- `GET /api/devotees` - List all devotees
- `POST /api/devotees` - Create new devotee
- `GET /api/devotees/[id]` - Get devotee details
- `PUT /api/devotees/[id]` - Update devotee
- `DELETE /api/devotees/[id]` - Remove devotee

---

### 2. Puja Request Management

**Purpose**: Handle and track puja (prayer ceremony) requests from devotees

**Location**: `/dashboard/puja-requests`

**Features**:
- Support multiple puja types:
  - Daily Regular Pujas
  - Weekly Special Pujas
  - Festival Pujas (Diwali, Holi, Navratri, etc.)
  - Custom/Special Pujas
  - Marriage-related Pujas
  - Death Rituals and Shraddha
  - Yagna and Havan Ceremonies

**Status Management**:
- PENDING - New request
- CONFIRMED - Scheduled
- COMPLETED - Performed
- CANCELLED - Cancelled

**Tracking**:
- Request number generation (PUJ-00001)
- Devotee assignment
- Deity specification
- Priest assignment
- Cost estimation and actual costs
- Special requests and notes
- Completion tracking

**Database Model**: `PujaRequest`
- Request Number (auto-generated)
- Devotee Link
- Puja Type
- Deity Name
- Requested Date
- Actual Completion Date
- Number of People
- Estimated and Actual Costs
- Priest Assignment
- Status

**API Endpoints**:
- `GET /api/puja-requests` - List requests
- `POST /api/puja-requests` - Create request
- `GET /api/puja-requests/[id]` - Get details
- `PUT /api/puja-requests/[id]` - Update status
- `DELETE /api/puja-requests/[id]` - Cancel request

---

### 3. Mandir-Specific Donations

**Purpose**: Track donations for specific temple causes and purposes

**Location**: `/dashboard/mandir-donations`

**Donation Types**:
- CASH - Direct cash donations
- CHECK - Check donations
- BANK_TRANSFER - Bank transfers
- ONLINE - Online payment (UPI, Credit Card, etc.)
- ONLINE_SURVEY - Crowd funding/survey donations
- KIND - Donations in kind (materials, goods)

**Donation Purposes**:
- GENERAL - General temple fund
- MAINTENANCE - Temple building and infrastructure
- DEITY - Specific deity support
- PUJA - Puja and ritual expenses
- PRASAD - Blessed food distribution
- CHARITY - Charity/Daan activities
- EDUCATION - Religious/secular education
- MEDICAL - Medical aid fund
- SPECIAL_CAUSE - Special fundraisers

**Features**:
- Track donor information (devotee or external)
- Auto-generated donation numbers (DON-00001)
- Receipt generation (RCP-timestamp)
- Acknowledgment tracking
- Kind donation tracking (item, quantity, unit)
- Bank transfer details (account, IFSC, etc.)
- Cheque tracking (number, date, bank)
- GL integration for accounting

**Database Model**: `MandiDonation`
- Donation Number
- Devotee Link (optional)
- Donation Type
- Purpose
- Amount
- Donation Date
- Bank/Cheque Details
- Donor Information (for external donors)
- Receipt Number
- Acknowledgment Status

**API Endpoints**:
- `GET /api/mandir-donations` - List donations
- `POST /api/mandir-donations` - Record donation
- `GET /api/mandir-donations/[id]` - Get details
- `PUT /api/mandir-donations/[id]` - Update status
- `DELETE /api/mandir-donations/[id]` - Delete

---

### 4. Mandir Trustees

**Purpose**: Manage trustee information and roles

**Features**:
- Trustee role assignment:
  - President
  - Vice President
  - Treasurer
  - Secretary
  - Member
  - Trustee-at-large

**Information Tracked**:
- Member number
- Role and designation
- Residence address and phone
- Trustee term dates
- Digital signature
- Contact details

**Database Model**: `MandiTrusty`
- User Link
- Trustee Role
- Member Number
- Residence Address
- Trustee Start/End Dates
- Term End Date
- Signature
- Notes

---

### 5. Temple Asset Management

**Purpose**: Track and maintain temple properties and assets

**Features**:
- Asset type classification:
  - Building (Main temple, annexes)
  - Furniture & Fixtures
  - Religious Items (Idols, utensils)
  - Vehicles
  - Equipment (Puja, kitchen, etc.)
  - Land/Property
  - Decorative Items
  - Utility Items

**Depreciation Tracking**:
- Purchase date and cost
- Current value
- Depreciation methods:
  - Straight Line
  - Written Down Value
- Depreciation rate
- Location tracking
- Condition monitoring
- Status (Active, Under Maintenance, Disposed)

**Database Model**: `TempleAsset`
- Asset Code
- Asset Type
- Asset Name
- Description
- Purchase Date and Cost
- Current Value
- Depreciation Details
- Location
- Condition
- Status
- Image URL

---

### 6. Charity Programs

**Purpose**: Manage charitable activities and disbursements

**Features**:
- Program creation and tracking
- Target amount vs. collected amount
- Distribution tracking
- Beneficiary management
- Program status (Active, Inactive, Completed)

**Database Model**: `CharityProgram`
- Program Name and Code
- Objectives
- Start and End Dates
- Target Amount
- Total Collected
- Total Distributed
- Status

**Distribution Model**: `CharityDistribution`
- Program Link
- Beneficiary Name and Type
- Distribution Date and Amount
- Approval tracking
- Receipt number

---

### 7. Temple Events

**Purpose**: Track temple events and fund allocation

**Features**:
- Event type classification
- Festival and community events
- Educational events
- Budget planning and expense tracking
- Attendance estimation
- Event status (Planned, Ongoing, Completed)

**Database Model**: `TempleEvent`
- Event Name and Code
- Event Type
- Event Date
- Duration
- Description and Location
- Expected Attendance
- Budget vs. Actual Expenses
- Organizer Details
- Status

---

## Chart of Accounts (COA) Customization

The following accounts have been configured for temple operations:

### Income Accounts
- Donations (General, Deity-specific, Charity)
- Puja Fees
- Temple Sales (Prasad, Books, etc.)
- Grants and Subsidies

### Expense Accounts
- Puja Expenses
- Priest Salaries
- Temple Maintenance
- Utilities
- Prasad and Food
- Charity Distribution
- Religious Education
- Administrative Expenses

### Asset Accounts
- Temple Building
- Land and Property
- Religious Items
- Vehicles
- Furniture and Fixtures

---

## Integration with Accounting System

All Mandir-specific transactions integrate with the main accounting system:

1. **Donations** → Automatically post to GL as Income
2. **Puja Expenses** → Post to GL as Expenses
3. **Charity Distribution** → Post to GL as Expenses
4. **Asset Purchase** → Post to GL as Assets
5. **Depreciation** → Automated depreciation entries

---

## Reports and Dashboards

### Devotee Reports
- Active Devotee List
- Donation Summary by Devotee
- Puja Participation Report
- Lifetime Member Report

### Puja Reports
- Upcoming Pujas
- Puja Completion Report
- Puja Revenue Report
- Most Requested Pujas

### Donation Reports
- Donation Summary by Purpose
- Donor List
- Donation Trend Analysis
- Acknowledgment Status Report

### Charity Reports
- Program-wise Distribution
- Beneficiary Report
- Fund Collection vs. Distribution
- Program Completion Report

### Asset Reports
- Asset Register
- Depreciation Schedule
- Asset Condition Report
- Insurance Value Report

---

## User Roles and Permissions

### SUPER_ADMIN
- Full access to all Mandir features
- Can manage trustees
- Can configure accounts

### COMMITTEE_ADMIN
- Manage devotees and puja requests
- Record donations
- Track assets
- View reports

### ACCOUNTANT
- Record and post donations
- Track puja expenses
- Manage depreciation
- Generate reports

### DATA_ENTRY_OPERATOR
- Record devotees
- Record donations
- Track puja requests
- Enter asset information

### VIEWER
- View-only access to all reports
- Cannot make transactions

---

## Workflows

### Puja Request Workflow
1. Devotee/Staff creates Puja Request
2. Request pending approval
3. Admin confirms and assigns priest
4. Priest performs puja
5. Request marked complete
6. Expense recorded (if fee charged)
7. Puja contribution recorded if applicable

### Donation Workflow
1. Donation received (cash/cheque/online)
2. Donation recorded with details
3. Receipt generated
4. Auto-post to GL as income
5. Acknowledgment sent to donor
6. Donor marked in database

### Asset Lifecycle
1. Asset purchased
2. Asset recorded with details
3. Depreciation scheduled
4. Annual depreciation calculated
5. GL entries auto-posted
6. Asset maintained/disposed
7. Write-off recorded

---

## Customization Options

To further customize for your specific temple:

1. **Add Custom Pujas**: Modify PujaType enum
2. **Add Donation Purposes**: Modify MandirDonationPurpose enum
3. **Add Festival Dates**: Create Festival calendar
4. **Add Specific Deities**: Maintain deity list
5. **Configure COA**: Align with your temple's chart
6. **Set up Priests**: Manage priest information
7. **Define Charges**: Set puja fees and charges
8. **Configure Reports**: Create custom reports

---

## API Reference

### Devotees
```
GET    /api/devotees              - List devotees
POST   /api/devotees              - Create devotee
GET    /api/devotees/[id]         - Get devotee
PUT    /api/devotees/[id]         - Update devotee
DELETE /api/devotees/[id]         - Delete devotee
```

### Puja Requests
```
GET    /api/puja-requests         - List requests
POST   /api/puja-requests         - Create request
GET    /api/puja-requests/[id]    - Get request
PUT    /api/puja-requests/[id]    - Update request
DELETE /api/puja-requests/[id]    - Delete request
```

### Mandir Donations
```
GET    /api/mandir-donations      - List donations
POST   /api/mandir-donations      - Record donation
GET    /api/mandir-donations/[id] - Get donation
PUT    /api/mandir-donations/[id] - Update donation
DELETE /api/mandir-donations/[id] - Delete donation
```

### Trustees
```
GET    /api/trustees              - List trustees
POST   /api/trustees              - Create trustee
GET    /api/trustees/[id]         - Get trustee
PUT    /api/trustees/[id]         - Update trustee
```

### Assets
```
GET    /api/temple-assets         - List assets
POST   /api/temple-assets         - Create asset
GET    /api/temple-assets/[id]    - Get asset
PUT    /api/temple-assets/[id]    - Update asset
DELETE /api/temple-assets/[id]    - Delete asset
```

---

## Best Practices

1. **Donation Acknowledgment**: Always send acknowledgment to donors
2. **Puja Completion**: Mark pujas as completed promptly
3. **Asset Maintenance**: Track maintenance activities
4. **Depreciation**: Review annually
5. **Charity Programs**: Track beneficiaries carefully
6. **Event Budget**: Plan and track event budgets
7. **Trustee Records**: Keep trustee information updated
8. **GL Integration**: Ensure all transactions post correctly

---

## Support and Documentation

For detailed setup and usage:
- See `MANDIR_ACCOUNTING_README.md` for complete guide
- See `TESTING_GUIDE.md` for test scenarios
- See `SETUP_CHECKLIST.md` for launch preparation

---

**Last Updated**: May 8, 2024
**Version**: 1.0
**Status**: Production Ready

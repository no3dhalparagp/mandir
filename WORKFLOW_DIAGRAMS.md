# Mandir Trust Accounting System - Mermaid Workflow Diagrams

## 1. Voucher Posting Flow

```mermaid
graph TD
    A["User Creates Voucher"] --> B["Select Type<br/>Cash/Payment/Collection/Journal"]
    B --> C["Fill Form with GL Mapping"]
    C --> D["Client Validation<br/>Zod Schema"]
    D -->|Invalid| E["Show Error Message"]
    E --> C
    D -->|Valid| F["Submit to API"]
    F --> G["Server Validation<br/>Auth & Business Logic"]
    G -->|Invalid| H["Return Error"]
    H --> C
    G -->|Valid| I["Generate Voucher Number<br/>VCH-YYYY-MM-001"]
    I --> J["Create Voucher Record<br/>Status: DRAFT"]
    J --> K["User Reviews<br/>Verification"]
    K --> L["Click Post Button"]
    L --> M["GL Posting Transaction"]
    M --> N["Create Journal Entries"]
    N --> O["Update Account Balances"]
    O --> P["Record Audit Log"]
    P --> Q["Set Status: POSTED"]
    Q --> R["Confirmation & Success"]
    R --> S["Visible in Reports"]
```

## 2. Devotee Lifecycle

```mermaid
graph TD
    A["New Devotee Joins"] --> B["Register in System"]
    B --> C["Assign Unique ID"]
    C --> D["Profile Created"]
    D --> E["Active Tracking"]
    E --> F{Devotee Activities}
    F -->|Makes Donation| G["Link to Donations"]
    F -->|Requests Puja| H["Link to Puja Requests"]
    F -->|Visits Temple| I["Update Last Visit"]
    G --> J["Donation Tracked"]
    H --> K["Puja Request Tracked"]
    I --> L["Engagement Metrics"]
    J --> M["Dashboard Shows Total"]
    K --> M
    L --> M
    M --> N["View Devotee Profile"]
    N --> O["See All Activities"]
    O --> P["Communication & Reports"]
```

## 3. Donation Processing

```mermaid
graph TD
    A["Donation Received"] --> B{Donation Type}
    B -->|Cash| C["Record Amount"]
    B -->|Check| D["Record Check Details"]
    B -->|Bank Transfer| E["Record Bank Info"]
    B -->|Online| F["Record Online Details"]
    B -->|In-Kind| G["Record Item Details"]
    C --> H["Select Purpose<br/>9 Options"]
    D --> H
    E --> H
    F --> H
    G --> H
    H --> I["Link to Devotee/Donor"]
    I --> J["Generate Donation Number<br/>DON-00001"]
    J --> K["Create GL Entry<br/>Debit Bank/Cash<br/>Credit Donation Revenue"]
    K --> L["Generate Receipt<br/>RCP-TIMESTAMP"]
    L --> M["Send Acknowledgment"]
    M --> N["Update Party Ledger"]
    N --> O["Donation Appears in Reports"]
```

## 4. Puja Request Lifecycle

```mermaid
graph TD
    A["Devotee Submits Puja Request"] --> B["Select Puja Type<br/>7 Types"]
    B --> C["Set Requested Date"]
    C --> D["Enter Details"]
    D --> E["Generate Request Number<br/>PUJ-00001"]
    E --> F["Status: PENDING"]
    F --> G["Admin Reviews"]
    G --> H["Assign Priest & Date"]
    H --> I["Estimate Cost"]
    I --> J["Status: CONFIRMED"]
    J --> K["Puja Date Arrives"]
    K --> L["Puja Performed"]
    L --> M["Record Actual Cost"]
    M --> N["Status: COMPLETED"]
    N --> O["GL Post if Cost"]
    O --> P["Generate Receipt"]
    P --> Q["Link to Devotee"]
    Q --> R["Appears in Reports"]
```

## 5. User Authentication Flow

```mermaid
graph TD
    A["User Navigates to Login"] --> B["Enter Credentials"]
    B --> C["Email & Password"]
    C --> D["Server Verification<br/>Bcrypt Hash Check"]
    D -->|Invalid| E["Show Error"]
    E --> B
    D -->|Valid| F["Create JWT Token"]
    F --> G["Create Session"]
    G --> H["Set HTTP-Only Cookie"]
    H --> I["User Logged In"]
    I --> J{"Check User Role"}
    J -->|SUPER_ADMIN| K["Grant Full Access"]
    J -->|TREASURER| L["Grant Finance Access"]
    J -->|SECRETARY| M["Grant Report Access"]
    J -->|MEMBER| N["Grant Limited Access"]
    K --> O["Verify Permissions on Each Request"]
    L --> O
    M --> O
    N --> O
    O --> P["Allow/Deny Access"]
    P --> Q["Session Active for 30 Days"]
    Q --> R["User Logout"]
    R --> S["Destroy Session"]
    S --> T["Invalidate JWT"]
    T --> U["Delete Cookie"]
```

## 6. GL Posting Process

```mermaid
graph TD
    A["Voucher Posted"] --> B["Extract GL Mapping"]
    B --> C["Line Item 1: Account 1010"]
    C --> D["Line Item 2: Account 4010"]
    D --> E["Begin Transaction"]
    E --> F["Validate Double-Entry"]
    F -->|Not Balanced| G["Rollback & Error"]
    F -->|Balanced| H["Create Journal Entries"]
    H --> I["Update Account 1010 Balance"]
    I --> J["Update Account 4010 Balance"]
    J --> K["Calculate Running Balances"]
    K --> L["Update Trial Balance"]
    L --> M["Record GL Reference"]
    M --> N["Commit Transaction"]
    N --> O["Create Audit Entry"]
    O --> P["GL Fully Reconciled"]
```

## 7. Data Flow: Request to Database

```mermaid
graph LR
    A["React Component<br/>VoucherForm"] -->|JSON| B["API POST<br/>/api/vouchers"]
    B --> C["NextAuth<br/>Verify JWT"]
    C --> D["Middleware<br/>Check Role"]
    D --> E["Handler Function<br/>POST request"]
    E --> F["Zod Validation<br/>Schema Check"]
    F --> G["Business Logic<br/>Double-Entry Check"]
    G --> H["Prisma ORM<br/>Query Builder"]
    H --> I["MongoDB<br/>Transactions"]
    I -->|Create| J["Voucher Document"]
    I -->|Create| K["LineItem Documents"]
    I -->|Update| L["Account Balances"]
    I -->|Insert| M["Audit Log"]
    J -->|Result| N["API Response<br/>200 OK"]
    K -->|Result| N
    L -->|Result| N
    M -->|Result| N
    N -->|JSON| O["Client Cache<br/>SWR"]
    O -->|Re-render| P["UI Updates<br/>List View"]
```

## 8. Role-Based Access Control

```mermaid
graph TD
    A["User Authenticated"] --> B["Retrieve User Role"]
    B --> C{Role Type}
    C -->|SUPER_ADMIN| D["All Features"]
    C -->|COMMITTEE_ADMIN| E["Admin Functions"]
    C -->|TREASURER| F["Finance Only"]
    C -->|SECRETARY| G["Reports Only"]
    C -->|MEMBER| H["Own Data Only"]
    D --> D1["Users Management"]
    D --> D2["All Vouchers"]
    D --> D3["All Reports"]
    D --> D4["System Settings"]
    E --> E1["Devotee Mgmt"]
    E --> E2["Voucher Posting"]
    E --> E3["Report Gen"]
    F --> F1["All GL Access"]
    F --> F2["Bank Accounts"]
    F --> F3["Financial Reports"]
    G --> G1["View Devotees"]
    G --> G2["View Reports"]
    H --> H1["View Own Profile"]
    H --> H2["Submit Requests"]
    H --> H3["View Own Donations"]
```

## 9. Financial Transaction Reconciliation

```mermaid
graph TD
    A["Daily Transactions"] --> B["All Vouchers Posted"]
    B --> C["Extract All Journal Entries"]
    C --> D["Group by Account"]
    D --> E["Calculate Totals"]
    E --> F["Debits: ₹X"]
    E --> G["Credits: ₹X"]
    F --> H{"Debit = Credit?"}
    G --> H
    H -->|No| I["Error: Out of Balance"]
    I --> J["Investigate Discrepancy"]
    J --> K["Reverse/Fix Entry"]
    K --> H
    H -->|Yes| L["Trial Balance Passed"]
    L --> M["Generate GL Report"]
    M --> N["Generate Party Ledgers"]
    M --> O["Generate Cash Book"]
    N --> P["Reconciliation Complete"]
    O --> P
```

## 10. Complete System Integration

```mermaid
graph TD
    subgraph "User Layer"
        U["Devotees & Staff"]
    end
    
    subgraph "Presentation Layer"
        UI["React Components<br/>Pages & Forms"]
    end
    
    subgraph "Client Layer"
        V["Validation<br/>Zod Schemas"]
        D["Data Management<br/>SWR Hooks"]
    end
    
    subgraph "API Layer"
        A1["/api/vouchers"]
        A2["/api/devotees"]
        A3["/api/donations"]
        A4["/api/pujas"]
    end
    
    subgraph "Business Logic Layer"
        B1["Authentication<br/>NextAuth"]
        B2["Authorization<br/>RBAC"]
        B3["Validation<br/>Business Rules"]
        B4["GL Posting"]
        B5["Balance Calc"]
    end
    
    subgraph "Data Access Layer"
        P["Prisma ORM"]
    end
    
    subgraph "Database Layer"
        DB["MongoDB<br/>Collections"]
    end
    
    subgraph "Reports & Analytics"
        R1["GL Reports"]
        R2["Party Ledgers"]
        R3["Cash Book"]
        R4["Trial Balance"]
    end
    
    U --> UI
    UI --> V
    V --> D
    D --> A1
    D --> A2
    D --> A3
    D --> A4
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5
    
    B5 --> P
    P --> DB
    
    DB --> R1
    DB --> R2
    DB --> R3
    DB --> R4
```

## Key Characteristics

### Synchronous Operations
- All workflows are real-time
- Immediate feedback to users
- Instant GL posting
- Immediate balance updates

### Asynchronous Operations
- Email acknowledgments (future enhancement)
- Report generation (queued)
- Bulk imports (background jobs)

### Error Handling
- Client-side validation first
- Server-side validation always
- Transaction rollback on error
- Detailed error messages
- Audit trail of failures

### Data Integrity
- ACID transactions
- Double-entry verification
- Unique constraints
- Foreign key relationships
- Audit logging

---

## Conclusion

These workflows demonstrate:
- **Robustness**: Multiple validation layers
- **Security**: Authentication & authorization
- **Integrity**: Double-entry, audit trails
- **Usability**: Clear processes, immediate feedback
- **Scalability**: Efficient data flow, indexed queries

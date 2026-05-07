# Mandir Accounting Management System

A complete accounting system for managing temple finances, including vouchers, staff, parties, and comprehensive financial reports.

## 🎯 Features

### 1. **Voucher Management System**
- **Cash Entry Vouchers**: Record income and cash receipts
- **Payment Vouchers**: Track expenses and payments
- **Collection Vouchers**: Record member collections with automatic ledger updates
- **Journal Vouchers**: Post adjusting entries directly to GL
- Auto-generated voucher numbering (VCH-YYYY-MM-001)
- Draft → Posted workflow with audit trails
- Automatic double-entry GL posting

### 2. **Staff Management**
- Complete staff profile management
- Designation, department, and employment tracking
- Banking details for salary payments
- Document tracking (PAN, Aadhar)
- Search and filter by multiple fields

### 3. **Party Ledger System**
- Vendor, customer, member, and party classification
- Opening and current balance tracking
- Automatic balance updates with transactions
- Party-wise transaction history
- Payment terms management

### 4. **Cheque Payment System**
- Complete cheque lifecycle (PENDING → CLEARED/BOUNCED/CANCELLED)
- Bank and date-wise filtering
- Cheque clearance tracking
- Integration with payment vouchers
- Bounce management with reasons

### 5. **Financial Reports**
- **Cash Book**: Daily summaries with running balances
- **Bank Passbook**: Transaction-wise statements
- **Party Ledger Reports**: Complete transaction history per party
- **Journal Entries**: GL postings from all vouchers
- **Monthly/Yearly Statements**: Comprehensive financial summaries

### 6. **General Ledger & Chart of Accounts**
- Complete chart of accounts with categories
- GL postings from vouchers
- Balance verification (debits = credits)
- Account-wise balance reports

## 📁 Project Structure

```
app/
├── api/
│   ├── vouchers/          # Voucher CRUD and posting
│   ├── staff/             # Staff management
│   ├── parties/           # Party management
│   ├── cheques/           # Cheque tracking
│   └── reports/           # Report generation
└── dashboard/
    ├── vouchers/          # Voucher pages
    ├── staff/             # Staff pages
    ├── parties/           # Party pages
    ├── party-ledger/      # Ledger report
    ├── registers/cheques/ # Cheque register
    └── reports/           # All financial reports

components/
├── vouchers/              # Voucher components
├── staff/                 # Staff components
├── parties/               # Party components
└── party/                 # Party ledger components

lib/
├── voucher-utils.ts       # Voucher utilities
└── utils.ts               # Formatting functions
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB database
- Environment variables configured

### Installation

1. **Clone and install dependencies**
```bash
npm install
# or
yarn install
```

2. **Configure Environment Variables**
Create `.env` file with:
```
NEXTAUTH_SECRET=<generated-secret>
DATABASE_URL=<mongodb-url>
```

3. **Generate Prisma Client**
```bash
npx prisma generate
```

4. **Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000/dashboard`

## 📊 API Endpoints

### Vouchers
- `GET /api/vouchers` - List all vouchers
- `POST /api/vouchers` - Create new voucher
- `GET /api/vouchers/[id]` - Get voucher details
- `PUT /api/vouchers/[id]` - Update voucher
- `POST /api/vouchers/[id]/post` - Post voucher to GL

### Staff
- `GET /api/staff` - List all staff
- `POST /api/staff` - Add staff member
- `GET /api/staff/[id]` - Get staff details
- `PUT /api/staff/[id]` - Update staff
- `DELETE /api/staff/[id]` - Remove staff

### Parties
- `GET /api/parties` - List all parties
- `POST /api/parties` - Create party
- `GET /api/parties/[id]` - Get party details
- `PUT /api/parties/[id]` - Update party
- `DELETE /api/parties/[id]` - Deactivate party

### Cheques
- `GET /api/cheques` - List cheques
- `POST /api/cheques` - Create cheque entry
- `PUT /api/cheques/[id]` - Update cheque status

### Reports
- `GET /api/reports/party-ledger` - Party ledger data

## 🎨 User Interface

### Navigation
All features are accessible from the sidebar under respective sections:
- **Finance**: Vouchers, Donations, Expenses, Collections
- **Administration**: Members, Staff, Parties, Events
- **Reports**: Cash Book, Party Ledger, Statements
- **Registers**: Cheque Register, Asset Register

### Color Coding
- **Voucher Status**: Draft (gray), Posted (green), Cancelled (red)
- **Party Type**: Vendor (blue), Customer (green), Member (purple)
- **Cheque Status**: Pending (yellow), Cleared (green), Bounced (red)
- **Balance**: Positive (red - party owes us), Negative (green - we owe party)

## 🔐 Security

- Role-based access control (SUPER_ADMIN, ACCOUNTANT, VIEWER)
- Audit trails for all transactions
- Double-entry verification for GL
- Voucher numbering prevents duplicates
- Password hashing with bcrypt
- Session management with NextAuth

## 📈 Data Validation

### Voucher Rules
- Minimum 2 line items per voucher
- Debits must equal credits
- Total amount must be positive
- Voucher date cannot be in future

### Party Rules
- Party code must be unique
- Party name is required
- Opening balance cannot be modified after transactions

### Cheque Rules
- Cheque number must be unique per bank account
- Cheque date cannot be in future
- Status transitions are controlled

## 🧪 Testing

See `TESTING_GUIDE.md` for comprehensive testing scenarios and checklist.

## 📝 Database Schema

### Key Tables
- **Voucher**: Core voucher records
- **VoucherLineItem**: GL entries for each voucher
- **PartyLedger**: Party master with balance tracking
- **PartyTransaction**: Party-wise transaction history
- **StaffDetail**: Staff profile information
- **ChequeRegister**: Cheque tracking and status
- **JournalEntry**: GL entries with accounts and amounts
- **ChartOfAccount**: Chart of accounts master

See `prisma/schema.prisma` for complete schema.

## 🚀 Deployment

1. **Build for production**
```bash
npm run build
```

2. **Test the build**
```bash
npm run start
```

3. **Deploy to Vercel**
```bash
vercel deploy --prod
```

## 📚 Documentation

- `ACCOUNTING_SYSTEM_GUIDE.md` - Feature documentation
- `SETUP_CHECKLIST.md` - Pre-launch checklist
- `TESTING_GUIDE.md` - Test scenarios
- `IMPLEMENTATION_SUMMARY.md` - Technical summary

## 🐛 Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Run `npm install` to update dependencies
- Clear `.next` folder and rebuild

### API Errors
- Check database connectivity
- Verify MongoDB URI in .env
- Check Prisma client generation

### UI Issues
- Clear browser cache
- Check console for errors
- Verify shadcn/ui components are installed

## 🤝 Contributing

When adding new features:
1. Create API route first
2. Add Prisma schema changes
3. Create UI components
4. Add to sidebar navigation
5. Update documentation

## 📞 Support

For issues or questions:
1. Check the documentation
2. Review test guides
3. Check browser console errors
4. Review audit logs for transaction details

## 📄 License

Internal use only - Mandir Accounting System

## 🎉 Version History

### v1.0 (Current)
- Complete voucher system with all types
- Staff and party management
- Cheque tracking system
- Financial reports and ledgers
- Double-entry GL posting
- Role-based access control

---

**Last Updated**: May 2024
**Status**: Production Ready ✓

# Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Verify Environment
```bash
# Check if .env file exists
cat .env

# Should contain:
# - NEXTAUTH_SECRET=<your-secret>
# - DATABASE_URL=<your-mongodb-url>
```

### 2. Start Development Server
```bash
npm run dev
# or
yarn dev
```

### 3. Access Dashboard
- Open: `http://localhost:3000/dashboard`
- Login with your credentials

## 🎯 Common Tasks

### Create a Voucher
1. Go to **Finance > Vouchers**
2. Click **"New Voucher"**
3. Select voucher type (Cash Entry, Payment, Collection, Journal)
4. Fill amount and details
5. Add GL line items
6. Click **Post** to save to ledger

### Add Staff Member
1. Go to **Administration > Staff Directory**
2. Click **"Add Staff"**
3. Fill employment and banking details
4. Click **"Add Staff Member"**

### Create Party
1. Go to **Administration > Parties**
2. Click **"Add Party"**
3. Select type (Vendor/Customer/Member/Party)
4. Enter contact and financial details
5. Click **"Create Party"**

### View Reports
1. Go to **Reports**
2. Select report type:
   - **Cash Book** - Daily cash summary
   - **Bank Passbook** - Bank transactions
   - **Party Ledger** - Party balances

### Track Cheque
1. Go to **Registers > Cheque Register**
2. View all cheques
3. Click to update status (Clear/Bounce)

## 📊 Key Screens

| Feature | Path | Purpose |
|---------|------|---------|
| Vouchers | `/dashboard/vouchers` | Create and manage vouchers |
| Staff | `/dashboard/staff` | Staff directory |
| Parties | `/dashboard/parties` | Vendor/customer management |
| Party Ledger | `/dashboard/party-ledger` | Balance reports |
| Cash Book | `/dashboard/reports/cash-book` | Daily cash summary |
| Cheque Register | `/dashboard/registers/cheques` | Cheque tracking |

## 🔑 Quick Reference

### Voucher Types
- **Cash Entry**: Record income/cash receipts
- **Payment**: Track expenses and payments
- **Collection**: Member collections with GL posting
- **Journal**: Direct GL adjustments

### Party Types
- **Vendor**: Suppliers and vendors
- **Customer**: Buyers and customers
- **Member**: Temple members
- **Party**: General parties

### Cheque Status
- **PENDING**: Cheque issued but not cleared
- **CLEARED**: Bank has processed the cheque
- **BOUNCED**: Cheque returned by bank
- **CANCELLED**: Cheque cancelled

## ✅ Voucher Workflow

```
Create (DRAFT)
    ↓
Add Line Items
    ↓
Verify Balance (Debit = Credit)
    ↓
POST Voucher
    ↓
POSTED (GL entries created)
    ↓
(Optional) Cancel Voucher
```

## 📱 Mobile Friendly
- All pages are responsive
- Works on tablets and phones
- Touch-friendly buttons
- Optimized for smaller screens

## 🔍 Search & Filter

### Voucher Search
- Filter by type
- Filter by status
- Filter by date range
- Search by description

### Staff Search
- Search by name
- Search by email
- Search by designation
- Filter by department

### Party Search
- Search by name or code
- Filter by type
- Filter by status (active/inactive)

## 🚀 Tips & Tricks

1. **Voucher Numbering**: Automatically generated as VCH-YYYY-MM-XXX
2. **Balance Check**: Always verify debits = credits before posting
3. **Party Balance**: Shows color-coded balance (red=owing, green=payable)
4. **Search**: Use any field to find records
5. **Reports**: Can be printed or exported from browser

## ❌ Common Issues

### "Voucher cannot be posted"
- Ensure debits equal credits
- Check all line items are filled
- Verify GL accounts are valid

### "Party not found"
- Ensure party is active
- Check party code spelling
- Verify party exists

### "Cheque update failed"
- Verify cheque exists
- Check status transition is valid
- Ensure date is valid

## 💡 Best Practices

1. **Daily**: Review cash book
2. **Weekly**: Check party balances
3. **Monthly**: Verify GL entries
4. **Quarterly**: Review audit logs
5. **Yearly**: Close books with month-close process

## 📞 Need Help?

1. **Check Docs**: See MANDIR_ACCOUNTING_README.md
2. **Test Guide**: See TESTING_GUIDE.md
3. **Setup Help**: See SETUP_CHECKLIST.md
4. **Technical**: See IMPLEMENTATION_SUMMARY.md

## 🎓 Learn More

### Videos (if available)
- Voucher creation process
- Staff management walkthrough
- Party ledger guide
- Report generation

### Manuals (if available)
- Complete system manual
- User guide
- Admin guide
- Financial reporting guide

## ⚙️ Admin Tasks

### Regular Maintenance
```bash
# Clear cache
rm -rf .next

# Rebuild
npm run build

# Restart server
npm run dev
```

### Database Backup
```bash
# MongoDB backup
mongoexport --uri="$DATABASE_URL" ...
```

### Check Logs
- Browser Console: F12
- Server Logs: Terminal output
- Audit Logs: Dashboard > System > Audit Log

## 🔐 Security Reminder
- Never share NEXTAUTH_SECRET
- Keep DATABASE_URL private
- Use strong passwords
- Review audit logs regularly
- Verify transactions before posting

---

**Version**: 1.0  
**Last Updated**: May 2024  
**Status**: Production Ready ✅

For detailed information, refer to complete documentation in project root.

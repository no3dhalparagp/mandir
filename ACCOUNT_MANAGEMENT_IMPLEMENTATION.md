# Account Management System Implementation

## Overview

A comprehensive account management system has been implemented for the Mandir Accounting System with full user CRUD operations, self-service profile management, and advanced security features.

## What's Been Implemented

### 1. Database Schema Updates

**New Fields Added to User Model:**
- `lastLoginAt`: Timestamp of last successful login
- `lastLoginIp`: IP address of last login
- `lastLoginDevice`: Device information from last login
- `loginAttempts`: Counter for failed login attempts
- `lockedUntil`: Timestamp for account lock due to brute force
- `passwordChangedAt`: Timestamp of last password change
- `twoFactorEnabled`: Flag for 2FA support (future use)
- `twoFactorSecret`: Storage for 2FA secret (future use)

**New Models Created:**
- `LoginHistory`: Tracks all login attempts (successful and failed) with IP, device, and status
- `ActiveSession`: Manages active user sessions with expiration tracking
- `UserInvite`: Handles user invitations with expiring tokens

### 2. API Endpoints

#### User Management (`/api/users`)
- **GET** `/api/users` - List all users with search, filtering, and pagination (Admin only)
- **POST** `/api/users` - Create new user (SUPER_ADMIN only)
- **GET** `/api/users/[id]` - View user details
- **PUT** `/api/users/[id]` - Update user profile, role, and status
- **DELETE** `/api/users/[id]` - Deactivate user account (soft delete)

#### Password Management (`/api/users/[id]/password`)
- **POST** `/api/users/[id]/password` - Change password with strength validation and current password verification

#### Login History (`/api/users/[id]/login-history`)
- **GET** `/api/users/[id]/login-history` - View login history with pagination

#### Session Management (`/api/users/[id]/sessions`)
- **GET** `/api/users/[id]/sessions` - View active sessions
- **DELETE** `/api/users/[id]/sessions` - Revoke specific session

#### Audit Log (`/api/audit-log`)
- **GET** `/api/audit-log` - View system audit logs with filtering (Admin only)

### 3. User Interface Components

#### User Management Dashboard (`/dashboard/users`)
- **UsersPageClient**: Main user management interface with:
  - Search by name or email
  - Filter by role (Super Admin, Committee Admin, Accountant, Data Entry, Viewer)
  - Filter by status (Active, Inactive)
  - Pagination (10 users per page)
  - View, edit, and deactivate users
  - Add new users dialog

#### User Management Dialogs
- **AddUserDialog**: Create new users with password strength requirements
- **EditUserDialog**: Update user name, email, role, and status
- **ViewUserDialog**: Display detailed user information

#### User Profile (`/dashboard/profile`)
- **UserProfileClient**: Self-service profile management with three tabs:

  1. **Profile Tab**:
     - Update name and email
     - View account information (role, creation date)
     - View last login timestamp
  
  2. **Password Tab**:
     - Secure password change with:
       - Current password verification
       - Password strength validation (8+ chars, uppercase, lowercase, number)
       - Password confirmation
  
  3. **Activity Tab**:
     - **LoginHistoryClient**: Browse login history with pagination
     - **ActiveSessionsClient**: Manage active sessions with revocation

#### Audit Log (`/dashboard/audit-log`)
- **AuditLogClient**: Admin-only interface to:
  - View all system actions and user activities
  - Filter by action type and status
  - Paginated display (20 entries per page)
  - IP address tracking

### 4. Security Features

#### Authentication & Access Control
- Role-based access control (RBAC) with 5 roles
- Protected routes with session validation
- Permission-based API endpoint access

#### Password Security
- bcryptjs hashing (10 rounds)
- Password strength validation rules
- Password change history tracking
- Minimum 8 characters with uppercase, lowercase, and numbers

#### Brute Force Protection
- Login attempt tracking
- Automatic account lock after 5 failed attempts
- 15-minute lock duration (configurable)
- Lock expiration and reset

#### Session Management
- Active session tracking with device information
- Session expiration (30 days default)
- IP address and user agent tracking
- Session revocation capability

#### Audit Logging
- All user actions logged with:
  - Timestamp
  - User ID and details
  - Action performed
  - Resource affected
  - Success/failure status
  - IP address
  - Additional details in JSON format

#### Login History
- All login attempts recorded (success and failure)
- Device detection using ua-parser-js
- IP address tracking
- Failure reasons for troubleshooting

### 5. Security Utility Functions (`lib/security.ts`)

- `recordLoginAttempt()` - Log login attempts
- `recordFailedLogin()` - Handle failed logins and brute force
- `checkAccountLock()` - Verify account lock status
- `createSession()` - Initialize new session
- `cleanupExpiredSessions()` - Remove expired sessions
- `recordAuditLog()` - Log system actions
- `getUserAuditLogs()` - Retrieve user audit history

### 6. Navigation Updates

Added "Account" section in sidebar with link to `/dashboard/profile`

## Password Requirements

All passwords must meet these criteria:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

## Role Hierarchy

1. **SUPER_ADMIN** (Level 5) - Full system access, user management
2. **COMMITTEE_ADMIN** (Level 4) - Administrative tasks, partial user management
3. **ACCOUNTANT** (Level 3) - Financial operations
4. **DATA_ENTRY_OPERATOR** (Level 2) - Data entry privileges
5. **VIEWER** (Level 1) - Read-only access

## Next Steps to Complete

1. **Database Migration**: Run Prisma migration once DATABASE_URL is configured:
   ```bash
   pnpm prisma migrate dev --name add_security_fields
   ```

2. **Login Integration**: Update the login handler in `/app/login/actions.ts` to:
   - Call `recordLoginAttempt()` on success
   - Call `recordFailedLogin()` on failure
   - Check `checkAccountLock()` before authentication
   - Create sessions with `createSession()`

3. **2FA Implementation** (Optional): Use the `twoFactorEnabled` and `twoFactorSecret` fields to add TOTP 2FA support

4. **Email Notifications** (Optional): Add email alerts for:
   - New login from unusual location
   - Password changes
   - Failed login attempts

## Testing Checklist

- [ ] Create new user via UI
- [ ] Edit user name, email, and role
- [ ] Deactivate user account
- [ ] Search and filter users
- [ ] Update own profile
- [ ] Change password with validation
- [ ] View login history
- [ ] View and revoke active sessions
- [ ] View audit logs (admin only)
- [ ] Test password strength validation
- [ ] Test brute force lock mechanism
- [ ] Verify role-based access control

## File Structure

```
app/
├── api/
│   ├── users/
│   │   ├── route.ts (CRUD)
│   │   ├── [id]/
│   │   │   ├── route.ts (GET, PUT, DELETE)
│   │   │   ├── password/
│   │   │   │   └── route.ts (POST)
│   │   │   ├── login-history/
│   │   │   │   └── route.ts (GET)
│   │   │   └── sessions/
│   │   │       └── route.ts (GET, DELETE)
│   └── audit-log/
│       └── route.ts (GET)
├── dashboard/
│   ├── users/
│   │   └── page.tsx (User management)
│   ├── profile/
│   │   └── page.tsx (User profile)
│   └── audit-log/
│       └── page.tsx (Audit log)
components/
└── users/
    ├── users-page-client.tsx
    ├── add-user-dialog.tsx
    ├── edit-user-dialog.tsx
    ├── view-user-dialog.tsx
    ├── user-profile-client.tsx
    ├── login-history-client.tsx
    ├── active-sessions-client.tsx
    └── audit-log-client.tsx
lib/
├── security.ts (Security utilities)
├── authorization.ts (Authorization helpers)
└── roles.ts (Role definitions)
```

## Dependencies Added

- `ua-parser-js@2.0.9` - For parsing user agent and device detection

## Notes

- All dates are stored in UTC and formatted using date-fns
- API responses include pagination metadata
- Soft delete pattern used for user deactivation (not hard delete)
- All passwords are hashed before storage
- User-agent string is parsed to extract browser and OS information

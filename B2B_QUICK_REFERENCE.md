# B2B Quick Reference Guide

## One-Minute Overview

**RHV DMS is a B2B application. Only admins can create user accounts.**

- Public users see login only
- Admins create accounts via admin panel
- Everyone logs in at `/login`
- User creation at `/dashboard/admin/create-user`

---

## Quick Links

| Page | URL | Who | Purpose |
|------|-----|-----|---------|
| Login | `/login` | Everyone | Sign in to system |
| Register (Blocked) | `/register` | Public | Access denied message |
| User Management | `/dashboard/admin/users` | Admin | View/manage users |
| Create User | `/dashboard/admin/create-user` | Admin | Add new account |

---

## How to Create a User (Admin)

```
1. Login as admin
2. Go to: /dashboard/admin/users
3. Click: "Add User" button
4. Fill in:
   - Name: John Smith
   - Email: john@rhv.com
   - Department: Finance
   - Role: User
   - Password: TempPass123
5. Click: "Create User"
6. See: Green success notification
7. New user can now login
```

---

## User Roles

| Role | Access Level | Key Permissions |
|------|-------------|-----------------|
| **Admin** | Full | Create users, manage all, delete users |
| **HOD** | Department | Manage dept, assign roles, reports |
| **User** | Standard | Upload/download, view shared files |

---

## Form Fields

### Create User Form

```
Full Name*          - Text input (2+ chars)
Email*              - Email input (unique)
Department*         - Dropdown (select one)
Role*               - Dropdown (Admin/HOD/User)
Temporary Password* - Password (6+ chars)

* Required field
```

---

## Error Messages (Red)

```
"Name must be at least 2 characters"
"Invalid email address"
"Please select a department"
"Please select a valid role"
"Password must be at least 6 characters"
"Email already exists"
```

---

## Success Message (Green)

```
"User Created"
"[Name] has been added to the system."
```

---

## Departments Available

- IT
- Finance
- HR
- Operations
- Medical
- Admin

---

## What Users See at `/register`

```
❌ Access Restricted
   "User registration is admin-only"

⚙️ "User accounts are created and managed 
   by administrators only."

📝 What you can do:
   • Ask administrator to create account
   • Sign in with existing credentials
   • Contact IT support

[Back to Login] [Contact Support]
```

---

## Keyboard Shortcuts

```
N   - New user (when in admin panel)
S   - Search users
E   - Export users (if enabled)
? - Help menu
```

---

## Common Tasks

### Create Multiple Users
1. Go to `/dashboard/admin/create-user`
2. Fill form
3. Click "Create User"
4. Repeat for each user

### Reset User Password
1. Go to User Management
2. Click user actions (...)
3. Select "Reset Password"
4. User receives reset email

### Suspend User
1. Go to User Management
2. Click user actions (...)
3. Select "Suspend"
4. User cannot login until reactivated

### Delete User
1. Go to User Management
2. Click user actions (...)
3. Select "Delete"
4. User permanently removed

---

## Security Reminders

✓ Use strong temporary passwords
✓ Tell users to change password on first login
✓ Only create accounts for authorized people
✓ Verify email before creating account
✓ Review user access regularly
✓ Suspend inactive accounts
✓ Document user modifications

---

## Troubleshooting

**Q: User sees "Access Restricted" at /register?**
A: This is correct - registration is admin-only. Direct them to ask admin.

**Q: Admin can't access create-user page?**
A: Verify admin role is assigned. Reload page.

**Q: New user can't login?**
A: Check account status is "Active". Verify email & password.

**Q: Form shows red error?**
A: Fix the highlighted field and try again.

---

## API Endpoints (Developers)

```
POST   /auth/register        - Create user (admin route)
GET    /users                - List users (admin)
PUT    /users/:id/suspend    - Suspend user
PUT    /users/:id/activate   - Activate user
DELETE /users/:id            - Delete user permanently
```

---

## Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
JWT_SECRET=your-secret
```

---

## File Locations

```
Login:                  app/login/page.tsx
Register (Blocked):     app/register/page.tsx
User Management:        app/dashboard/admin/users/page.tsx
Create User:            app/dashboard/admin/create-user/page.tsx
Auth API:               services/api/auth.ts
Auth Hooks:             hooks/useAuth.ts
```

---

## Related Documentation

- [Full Admin Guide](./B2B_ADMIN_GUIDE.md)
- [Implementation Details](./B2B_IMPLEMENTATION.md)
- [Project README](./README.md)
- [Developer Reference](./QUICK_REFERENCE.md)

---

## Contact

- Email: support@rhv.com
- Admin Panel: /dashboard/admin
- Documentation: /dashboard/docs
- System Admin: Ask IT department

---

**Last Updated**: 2026
**Version**: 2.0 (B2B)
**Status**: Production Ready ✓

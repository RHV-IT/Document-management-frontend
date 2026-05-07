# B2B Admin-Only User Management Guide

## Overview

RHV DMS is a **B2B (Business-to-Business) application** with strict access controls. User account creation is **restricted to administrators only**. This ensures security, compliance, and proper onboarding workflows.

---

## Architecture

### Public Pages
- `/login` - Login page (available to all)
- `/register` - Access denied page (informs users to contact admin)

### Admin-Only Pages
- `/dashboard/admin/users` - User management & listing
- `/dashboard/admin/create-user` - User creation form (admin only)

---

## User Creation Flow

### Step 1: Admin Login
1. Admin navigates to `/login`
2. Enters their admin credentials
3. Redirected to `/dashboard`

### Step 2: Create New User
1. Click "User Management" in sidebar
2. Click "Add User" button (top right)
3. Redirected to `/dashboard/admin/create-user`
4. Fill in user details:
   - Full Name
   - Email Address
   - Department (dropdown)
   - Role (Admin/HOD/User)
   - Temporary Password

### Step 3: User Onboarding
1. Admin creates account with temporary password
2. System shows success notification
3. New user can login with credentials
4. User prompted to change password on first login

---

## User Roles

### Admin
- **Access**: Full system access
- **Permissions**: Create/manage users, assign roles, view all files, delete users
- **Use case**: System administrators, super users

### Head of Department (HOD)
- **Access**: Department-level access
- **Permissions**: Manage department files, suspend users, view reports
- **Use case**: Department heads, supervisors

### User
- **Access**: Standard access
- **Permissions**: Upload/download files, view shared files, manage own profile
- **Use case**: Regular employees, staff

---

## Creating a New User

### Page Location
**URL**: `http://localhost:3000/dashboard/admin/create-user`

### Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full Name | Text | Yes | 2+ characters |
| Email | Email | Yes | Must be unique |
| Department | Dropdown | Yes | IT, Finance, HR, Operations, Medical, Admin |
| Role | Dropdown | Yes | Admin, HOD, User |
| Temporary Password | Password | Yes | 6+ characters |

### Example Usage
```
Name: John Smith
Email: john.smith@rhv.com
Department: Finance
Role: User
Password: TempPass123
```

---

## Security Considerations

### Password Policy
- Minimum 6 characters
- Temporary password required on creation
- User must change password on first login

### Email Verification
- Accounts created with unverified emails
- Verification email sent automatically (optional)
- User can access system without verification

### Role-Based Access
- Roles strictly enforced via middleware
- Non-admin users cannot access create-user page
- Audit logs track all user creation events

---

## Error Handling

### Common Errors

**"Email already exists"**
- User with this email already exists
- Use different email or recover existing account

**"Invalid department"**
- Selected department doesn't exist
- Select from dropdown list only

**"Password too short"**
- Password must be at least 6 characters
- Increase password length

### Success Response
- User created notification appears at top
- Redirected to user management page
- New user appears in list with "Active" status

---

## User Management Page

### Features
- **Search**: Find users by name or email
- **Filter by Role**: Show only Admin/HOD/User
- **Pagination**: Navigate through user list
- **Actions**:
  - Suspend user account
  - Activate suspended user
  - View user details
  - Delete user (permanent)

### Status Badges
| Status | Color | Meaning |
|--------|-------|---------|
| Active | Green | User can login |
| Suspended | Orange | User cannot login |
| Deleted | Red | User removed from system |

---

## Bulk User Import (Future)

Currently not implemented. To add multiple users:
1. Repeat create-user process for each user
2. Or implement CSV bulk import feature

---

## Integration Notes

### API Endpoints Used
- `POST /auth/register` - Create new user (admin only)
- `GET /users` - List all users
- `PUT /users/:id/suspend` - Suspend user
- `PUT /users/:id/activate` - Activate user
- `DELETE /users/:id` - Permanently delete user

### Notification System
- Success: "User Created - [Name] has been added"
- Error: Red notification with error message
- All notifications appear at top of page

---

## Troubleshooting

### Admin Can't Access Create User Page
- Verify admin role is assigned
- Check permissions in user record
- Reload page or clear browser cache

### New User Can't Login
- Verify email is correct (case-sensitive)
- Check password is correct
- Ensure account status is "Active"
- Check email for verification link (if required)

### Email Notifications Not Sending
- Check email service configuration
- Verify SMTP settings in environment
- Check spam folder
- Review application logs

---

## Best Practices

1. **Use Strong Passwords**: Require users to change temp password
2. **Verify Information**: Double-check email before creating
3. **Assign Correct Role**: Don't over-provision permissions
4. **Monitor Activity**: Review user logs regularly
5. **Document Changes**: Keep records of user modifications
6. **Onboard Properly**: Provide user credentials securely
7. **Regular Cleanup**: Suspend/delete inactive accounts

---

## Public vs Admin Access

### What Users See
- Login page only
- Message: "User registration is admin-only"
- Option to contact support
- Link back to login

### What Admins See
- Full access to create-user page
- User management dashboard
- All admin panel features
- Audit logs and reports

---

## Environment Configuration

```env
# .env.local

# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@rhv.com
SMTP_PASSWORD=xxxxx

# Security
JWT_SECRET=your-secret-key
TOKEN_EXPIRY=24h
```

---

## Related Documentation

- **[README.md](./README.md)** - Project overview
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Developer cheat sheet
- **[NOTIFICATION_GUIDE.md](./NOTIFICATION_GUIDE.md)** - Notification system
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Implementation details

---

## Support

For issues or questions:
- Email: support@rhv.com
- Slack: #dms-support
- Docs: /dashboard/docs
- Admin: contact your system administrator

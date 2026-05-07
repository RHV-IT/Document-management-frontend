# Documentation Index - Enterprise DMS v2.0

## Quick Navigation

### Getting Started
1. **[README.md](./README.md)** - Complete project overview and setup
2. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Developer cheat sheet
3. **.env.local.example** - Environment variables template

---

## Version 2.0 Updates

### What's New
- **[CHANGELOG_V2.md](./CHANGELOG_V2.md)** - Detailed changelog with breaking changes
- **[UPDATES_SUMMARY.md](./UPDATES_SUMMARY.md)** - Executive summary of changes
- **[NOTIFICATION_GUIDE.md](./NOTIFICATION_GUIDE.md)** - Complete notification system guide
- **[VISUAL_REFERENCE.md](./VISUAL_REFERENCE.md)** - Color system and UI reference

---

## Core Documentation

### Project Structure
```
/app
  ├── layout.tsx              - Root layout with NotificationCenter
  ├── globals.css             - Theme colors & animations (RHV branded)
  ├── /login                  - Modern login page
  ├── /register               - Modern register page
  └── /dashboard              - Protected dashboard routes

/services/api
  ├── axios.ts               - API client with JWT interceptor
  ├── auth.ts                - Authentication endpoints
  ├── files.ts               - File CRUD operations
  ├── users.ts               - User management
  ├── permissions.ts         - File sharing & permissions
  ├── notifications.ts       - Notification endpoints
  └── logs.ts                - Audit logging

/hooks
  ├── useAuth.ts             - Auth mutations & queries
  ├── useFiles.ts            - File operations
  ├── useUsers.ts            - User management
  ├── usePermissions.ts      - Sharing & permissions
  ├── useNotifications.ts    - Notification fetching
  └── useLogs.ts             - Audit log queries

/components
  ├── /notifications
  │   └── NotificationCenter.tsx  - Global notification system
  ├── /dashboard
  │   ├── sidebar.tsx             - Navigation sidebar
  │   └── header.tsx              - Dashboard header
  ├── /loaders
  │   ├── SkeletonLoader.tsx      - Table skeleton animations
  │   ├── FileFillingLoader.tsx   - File fill animations
  │   └── TableSkeleton.tsx       - Table placeholder
  └── /ui                         - ShadCN UI components (150+)

/lib
  ├── utils.ts                - Utility functions
  └── notifications.ts        - Notification API
```

---

## Key Features Documentation

### 1. Authentication System
**Files:**
- `services/api/auth.ts` - Login, register, profile endpoints
- `hooks/useAuth.ts` - Auth mutations with notifications
- `contexts/auth.tsx` - Global auth state management
- `app/login/page.tsx` - Modern login UI
- `app/register/page.tsx` - Modern registration UI

**Features:**
- JWT-based authentication
- Secure token refresh
- Role-based access control
- Password validation
- Account creation

---

### 2. File Management System
**Files:**
- `services/api/files.ts` - All file operations
- `hooks/useFiles.ts` - File mutations (7 mutations)
- `app/dashboard/files/page.tsx` - File listing page
- `app/dashboard/upload/page.tsx` - Upload interface

**Features:**
- Single & bulk file upload
- Scanned document support (PDF, JPG, PNG)
- Metadata management (tags, alias, confidentiality)
- Download & preview
- Version control with rollback
- Soft delete with recycle bin

---

### 3. Recycle Bin System
**Files:**
- `app/dashboard/recycle-bin/page.tsx` - Recycle bin page
- `hooks/useFiles.ts` - useDeletedFilesQuery, useRestoreFileMutation

**Features:**
- 30-day retention policy
- User can see own deleted files for 30 days
- Admin can see all deleted files permanently
- One-click restore
- Permanent deletion capability

---

### 4. Notification System (NEW - v2.0)
**Files:**
- `components/notifications/NotificationCenter.tsx` - Global provider
- `lib/notifications.ts` - Notification utility
- **[NOTIFICATION_GUIDE.md](./NOTIFICATION_GUIDE.md)** - Complete guide

**Types:**
- ✓ Success (Green)
- ✕ Error (Red - RHV branded)
- ⚠ Warning (Amber)
- ⓘ Info (Blue)

**Usage:**
```typescript
import { notify } from '@/lib/notifications'
notify.error('Title', 'Error message')
```

---

### 5. Permissions & Sharing
**Files:**
- `services/api/permissions.ts` - Permission endpoints
- `hooks/usePermissions.ts` - Permission mutations
- Components for share dialogs

**Features:**
- Granular access control (view, download, edit)
- Share with specific users
- Revoke access anytime
- HOD override capability

---

### 6. Admin Panel
**Files:**
- `app/dashboard/admin/users/page.tsx` - User management
- `hooks/useUsers.ts` - User operations

**Features:**
- User listing
- Role assignment
- Activate/suspend users
- View all deleted files (admin only)
- Audit logging

---

## Configuration

### Environment Variables
See `.env.local.example`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### Theme Colors
Edit `app/globals.css`:
```css
--primary: oklch(0.48 0.32 236);      /* RHV Blue */
--accent: oklch(0.58 0.36 25);        /* RHV Red */
```

### API Endpoints
Configure in `services/api/axios.ts`:
- Base URL from environment
- JWT interceptor for auth
- Error handling globally

---

## Development Guide

### Adding a New Feature

1. **Create API Service**
   ```typescript
   // services/api/feature.ts
   export const featureAPI = {
     getFeature: async (id: string) => {
       const response = await apiClient.get(`/api/v1/feature/${id}`)
       return response.data
     }
   }
   ```

2. **Create React Query Hook**
   ```typescript
   // hooks/useFeature.ts
   export function useFeatureQuery(id: string) {
     return useQuery({
       queryKey: ['feature', id],
       queryFn: () => featureAPI.getFeature(id),
     })
   }
   
   export function useUpdateFeatureMutation() {
     return useMutation({
       mutationFn: (data) => featureAPI.update(data),
       onSuccess: () => {
         addNotification('success', 'Updated', 'Feature updated!')
       },
       onError: (error: any) => {
         addNotification('error', 'Error', error.message)
       }
     })
   }
   ```

3. **Create UI Component**
   ```typescript
   // components/feature/FeatureCard.tsx
   import { useFeatureQuery } from '@/hooks/useFeature'
   
   export function FeatureCard({ id }: { id: string }) {
     const { data, isLoading } = useFeatureQuery(id)
     
     if (isLoading) return <SkeletonLoader />
     return <div>{data?.name}</div>
   }
   ```

4. **Use in Page**
   ```typescript
   // app/dashboard/feature/page.tsx
   export default function FeaturePage() {
     return <FeatureCard id="123" />
   }
   ```

---

## API Integration

### All 44 Integrated Endpoints

| Category | Count | Status |
|----------|-------|--------|
| Auth | 7 | ✓ Complete |
| Files | 17 | ✓ Complete |
| Users | 7 | ✓ Complete |
| Permissions | 5 | ✓ Complete |
| Notifications | 4 | ✓ Complete |
| Logs | 4 | ✓ Complete |

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for details.

---

## State Management

### React Query
- **useQuery**: Fetch data, automatic caching
- **useMutation**: POST/PUT/DELETE operations
- **queryClient**: Cache invalidation

### Auth Context
- Global user state
- Token management
- Role-based checks

### Notifications
- Global notification dispatch
- Auto-dismiss & manual dismiss
- Multiple notification stacking

---

## Testing

### Login Credentials

**Admin User:**
- Email: `admin@rhv.com`
- Password: `password123`
- Role: Admin (all features)

**Regular User:**
- Email: `user@rhv.com`
- Password: `password123`
- Role: User (limited features)

---

## Performance Optimization

### Code Splitting
- Pages: Automatic with Next.js App Router
- Components: Lazy load with React.lazy()

### Image Optimization
- Next.js Image component
- Automatic WebP conversion
- Responsive sizing

### Bundle Size
- Tree-shaking enabled
- Unused code removal
- CSS purging for Tailwind

---

## Security

### Authentication
- ✓ JWT tokens in localStorage
- ✓ Refresh token rotation
- ✓ Protected API routes
- ✓ Role-based access control

### Data Protection
- ✓ HTTPS required (production)
- ✓ Input validation (Zod)
- ✓ XSS prevention
- ✓ CSRF protection

---

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Docker
See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for Dockerfile

### Manual Deployment
```bash
npm run build
npm start
```

---

## Troubleshooting

### Common Issues

**Notifications not showing?**
- Check NotificationCenter in layout.tsx
- Verify addNotification import

**API calls failing?**
- Check NEXT_PUBLIC_API_BASE_URL
- Verify JWT in localStorage
- Check browser DevTools

**Login loop?**
- Clear localStorage
- Check token expiration
- Verify auth context

**Styles not loading?**
- Clear Tailwind cache
- Rebuild with `npm run build`
- Check globals.css imports

---

## Support Documentation

### For Developers
1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick lookup
2. [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Deep dive
3. [NOTIFICATION_GUIDE.md](./NOTIFICATION_GUIDE.md) - Notifications

### For Designers
1. [VISUAL_REFERENCE.md](./VISUAL_REFERENCE.md) - Colors & layouts
2. [CHANGELOG_V2.md](./CHANGELOG_V2.md) - Design changes

### For PMs/Stakeholders
1. [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Overview
2. [UPDATES_SUMMARY.md](./UPDATES_SUMMARY.md) - Changes

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 2.0.0 | 2024 | Stable | RHV branding, notifications |
| 1.0.0 | 2024 | Archived | Initial release |

---

## Next Steps

1. **Read README.md** for project overview
2. **Check .env.local.example** for setup
3. **Run `npm install && npm run dev`**
4. **Review QUICK_REFERENCE.md** while coding
5. **Use NOTIFICATION_GUIDE.md** for notifications

---

## Contact & Support

- For setup issues: Check IMPLEMENTATION_GUIDE.md
- For API questions: See PROJECT_SUMMARY.md
- For UI/UX: Reference VISUAL_REFERENCE.md
- For notifications: Read NOTIFICATION_GUIDE.md

---

**Happy developing! 🚀**

*Last Updated: 2024*  
*DMS v2.0 - RHV Enterprise Edition*

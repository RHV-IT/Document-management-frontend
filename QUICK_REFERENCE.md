# Enterprise DMS - Quick Reference Guide

## Essential Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm start            # Run production build
pnpm lint             # Check TypeScript & linting

# Deployment
vercel deploy         # Deploy to Vercel
```

## File Locations Quick Map

| Feature | Location |
|---------|----------|
| Auth Pages | `/app/login`, `/app/register` |
| File Management | `/app/dashboard/files`, `/app/dashboard/upload` |
| Recycle Bin | `/app/dashboard/recycle-bin` |
| Admin Panel | `/app/dashboard/admin/users` |
| Settings | `/app/dashboard/settings` |
| API Services | `/services/api/*` |
| Hooks | `/hooks/use*.ts` |
| Components | `/components/*` |
| Styling | `/app/globals.css` |
| Auth Context | `/contexts/auth.tsx` |

## Import Shortcuts

```typescript
// Auth
import { useAuth } from '@/contexts/auth'
import { useLoginMutation, useProfileQuery } from '@/hooks/useAuth'

// Files
import { useFilesQuery, useUploadFileMutation } from '@/hooks/useFiles'

// Users
import { useUsersQuery, useCreateUserMutation } from '@/hooks/useUsers'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Loaders
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { FileFillingLoader } from '@/components/loaders/FileFillingLoader'
```

## Common Code Patterns

### Data Fetching
```typescript
const { data, isLoading, error } = useFilesQuery({
  page: 1,
  limit: 20,
  search: 'query'
})

if (isLoading) return <SkeletonLoader />
if (error) return <ErrorState />
return <div>{data?.files.map(f => ...)}</div>
```

### File Upload
```typescript
const { mutate: upload, isPending } = useUploadFileMutation()

upload({
  file,
  alias: 'Document Name',
  tags: 'tag1,tag2',
  confidentialityLevel: 'internal'
})
```

### Role Check
```typescript
const { canAccess } = useAuth()

if (!canAccess(['admin', 'hod'])) {
  return <UnauthorizedMessage />
}
```

### Form with Validation
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
})

const form = useForm({ resolver: zodResolver(schema) })
```

### API Call in Hook
```typescript
export function useMyHook(param: string) {
  return useQuery({
    queryKey: ['key', param],
    queryFn: () => myAPI.call(param),
    select: (response) => response.data
  })
}
```

## API Endpoints Quick List

### Authentication
```
POST   /api/v1/auth/login                  Login
POST   /api/v1/auth/register               Register
GET    /api/v1/auth/profile                Get profile
PUT    /api/v1/auth/profile                Update profile
POST   /api/v1/auth/refresh                Refresh token
```

### Files
```
GET    /api/v1/files                       List files
POST   /api/v1/files                       Upload file
DELETE /api/v1/files/:fileId               Soft delete
POST   /api/v1/files/:fileId/restore       Restore file
GET    /api/v1/files/deleted               Recycle bin
GET    /api/v1/files/:fileId/versions      Version history
POST   /api/v1/files/:fileId/rollback      Rollback version
```

### Users (Admin)
```
GET    /api/v1/users                       List users
POST   /api/v1/users                       Create user
PUT    /api/v1/users/:id                   Update user
POST   /api/v1/users/:id/suspend           Suspend user
POST   /api/v1/users/:id/restore           Restore user
```

### Permissions
```
GET    /api/v1/permissions/file/:fileId    Get file permissions
POST   /api/v1/permissions/file/:fileId    Grant permission
POST   /api/v1/permissions/:id/revoke      Revoke permission
GET    /api/v1/permissions/my              My shared files
```

### Notifications
```
GET    /api/v1/notifications               Get notifications
POST   /api/v1/notifications/:id/read      Mark as read
POST   /api/v1/notifications/read-all      Mark all read
```

### Audit Logs
```
GET    /api/v1/logs                        Get logs (admin)
GET    /api/v1/logs/my                     My activity logs
GET    /api/v1/logs/export                 Export logs
```

## UI Components Usage

### Basic Button
```tsx
<Button>Click me</Button>
<Button variant="outline">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button disabled>Disabled</Button>
<Button size="sm">Small</Button>
```

### Form Field
```tsx
<Field>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" type="email" />
</Field>
```

### Card Layout
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Dropdown Menu
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Dialog
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Error Messages

### Common HTTP Errors

```
401 - Unauthorized
  → Token expired or invalid
  → Automatic refresh attempted
  → Redirect to login if failed

403 - Forbidden
  → User doesn't have permission
  → Check role and permissions

404 - Not Found
  → Resource doesn't exist
  → File or user deleted

500 - Server Error
  → Backend issue
  → Check server logs
```

## Color Classes

```typescript
// Background
bg-background      // Primary background
bg-card            // Card background
bg-muted           // Muted background

// Text
text-foreground    // Primary text
text-muted-foreground  // Secondary text

// Borders
border-border      // Standard border
border-destructive // Destructive color

// Utilities
bg-primary         // Primary color button
bg-secondary       // Secondary color
bg-destructive     // Delete/danger color
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Optional
NODE_ENV=development
```

## Debug Tips

```typescript
// Check current user
const { user } = useAuth()
console.log(user)

// Check query cache
const queryClient = useQueryClient()
console.log(queryClient.getQueryData(['files']))

// Check tokens
console.log(localStorage.getItem('accessToken'))
console.log(localStorage.getItem('refreshToken'))

// Test API call
fetch('http://localhost:3000/api/v1/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Clear tokens: `localStorage.clear()` |
| API not responding | Check NEXT_PUBLIC_API_BASE_URL |
| Files not loading | Check network tab, verify JWT token |
| Slow loading | Check Network tab, API response time |
| Component not updating | Check React Query cache invalidation |
| Form not submitting | Check form validation errors |
| Page styling broken | Clear Next.js cache: `rm -rf .next` |

## Performance Tips

```typescript
// Good: Use React Query hooks
const { data } = useFilesQuery()

// Bad: Direct API calls
const data = await filesAPI.getFiles()

// Good: Let React Query handle caching
useFilesQuery() // Cached for 5 minutes

// Bad: Manual fetch on every render
useEffect(() => { fetch(...) }, [])
```

## File Structure Best Practices

```
App feature:
  app/dashboard/feature/
    page.tsx          ← Main page component
    layout.tsx        ← Layout (if needed)
    components/       ← Feature-specific components
    hooks/            ← Feature-specific hooks

Component:
  components/Feature/
    Feature.tsx       ← Main component
    Feature.types.ts  ← TypeScript interfaces (if large)
    index.ts          ← Re-export
```

## Important Notes

1. **Always use hooks** for data fetching - never direct API calls in components
2. **Always handle loading states** - show skeleton loaders
3. **Always handle errors** - catch and display user-friendly messages
4. **Always validate input** - use Zod schemas
5. **Always use TypeScript** - no `any` types
6. **Always cache thoughtfully** - invalidate on mutations
7. **Always test auth** - verify role-based access works
8. **Always check recycle bin** - test 30-day retention logic

## Need Help?

1. Check README.md for detailed documentation
2. Review IMPLEMENTATION_GUIDE.md for patterns
3. Check PROJECT_SUMMARY.md for feature overview
4. Look at similar existing pages for patterns
5. Check browser console for errors
6. Check network tab for API issues
7. Review React Query DevTools (if installed)

---

**This quick reference covers 80% of daily development tasks.**

For detailed information, refer to the complete documentation files.

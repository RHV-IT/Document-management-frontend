# Enterprise DMS - Implementation Guide

## Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit with your API base URL
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 2. Install & Run

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

### 3. Test the Application

**Demo Credentials:**
- Admin: `admin@example.com` / `password123`
- User: `user@example.com` / `password123`
- HOD: `hod@example.com` / `password123`

---

## Architecture Overview

### Data Flow

```
User Action
    ↓
Component
    ↓
React Query Hook (useMutation/useQuery)
    ↓
API Service (filesAPI, usersAPI, etc.)
    ↓
Axios Instance (with JWT interceptor)
    ↓
Backend API
    ↓
Response handling, caching, invalidation
    ↓
Toast notification + state update
```

### Key Principles

1. **No Direct API Calls in Components**
   - Always use hooks (useFilesQuery, useUploadFileMutation, etc.)
   - Components stay clean and testable

2. **Centralized State Management**
   - React Query for server state
   - Auth Context for user session
   - No Redux or complex local state

3. **API Layer Abstraction**
   - All API calls in `/services/api`
   - Easy to switch backends
   - Consistent error handling

4. **Automatic Cache Management**
   - Query invalidation after mutations
   - 5-minute stale time by default
   - Refetch on window focus

---

## Adding New Features

### Add a New API Endpoint

**1. Create Service Function**
```typescript
// services/api/files.ts
export const filesAPI = {
  newEndpoint: async (params?: any) => {
    const response = await apiClient.get('/api/v1/path', { params })
    return response.data
  }
}
```

**2. Create React Query Hook**
```typescript
// hooks/useFiles.ts
export function useNewEndpointQuery(params?: any) {
  return useQuery({
    queryKey: ['newEndpoint', params],
    queryFn: () => filesAPI.newEndpoint(params),
    select: (response) => response.data,
  })
}
```

**3. Use in Component**
```typescript
// components/MyComponent.tsx
const { data, isLoading, error } = useNewEndpointQuery(params)

if (isLoading) return <SkeletonLoader />
if (error) return <ErrorState error={error} />

return <div>{/* render data */}</div>
```

### Add a New Page

**1. Create Page File**
```typescript
// app/dashboard/new-feature/page.tsx
'use client'

import { useNewFeatureQuery } from '@/hooks/useFiles'

export default function NewFeaturePage() {
  const { data, isLoading } = useNewFeatureQuery()
  
  return (
    <div className="flex-1 flex flex-col">
      {/* Your content */}
    </div>
  )
}
```

**2. Update Sidebar Navigation**
```typescript
// components/dashboard/sidebar.tsx
const NAV_ITEMS = [
  // ... existing items
  {
    label: 'New Feature',
    href: '/dashboard/new-feature',
    icon: SomeIcon,
    roles: ['admin', 'hod', 'user'],
  },
]
```

### Add a New Component

**1. Create Component**
```typescript
// components/MyComponent.tsx
'use client'

interface MyComponentProps {
  title: string
  items: Item[]
}

export function MyComponent({ title, items }: MyComponentProps) {
  return (
    <div>
      {/* component content */}
    </div>
  )
}
```

**2. Use in Page/Component**
```typescript
import { MyComponent } from '@/components/MyComponent'

export default function Page() {
  return <MyComponent title="Title" items={items} />
}
```

---

## Common Patterns

### Loading State with Skeleton

```typescript
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'

if (isLoading) {
  return <SkeletonLoader type="card" count={3} />
}
```

### File Upload with Progress

```typescript
import { FileFillingLoader } from '@/components/loaders/FileFillingLoader'
import { useUploadFileMutation } from '@/hooks/useFiles'

const { mutate: upload, isPending } = useUploadFileMutation()
const [progress, setProgress] = useState(0)

upload({ file, alias, tags, confidentialityLevel })

return <FileFillingLoader progress={progress} fileName={file.name} />
```

### Role-Based Rendering

```typescript
import { useAuth } from '@/contexts/auth'

export function AdminFeature() {
  const { canAccess } = useAuth()
  
  if (!canAccess(['admin'])) {
    return null // or show unauthorized message
  }
  
  return <div>{/* admin-only content */}</div>
}
```

### Form with Validation

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
})

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  )
}
```

### Mutation with Optimistic Update

```typescript
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: (data) => API.update(data),
  onMutate: async (data) => {
    // Cancel pending queries
    await queryClient.cancelQueries({ queryKey: ['files'] })
    
    // Optimistic update
    const previous = queryClient.getQueryData(['files'])
    queryClient.setQueryData(['files'], (old) => [...old, data])
    
    return { previous }
  },
  onError: (err, variables, context) => {
    // Rollback
    queryClient.setQueryData(['files'], context?.previous)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['files'] })
  },
})
```

---

## Error Handling

### Global Error Handling

```typescript
// Handled by Axios interceptor in services/api/axios.ts
// - 401: Refresh token & retry
// - 4xx: Show toast error
// - 5xx: Show server error toast
```

### Component Error Boundary

```typescript
try {
  const response = await API.call()
  return response.data
} catch (error) {
  toast.error(error.response?.data?.message || 'An error occurred')
  throw error
}
```

### User-Friendly Messages

```typescript
// In hooks, mutations automatically toast errors:
onError: (error: any) => {
  const message = error.response?.data?.message || 'Operation failed'
  toast.error(message)
}
```

---

## Performance Optimization

### React Query Caching

```typescript
// 5-minute stale time (default)
// Manual invalidation after mutations
// Automatic refetch on window focus
// Built-in retry logic

useFilesQuery({
  // Query will be cached for 5 minutes
  // After mutation, it will be invalidated and refetched
})
```

### Code Splitting

```typescript
// Automatic with Next.js App Router
// Each route = separate chunk
// Components lazy-loaded on demand
```

### Bundle Optimization

```bash
# Analyze bundle
npm run build

# Expected size: ~250KB gzipped
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

```bash
docker build -t dms:latest .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=... dms:latest
```

### Environment Variables for Production

```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
NODE_ENV=production
```

---

## Monitoring & Debugging

### Browser DevTools

```
1. Network tab - Check API requests
2. Application tab - View stored tokens
3. Console - Check errors & logs
4. React DevTools - Inspect components & hooks
```

### API Debugging

```typescript
// Add logging in axios interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API Response]', response.config.url, response.data)
    return response
  }
)
```

### Performance Monitoring

```typescript
// Check React Query DevTools
// npm install @tanstack/react-query-devtools

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

---

## Troubleshooting

### Issue: Files not loading

```bash
# Check:
1. API base URL in .env.local
2. Backend is running: curl http://localhost:3000/health
3. Browser console for errors
4. Network tab for failed requests
5. Check JWT token in localStorage
```

### Issue: Authentication loop

```bash
# Clear tokens and try again:
localStorage.removeItem('accessToken')
localStorage.removeItem('refreshToken')
localStorage.removeItem('user')

# Refresh page and login
```

### Issue: Mutations not updating UI

```typescript
// Ensure cache invalidation:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['files'] })
}
```

### Issue: Slow loading

```bash
# Check:
1. Network throttling in DevTools
2. API response time
3. Database query performance
4. Bundle size: pnpm build --analyze
```

---

## Best Practices

### Do's
✓ Use hooks for all data fetching
✓ Keep components focused and small
✓ Use TypeScript for type safety
✓ Handle loading & error states
✓ Validate form inputs with Zod
✓ Cache API responses appropriately
✓ Test on multiple browsers
✓ Use semantic HTML & ARIA labels

### Don'ts
✗ Don't make API calls in components
✗ Don't use `any` types
✗ Don't ignore loading states
✗ Don't store sensitive data in localStorage (only JWT)
✗ Don't hardcode API URLs
✗ Don't skip error handling
✗ Don't overuse state management
✗ Don't ignore accessibility

---

## Next Steps

1. **Setup Backend**: Ensure API server is running on `http://localhost:3000`
2. **Update Environment**: Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. **Install Dependencies**: Run `pnpm install`
4. **Start Development**: Run `pnpm dev`
5. **Test Features**: Login and test core functionality
6. **Customize**: Modify colors, fonts, and branding as needed
7. **Deploy**: Use Vercel, Docker, or your preferred platform

---

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review the API documentation from your backend team
3. Check browser console and network tab for errors
4. Verify environment variables are set correctly
5. Ensure backend API is accessible

Good luck with your Enterprise DMS implementation!

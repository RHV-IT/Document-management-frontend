# Debugging Guide for Production Blank Screen

## Issue
The application shows a blank white screen when accessed from another system on the network, while the backend is accessible and assets load successfully (200/304).

## Root Cause
**Server-Side Rendering (SSR) crash** due to `localStorage` access during render.

The `canAccess()` function in `hooks/useAuth.ts` directly accessed `localStorage` synchronously during component rendering. Since `localStorage` is not available on the server (it's a browser API), this caused a `ReferenceError` during SSR, resulting in a blank page.

### Affected Code
- `hooks/useAuth.ts` lines 57-62 - `canAccess()` function
- Called by multiple components during render:
  - `components/dashboard/sidebar.tsx:73`
  - `app/dashboard/page.tsx:216, 309`
  - Any component using `useAuth().canAccess()`

## Fixes Applied

### 1. SSR Guard Added to `hooks/useAuth.ts`
```typescript
const canAccess = (requiredRoles?: string[]) => {
  if (!requiredRoles || requiredRoles.length === 0) return true
  if (typeof window === 'undefined') return true // ← Added SSR guard
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token) return false
  return true
}
```

### 2. Global Error Boundary (`components/error-boundary.tsx`)
- Catches any remaining rendering errors
- Displays user-friendly error UI instead of blank screen
- Logs errors to console in development mode
- Provides "Refresh Page" and "Go to Login" buttons

### 3. Enhanced Debug Logging (`lib/debug.ts`)
- Centralized debug utility
- Enabled via `NEXT_PUBLIC_LOG_LEVEL=debug` in `.env.local`
- Logs:
  - App initialization
  - Auth state changes
  - API requests/responses
  - Component renders
  - Errors

### 4. API URL Fix
- Verified all API calls use `NEXT_PUBLIC_API_BASE_URL`
- Fixed hardcoded localhost fallback in scanner upload

## How to Debug Production Issues

### Enable Debug Logs
Add to `.env.local`:
```bash
NEXT_PUBLIC_LOG_LEVEL=debug
```

Then check browser console for `[DMS Debug]` prefixed messages.

### Key Things to Check

1. **Network tab** - Verify API requests go to correct IP (192.168.4.213:5000) not localhost
2. **Console** - Look for red errors or the debug logs
3. **Application → Storage** - Check if `token` exists in localStorage/sessionStorage
4. **Application → Cookies** - Verify no stale cookies causing issues

### Common Issues

#### Blank Screen After Build
- Check that `.env.local` is present on the server
- Verify `NEXT_PUBLIC_API_BASE_URL` points to accessible backend IP
- Ensure Next.js build includes env variables (they must be prefixed with `NEXT_PUBLIC_`)

#### Auth Issues on New System
- Fresh browser has empty localStorage → app should still render
- The app now handles missing tokens gracefully and redirects to login

#### CORS Errors
- Backend must allow requests from frontend IP
- Check backend CORS configuration includes `http://192.168.4.213:3000`

## Quick Test Checklist

- [ ] Visit `http://192.168.4.213:3000` from another system
- [ ] Open browser DevTools (F12)
- [ ] Check Console for `[DMS Debug]` logs
- [ ] Verify no `ReferenceError: localStorage is not defined` errors
- [ ] Confirm API requests go to `http://192.168.4.213:5000`
- [ ] Login page should display (skeleton loader briefly, then login form)
- [ ] After login, dashboard should load

## Environment Variables Reference

```bash
# Required
NEXT_PUBLIC_API_BASE_URL=http://192.168.4.213:5000

# Optional (debugging)
NEXT_PUBLIC_LOG_LEVEL=debug
```

## Files Modified

1. `hooks/useAuth.ts` - Added SSR guard to `canAccess`
2. `app/layout.tsx` - Added ErrorBoundary, debug imports
3. `app/page.tsx` - Added debug logging
4. `app/dashboard/layout.tsx` - Added debug logging
5. `components/dashboard/sidebar.tsx` - Added debug logging
6. `services/api/axios.ts` - Added API request/response logging
7. `services/api/files.ts` - Fixed hardcoded fallback URL (localhost:3000 → 5000)
8. `components/error-boundary.tsx` - NEW global error boundary
9. `lib/debug.ts` - NEW debug logging utility

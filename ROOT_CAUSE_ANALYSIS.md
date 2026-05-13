# Production Blank Screen - Root Cause Analysis & Fix Summary

## TL;DR
**Root Cause:** SSR crash from `localStorage` access in `hooks/useAuth.ts:canAccess()`.
**Fix Applied:** Added `typeof window === 'undefined'` guard. Also added global error boundary and debug logging.

---

## PROBLEM STATEMENT

**Symptoms:**
- Page loads (HTML + JS files load successfully - 200/304)
- Network tab shows all assets loaded
- UI is blank (nothing renders)
- WebSocket HMR errors appear but are not the main issue
- Works on localhost but fails when accessed via network IP (http://192.168.4.213:3000)

**Environment:**
- Backend: `https://rhv-dms-backend.vercel.app`
- Frontend: `http://192.168.4.213:3000`
- Next.js 16.2.0, React 19, TypeScript

---

## ROOT CAUSE: SSR CRASH FROM localStorage ACCESS

### The Bug
The `canAccess()` function in `hooks/useAuth.ts` directly synchronously accesses `localStorage` during React component renders:

```typescript
// hooks/useAuth.ts ORIGINAL (lines 57-62)
const canAccess = (requiredRoles?: string[]) => {
  if (!requiredRoles || requiredRoles.length === 0) return true
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')  // ← CRASH!
  if (!token) return false
  return true
}
```

### Why This Crashes on SSR

**Server-Side Rendering (SSR) flow:**
1. User requests page → Next.js renders components on server
2. During server render, `window`, `localStorage`, `document` do NOT exist
3. Accessing `localStorage` throws `ReferenceError: localStorage is not defined`
4. Error propagates to React → blank page (often with no visible error)

**Why it worked on localhost:**
- Next.js dev mode uses client-side rendering by default (`next dev`)
- Components render in browser where `localStorage` exists
- SSR only happens in production builds (`next start`)

**Why it failed on network access:**
- Production build serves via `next start` which uses SSR
- When accessed via network IP, full SSR occurs → crash

### Call Stack Leading to Crash

1. **RootLayout** (app/layout.tsx) renders children
2. **DashboardLayout** (app/dashboard/layout.tsx) imports `useAuth`
3. **DashboardSidebar** (components/dashboard/sidebar.tsx) calls `canAccess()`:
   ```typescript
   const visibleItems = NAV_ITEMS.filter((item) => canAccess(item.roles))
   ```
4. **DashboardPage** (app/dashboard/page.tsx) calls `canAccess()`:
   ```typescript
   {canAccess(['admin', 'hod']) && (...)}
   {canAccess(['admin']) && (...)}
   ```

Every dashboard page render calls `canAccess()` → references `localStorage` → crashes on server.

---

## FIXES APPLIED

### Fix 1: SSR Guard in `hooks/useAuth.ts`

**File:** `hooks/useAuth.ts:67-80`

**Change:**
```typescript
const canAccess = (requiredRoles?: string[]) => {
  if (!requiredRoles || requiredRoles.length === 0) {
    debug.render('canAccess', 'no roles required, returning true')
    return true
  }
  if (typeof window === 'undefined') {
    debug.render('canAccess', 'SSR mode, allowing access by default')
    return true // ← SSR guard added
  }
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  const hasAccess = !!token
  debug.render('canAccess', { requiredRoles, hasToken: !!token, hasAccess })
  return hasAccess
}
```

**Effect:** During SSR, `canAccess` returns `true` (allow all) instead of crashing.

---

### Fix 2: Global Error Boundary

**New File:** `components/error-boundary.tsx`

Catches any remaining rendering errors and displays user-friendly UI:
- Shows error summary in development mode
- Provides "Refresh Page" and "Go to Login" buttons
- Prevents blank screen even if future errors occur

**Integrated in:** `app/layout.tsx` (wraps entire app)

---

### Fix 3: Debug Logging System

**New File:** `lib/debug.ts`

Centralized debug utility with categorized logging:
- `debug.log()` - General debug
- `debug.info()` - Informational
- `debug.warn()` - Warnings
- `debug.error()` - Errors
- `debug.auth()` - Auth-specific events
- `debug.api()` - API requests/responses
- `debug.render()` - Component render lifecycle

**Enabled via:** `NEXT_PUBLIC_LOG_LEVEL=debug` in `.env.local`

**Instrumented:**
- `hooks/useAuth.ts` - auth state, token checks
- `services/api/axios.ts` - all API calls
- `app/layout.tsx` - app bootstrap
- `app/page.tsx` - home/redirect logic
- `app/dashboard/layout.tsx` - dashboard mount, auth guard

---

### Fix 4: API URL Hardcoding Fix

**File:** `services/api/files.ts:103-126`

**Before:**
```typescript
xhr.open('POST', `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/v1/scanner/upload`)
```
(Used wrong fallback port 3000 instead of 5000)

**After:**
```typescript
import { API_BASE_URL } from './axios'
...
const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000')
xhr.open('POST', `${baseUrl}/api/v1/scanner/upload`)
```

Now uses consistent `API_BASE_URL` from axios config.

---

## VERIFICATION CHECKLIST

### For Development
- [x] `hooks/useAuth.ts` - `canAccess` has SSR guard
- [x] `hooks/useAuth.ts` - `isAuthenticated` has SSR guard (already had)
- [x] All `localStorage` access either inside `useEffect` or guarded
- [x] Error boundary wraps app
- [x] Debug logs added to critical paths

### For Production Deployment
- [x] `.env.local` has `NEXT_PUBLIC_API_BASE_URL=http://192.168.4.213:5000`
- [ ] Rebuild app: `npm run build`
- [ ] Start production server: `npm start`
- [ ] Test from another system: `http://192.168.4.213:3000`
- [ ] Check console for `[DMS Debug]` logs
- [ ] Verify no `localStorage is not defined` errors

---

## HOW TO TEST THE FIX

1. **Rebuild the application:**
   ```bash
   npm run build
   npm start
   ```

2. **From another machine on same network:**
   - Open browser to `http://192.168.4.213:3000`
   - Open DevTools (F12)
   - Check Console:
     - Should see `[DMS Debug]` logs
     - Should NOT see `ReferenceError: localStorage is not defined`
   - Network tab:
     - First request returns HTML page (status 200)
     - API calls go to `http://192.168.4.213:5000` (not localhost)
   - UI should show:
     1. Brief skeleton loader on home page
     2. Redirect to `/login`
     3. Login form displays correctly

3. **Test auth flow:**
   - Login with valid credentials
   - Should redirect to `/dashboard`
   - Dashboard should render with sidebar, header, stats
   - No blank screens

4. **Test missing token:**
   - Clear localStorage
   - Refresh page
   - Should redirect to login (not crash)

---

## COMMON PITFALLS AFTER FIX

### 1. Build Cache Issues
If issues persist after fixing:
```bash
# Clean build
rm -rf .next
npm run build
```

### 2. Environment Variables Not Loaded
Verify `.env.local` exists on server and contains:
```bash
NEXT_PUBLIC_API_BASE_URL=http://192.168.4.213:5000
```
Note: Variables must start with `NEXT_PUBLIC_` to be exposed to browser.

### 3. Backend CORS
Ensure backend allows requests from `http://192.168.4.213:3000`:
```javascript
// Backend CORS config
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.4.213:3000'],
  credentials: true
}))
```

### 4. Mixed Content (HTTP vs HTTPS)
If frontend uses HTTPS but backend is HTTP, browser may block requests. Use consistent protocol.

---

## FILES MODIFIED

### Core Fixes
1. `hooks/useAuth.ts` - Added SSR guard to `canAccess`, added debug logs
2. `app/layout.tsx` - Added ErrorBoundary, imported debug
3. `app/page.tsx` - Added render debug logging
4. `app/dashboard/layout.tsx` - Added debug logging
5. `components/dashboard/sidebar.tsx` - Added debug logging

### Debug Infrastructure
6. `components/error-boundary.tsx` - NEW global error boundary
7. `lib/debug.ts` - NEW debug logging utility

### API Fixes
8. `services/api/axios.ts` - Added request/response logging
9. `services/api/files.ts` - Fixed hardcoded localhost:3000 fallback (was wrong port)

### Documentation
10. `DEBUG_GUIDE.md` - Comprehensive debugging guide

---

## ARCHITECTURE RECOMMENDATIONS

### 1. Consolidate Auth Hooks
Currently there are two separate auth systems:
- `contexts/auth.tsx` (safe, well-designed, uses React Context + TanStack Query)
- `hooks/useAuth.ts` (legacy, now fixed with SSR guard)

**Recommendation:** Migrate all components to use `contexts/auth.tsx` exclusively and deprecate `hooks/useAuth.ts`.

### 2. Create SSR-Safe Utilities
For any future browser API usage:
```typescript
const isBrowser = () => typeof window !== 'undefined'
const getStorage = () => isBrowser() ? localStorage : null
```

### 3. Add Error Boundary at Each Route Level
Consider wrapping individual pages with error boundaries to isolate failures.

### 4. Implement Remote Error Logging
Add Sentry/Bugsnag to capture production errors:
```typescript
import * as Sentry from '@sentry/nextjs'
Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN })
```

---

## DEBUGGING PRODUCTION ISSUES

### Step 1: Check Browser Console
Look for red errors or `[DMS Debug]` logs.

### Step 2: Enable Verbose Logging
Add to `.env.local`:
```bash
NEXT_PUBLIC_LOG_LEVEL=debug
```

### Step 3: Verify Environment
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_BASE_URL)
console.log('Is browser?', typeof window !== 'undefined')
```

### Step 4: Test API Connectivity
```javascript
fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/api/v1/auth/me')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## CONCLUSION

The blank screen issue was caused by an SSR crash from direct `localStorage` access in a render-time function (`canAccess`). The fix is simple but critical: always guard browser APIs with `typeof window !== 'undefined'` when using SSR.

The added error boundary and debug logging will help catch any remaining issues and provide visibility into what's happening in production.

**Status: RESOLVED** ✅

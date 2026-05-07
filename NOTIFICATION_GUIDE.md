# Notification System Guide

## Overview

The DMS uses a global notification system that displays messages at the top of the screen. All notifications appear above the main content with proper color coding for different types.

---

## Quick Start

### Using the Notification Utility (Recommended)

```typescript
import { notify } from '@/lib/notifications'

// Success notification
notify.success('Profile Updated', 'Your profile has been saved successfully.')

// Error notification - appears with RED color for warnings
notify.error('Upload Failed', 'File size exceeds maximum allowed.')

// Warning notification - appears with AMBER color
notify.warning('Quota Warning', 'You are using 90% of your storage.')

// Info notification - appears with BLUE color
notify.info('System Update', 'Maintenance scheduled for tomorrow.')
```

### Using addNotification Directly

```typescript
import { addNotification } from '@/components/notifications/NotificationCenter'

addNotification('success', 'Title', 'Message', 5000) // 5 second duration
addNotification('error', 'Error Title', 'Error message')
```

---

## Color System for Notifications

| Type | Color | RGB | Use Case |
|------|-------|-----|----------|
| **success** | Green | #10B981 | File uploaded, action completed |
| **error** | Red | #EF4444 | Failed operations, validation errors |
| **warning** | Amber | #F59E0B | Quota warnings, deprecated actions |
| **info** | Blue | #3B82F6 | System messages, informational |

---

## Implementation Examples

### Auth Mutations

```typescript
// In hooks/useAuth.ts
export function useLoginMutation() {
  return useMutation({
    mutationFn: (data) => authAPI.login(data),
    onSuccess: () => {
      addNotification('success', 'Welcome!', 'You have successfully logged in.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed'
      addNotification('error', 'Login Failed', message)
    },
  })
}
```

### File Operations

```typescript
// In hooks/useFiles.ts
export function useUploadFileMutation() {
  return useMutation({
    mutationFn: (file) => filesAPI.uploadFile(file),
    onSuccess: () => {
      addNotification('success', 'File Uploaded', 'Your file has been uploaded successfully.')
    },
    onError: (error) => {
      addNotification('error', 'Upload Failed', error.message)
    },
  })
}
```

### Custom Components

```typescript
'use client'
import { addNotification } from '@/components/notifications/NotificationCenter'

export function MyComponent() {
  const handleAction = async () => {
    try {
      await someOperation()
      addNotification('success', 'Success', 'Operation completed!')
    } catch (error) {
      addNotification('error', 'Error', 'Operation failed.')
    }
  }

  return <button onClick={handleAction}>Click me</button>
}
```

---

## Notification Behavior

### Display Properties

- **Position**: Fixed at top of viewport
- **Z-Index**: 50 (above page content, below modals)
- **Width**: Full on mobile, auto on desktop
- **Animation**: Slides down from top with ease-out
- **Stack**: Multiple notifications stack vertically

### Auto-Dismiss

- **Default Duration**: 5000ms (5 seconds)
- **Custom Duration**: Pass as 4th parameter
- **No Auto-Dismiss**: Set `duration: 0`
- **Manual Dismiss**: Click the × button

```typescript
// 10 second notification
addNotification('info', 'Title', 'Message', 10000)

// Never auto-dismiss
addNotification('error', 'Critical', 'Important message', 0)
```

### Error Message Best Practices

When showing errors, always display:
1. Clear title: "Action Failed"
2. Specific message: "Email already exists"

```typescript
// Good ❌
addNotification('error', 'Failed', 'Error')

// Good ✅
addNotification('error', 'Registration Failed', 'Email address already in use')
```

---

## Style Guide

### Error Notifications

For all error scenarios, use the `error` type which displays with RED color (#EF4444):

```typescript
// Login error
addNotification('error', 'Login Failed', 'Invalid email or password')

// Validation error
addNotification('error', 'Validation Error', 'Please fill all required fields')

// Permission error
addNotification('error', 'Access Denied', 'You do not have permission to perform this action')

// Server error
addNotification('error', 'Server Error', 'Something went wrong. Please try again.')
```

### Success Notifications

Confirm successful operations:

```typescript
// File uploaded
addNotification('success', 'File Uploaded', 'Your document has been uploaded successfully.')

// Account created
addNotification('success', 'Account Created', 'Your account is ready to use.')

// Changes saved
addNotification('success', 'Changes Saved', 'Your preferences have been updated.')
```

### Warning Notifications

Alert users about important conditions:

```typescript
// Storage warning
addNotification('warning', 'Storage Warning', 'You are using 85% of your storage quota.')

// Expiring soon
addNotification('warning', 'Soon Expiring', 'This file will be deleted in 7 days.')

// Rate limit
addNotification('warning', 'Rate Limited', 'Too many requests. Please wait a moment.')
```

### Info Notifications

Provide informational messages:

```typescript
// System maintenance
addNotification('info', 'System Update', 'Scheduled maintenance at 2:00 AM.')

// New feature
addNotification('info', 'New Feature', 'Check out our new bulk upload feature!')

// Process started
addNotification('info', 'Processing', 'Your request is being processed...')
```

---

## Notification UI Components

The notification includes:
- **Icon**: Type-specific icon (✓, ✕, ⚠️, ⓘ)
- **Title**: Bold, semantic title
- **Message**: Descriptive explanation
- **Close Button**: × to dismiss manually
- **Border**: Left border matching notification type
- **Animation**: Smooth slide-in effect

---

## Global Setup

The NotificationCenter is already configured in `app/layout.tsx`:

```typescript
import { NotificationCenter } from '@/components/notifications/NotificationCenter'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NotificationCenter />
        {/* Rest of layout */}
      </body>
    </html>
  )
}
```

---

## Migration from Toast

If you see old code using `toast.error()` or `toast.success()`, it should be updated:

```typescript
// Old (don't use)
import { toast } from 'sonner'
toast.error('Error message')

// New (use this)
import { addNotification } from '@/components/notifications/NotificationCenter'
addNotification('error', 'Error Title', 'Error message')
```

---

## API Response Errors

When handling API errors, extract the message properly:

```typescript
onError: (error: any) => {
  // Get message from API response
  const message = error.response?.data?.message || 'Operation failed'
  addNotification('error', 'Action Failed', message)
}
```

---

## Best Practices

1. **Be Specific**: "File uploaded" not just "Success"
2. **Use Proper Types**: Error for failures, success for wins
3. **Keep Messages Short**: Single sentence preferred
4. **No Duplicates**: Don't show same message twice
5. **Clear Actions**: If offering action, make it obvious
6. **Timing**: Critical errors = longer duration
7. **Accessibility**: Icons + colors + text

---

## Troubleshooting

### Notification not showing?
- Make sure `<NotificationCenter />` is in root layout
- Check browser console for errors
- Verify `addNotification` is imported correctly

### Notification disappears too fast?
- Increase duration: `addNotification(..., 10000)`
- Or disable auto-dismiss: `addNotification(..., 0)`

### Multiple notifications overlap?
- This is normal, they stack vertically
- Each can be dismissed individually

### Wrong color showing?
- Check the type parameter: 'error', 'success', 'warning', 'info'
- Verify globals.css has the RHV color scheme loaded

---

## Summary

Use `notify` utility for quick, clean notification code:

```typescript
import { notify } from '@/lib/notifications'

notify.error('Title', 'Message')      // Red - error
notify.success('Title', 'Message')    // Green - success
notify.warning('Title', 'Message')    // Amber - warning
notify.info('Title', 'Message')       // Blue - info
```

Happy notifying! 🎉

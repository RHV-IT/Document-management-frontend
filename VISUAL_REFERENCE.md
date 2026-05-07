# Visual Reference Guide

## RHV Color System

### Primary Brand Colors

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  RHV MEDICAL BLUE                                            │
│  ═════════════════════════════════════════════════════════  │
│  oklch(0.48 0.32 236) | HEX: #1F5FD9 | RGB: (31, 95, 217) │
│                                                              │
│  Use for:                                                    │
│  • Primary buttons                                          │
│  • Main navigation                                          │
│  • Links                                                    │
│  • Headers                                                  │
│  • Sidebar                                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  RHV MEDICAL RED (Cross)                                     │
│  ═════════════════════════════════════════════════════════  │
│  oklch(0.58 0.36 25) | HEX: #E31F23 | RGB: (227, 31, 35)   │
│                                                              │
│  Use for:                                                    │
│  • Delete/critical actions                                 │
│  • Error messages                                          │
│  • Alerts                                                  │
│  • Status indicators                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Notification Display Examples

### Success Notification (Green)

```
┌──────────────────────────────────────────────────────────────────┐
│ ✓ File Uploaded                                                ✕ │
│   Your file has been uploaded successfully.                     │
└──────────────────────────────────────────────────────────────────┘
  
Style:
- Border-left: 4px solid #10B981 (green)
- Background: #F0FDF4 (light green)
- Icon color: #10B981
- Text color: #065F46 (dark green)
```

### Error Notification (Red - RHV Color)

```
┌──────────────────────────────────────────────────────────────────┐
│ ✕ Login Failed                                                 ✕ │
│   Invalid email or password. Please try again.                  │
└──────────────────────────────────────────────────────────────────┘

Style:
- Border-left: 4px solid #EF4444 (bright red)
- Background: #FEF2F2 (light red)
- Icon color: #EF4444
- Text color: #7F1D1D (dark red)
```

### Warning Notification (Amber)

```
┌──────────────────────────────────────────────────────────────────┐
│ ⚠ Storage Warning                                              ✕ │
│   You are using 85% of your storage quota.                      │
└──────────────────────────────────────────────────────────────────┘

Style:
- Border-left: 4px solid #F59E0B (amber)
- Background: #FFFBEB (light amber)
- Icon color: #F59E0B
- Text color: #78350F (dark amber)
```

### Info Notification (Blue)

```
┌──────────────────────────────────────────────────────────────────┐
│ ⓘ System Update                                                ✕ │
│   Scheduled maintenance at 2:00 AM tomorrow.                    │
└──────────────────────────────────────────────────────────────────┘

Style:
- Border-left: 4px solid #3B82F6 (blue)
- Background: #EFF6FF (light blue)
- Icon color: #3B82F6
- Text color: #1E3A8A (dark blue)
```

---

## Login Page Layout

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│     Background Gradient: Blue/White/Blue              │
│     Decorative blur circles in corners                │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  ╔════════════════════════════════════════════╗  │ │
│  │  ║                                            ║  │ │
│  │  ║   ┌──────────────────────────────────┐    ║  │ │
│  │  ║   │ HEADER (RHV Medical Blue)         │    ║  │ │
│  │  ║   │                                  │    ║  │ │
│  │  ║   │  ┌─────────────┐               │    ║  │ │
│  │  ║   │  │ RHV LOGO    │               │    ║  │ │
│  │  ║   │  └─────────────┘               │    ║  │ │
│  │  ║   │                                  │    ║  │ │
│  │  ║   │  Redeemer's DMS                │    ║  │ │
│  │  ║   │  Document Management System    │    ║  │ │
│  │  ║   │                                  │    ║  │ │
│  │  ║   └──────────────────────────────────┘    ║  │ │
│  │  ║                                            ║  │ │
│  │  ║  ┌──────────────────────────────────┐    ║  │ │
│  │  ║  │ FORM SECTION (White Background) │    ║  │ │
│  │  ║  │                                  │    ║  │ │
│  │  ║  │ Email: [________________]        │    ║  │ │
│  │  ║  │ Password: [________________]     │    ║  │ │
│  │  ║  │ ☐ Remember me                   │    ║  │ │
│  │  ║  │                                  │    ║  │ │
│  │  ║  │ [Sign In] ─────────────────────│    ║  │ │
│  │  ║  │                                  │    ║  │ │
│  │  ║  │  Demo Credentials Box          │    ║  │ │
│  │  ║  │  ┌────────────────────────────┐ │    ║  │ │
│  │  ║  │  │ Admin: admin@rhv.com       │ │    ║  │ │
│  │  ║  │  │ Pass: password123          │ │    ║  │ │
│  │  ║  │  └────────────────────────────┘ │    ║  │ │
│  │  ║  │                                  │    ║  │ │
│  │  ║  │ Don't have account? Sign up    │    ║  │ │
│  │  ║  └──────────────────────────────────┘    ║  │ │
│  │  ║                                            ║  │ │
│  │  ╚════════════════════════════════════════════╝  │ │
│  │                                                  │ │
│  │  © 2024 Redeemer's Health Village               │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Register Page Layout

```
┌────────────────────────────────────────────────────────┐
│  (Same as Login with additional fields)                │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  ╔════════════════════════════════════════════╗  │ │
│  │  ║  Join Redeemer's DMS                      ║  │ │
│  │  ║  Create your account to get started       ║  │ │
│  │  ╚════════════════════════════════════════════╝  │ │
│  │                                                  │ │
│  │  Full Name: [____________________________]      │ │
│  │  Email: [________________________________]    │ │
│  │  Department: [Select department ▼]            │ │
│  │  Password: [____________________________]      │ │
│  │  Confirm Password: [____________________]      │ │
│  │                                                  │ │
│  │  [Create Account] ───────────────────────────  │ │
│  │                                                  │ │
│  │  By creating account you agree to:             │ │
│  │  Terms of Service and Privacy Policy           │ │
│  │                                                  │ │
│  │  Already have account? Sign in                │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## Notification Stack

```
┌─ TOP OF VIEWPORT ─────────────────────────────────────────────┐
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ✓ File Uploaded                                        ✕ │
│  │   Document uploaded successfully.                       │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ⚠ Storage Warning                                      ✕ │
│  │   Using 85% of quota.                                  │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ✕ Delete Failed                                        ✕ │
│  │   Could not delete file. Try again.                    │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└─ MAIN PAGE CONTENT BELOW ────────────────────────────────────┘
```

---

## Color Palette Reference

```
SUCCESS (Green)
───────────────────────────────────────────────────────────────
Icon:       #10B981 ████████████████ Green
Text:       #065F46 ████████████████ Dark Green
Background: #F0FDF4 ████████████████ Light Green
Border:     #10B981 ████████████████ Green

ERROR (Red)
───────────────────────────────────────────────────────────────
Icon:       #EF4444 ████████████████ Bright Red
Text:       #7F1D1D ████████████████ Dark Red
Background: #FEF2F2 ████████████████ Light Red
Border:     #EF4444 ████████████████ Bright Red

WARNING (Amber)
───────────────────────────────────────────────────────────────
Icon:       #F59E0B ████████████████ Amber
Text:       #78350F ████████████████ Dark Amber
Background: #FFFBEB ████████████████ Light Amber
Border:     #F59E0B ████████████████ Amber

INFO (Blue)
───────────────────────────────────────────────────────────────
Icon:       #3B82F6 ████████████████ Blue
Text:       #1E3A8A ████████████████ Dark Blue
Background: #EFF6FF ████████████████ Light Blue
Border:     #3B82F6 ████████████████ Blue
```

---

## Typography

### Login/Register Page

```
Main Title:
  Font: Geist, sans-serif
  Size: 30px (text-3xl)
  Weight: Bold (700)
  Color: Primary Blue (#1F5FD9)
  
Subtitle:
  Font: Geist, sans-serif
  Size: 14px
  Weight: Normal (400)
  Color: Light Blue (secondary)

Labels:
  Font: Geist, sans-serif
  Size: 14px
  Weight: Semi-bold (600)
  Color: Foreground

Input Text:
  Font: Geist, sans-serif
  Size: 16px
  Weight: Normal (400)
  Color: Foreground
  
Button:
  Font: Geist, sans-serif
  Size: 16px
  Weight: Semi-bold (600)
  Color: White
  Background: Gradient (Primary → Primary/80%)
```

---

## Responsive Behavior

### Desktop (1024px+)
```
┌─────────────────────────────────────────────────┐
│ Centered card max-width: 448px (md)             │
│ Notifications: auto width with padding          │
└─────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌──────────────────────────────┐
│ Centered card with padding   │
│ Notifications: 90% width     │
└──────────────────────────────┘
```

### Mobile (< 768px)
```
┌────────────────────────┐
│ Full width - padding   │
│ Notifications: full    │
└────────────────────────┘
```

---

## Animation Timeline

### Notification Slide-In
```
Time:    0ms                    300ms
         │                      │
State:   Hidden      →→→→→→→→   Visible
         Opacity: 0             Opacity: 1
         Y: -20px              Y: 0px

Curve: ease-out (faster start, slower end)
```

### Button Hover State
```
Normal:     Background: Primary Blue
            Shadow: None
            
Hover:      Background: Darker Blue
            Shadow: Box shadow increased
            
Active:     Scale: 0.98
            Opacity: 0.95
```

---

## Spacing System

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px

Used in:
- Form inputs: 12px padding
- Buttons: 12px vertical, 16px horizontal
- Cards: 32px padding
- Gaps: 16px between elements
```

---

## Shadow System

```
Small:  0 1px 2px rgba(0,0,0,0.05)
Medium: 0 4px 6px rgba(0,0,0,0.1)
Large:  0 10px 15px rgba(0,0,0,0.1)
XL:     0 20px 25px rgba(0,0,0,0.1)

Used in:
- Cards: Large shadow
- Dropdowns: Medium shadow
- Notifications: Large shadow
```

---

## Border Radius

```
Default: 8px (rounded-lg)
Small:   4px (rounded-md)
Medium:  8px (rounded-lg)
Large:   12px (rounded-xl)
Full:    9999px (rounded-full)

Used in:
- Input fields: 8px
- Cards: 16px
- Buttons: 8px
- Decorative elements: 9999px
```

---

**Visual design guide complete! 🎨**

# RHV DMS - Design Consistency Rules

**Goal**: Every screen, dialog, form, and animation in the Hospital DMS must feel like one cohesive professional product (enterprise medical software).

## Core Principles

- **Primary Color**: RHV Medical Blue (`--primary` / blue-600)
- **Radius**: Use `rounded-2xl` and `rounded-3xl` for cards/modals (via DESIGN.radius)
- **Shadows**: `shadow-sm` for cards, `shadow-2xl` for modals
- **Typography**: Use the `DESIGN.text.*` classes
- **Icons**: **Lucide-react only** — never use emojis in production UI text
- **Animations**: Prefer `DESIGN.animation.*` (fade, slide, gentle)
- **Forms**: Always wrap with `<Label>` + proper spacing (space-y-2.5 or tighter)

## How to Use the Design System

```tsx
import { DESIGN, designCard, designModal } from '@/lib/design-system'

// Example card
<div className={designCard()}>
  ...
</div>

// Example modal content wrapper
<DialogContent className={designModal()}>
```

## Do's and Don'ts

**Do**
- Import and use classes from `@/lib/design-system`
- Use shadcn/ui components (`Button`, `Card`, `Dialog`, `Input`, `Label`, `Select`, etc.)
- Use only lucide-react icons
- Keep consistent 8px / 12px / 16px spacing rhythm
- Use gentle 200-300ms transitions

**Don't**
- Hardcode colors like `bg-blue-500` outside of design tokens (use `bg-primary`)
- Mix `rounded-lg`, `rounded-xl`, `rounded-2xl` randomly
- Put emojis in buttons, labels, or headers
- Use inline styles for layout/spacing
- Create custom modals when the shadcn Dialog + our `designModal()` works

## Reference Implementations (Gold Standard)

- New Welcome Tutorial (`FirstLoginTutorial.tsx`)
- Pending Scan Confirm Dialog (`ScannerConfirmModal.tsx`)
- Screen Size Guard (`ScreenSizeGuard.tsx`)
- Login page (modern card + gradient header)

When building new features, match the visual language of these files.

Last updated: May 2026

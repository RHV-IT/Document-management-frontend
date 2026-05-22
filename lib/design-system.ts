/**
 * RHV DMS - Centralized Design System
 * 
 * Use these tokens and utilities to maintain visual consistency
 * across the entire application.
 * 
 * Philosophy:
 * - Clean, professional, enterprise-grade (inspired by Microsoft Teams / Google Workspace)
 * - RHV Medical Blue primary (#2563eb / oklch blue)
 * - Generous whitespace, subtle shadows, smooth animations
 * - No emojis in production UI text (use lucide-react icons only)
 * - All components built on shadcn/ui + Tailwind
 */

export const DESIGN = {
  // Border radius (matches CSS var --radius: 0.75rem)
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
  },

  // Shadows - consistent professional depth
  shadow: {
    card: 'shadow-sm',
    elevated: 'shadow-md',
    modal: 'shadow-2xl',
    strong: 'shadow-xl',
  },

  // Spacing scale (use consistently)
  spacing: {
    section: 'space-y-6',
    card: 'p-6',
    tight: 'space-y-3',
  },

  // Animation presets (using tw-animate-css + custom)
  animation: {
    fadeIn: 'animate-in fade-in duration-200',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    slideDown: 'animate-in slide-in-from-top-4 duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-200',
    gentle: 'transition-all duration-200 ease-out',
  },

  // Typography scale for consistency
  text: {
    title: 'text-2xl font-semibold tracking-tight',
    subtitle: 'text-lg font-medium text-muted-foreground',
    body: 'text-sm text-foreground',
    label: 'text-sm font-semibold text-gray-700',
    small: 'text-xs text-muted-foreground',
  },

  // Color usage guidelines
  color: {
    primary: 'text-primary',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    muted: 'text-muted-foreground',
  },
} as const

// Reusable class combiner for consistent components
export function designCard(extra?: string) {
  return `bg-card border border-border ${DESIGN.radius.lg} ${DESIGN.shadow.card} ${extra || ''}`.trim()
}

export function designModal(extra?: string) {
  return `bg-background border border-border ${DESIGN.radius.xl} ${DESIGN.shadow.modal} overflow-hidden ${extra || ''}`.trim()
}

export function designButton(variant: 'primary' | 'secondary' | 'ghost' = 'primary') {
  const base = `${DESIGN.radius.md} font-medium transition-all active:scale-[0.985]`
  if (variant === 'primary') return `${base} bg-primary text-primary-foreground hover:bg-primary/90`
  if (variant === 'secondary') return `${base} bg-secondary text-secondary-foreground hover:bg-secondary/80`
  return `${base} hover:bg-accent hover:text-accent-foreground`
}

'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  mobileClassName?: string
  tabletClassName?: string
  desktopClassName?: string
}

export function ResponsiveContainer({
  children,
  className,
  mobileClassName,
  tabletClassName,
  desktopClassName,
}: ResponsiveContainerProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()

  return (
    <div
      className={cn(
        // Base responsive classes
        "w-full",
        // Mobile-first responsive padding
        "px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        // Mobile-specific adjustments
        isMobile && "px-3 py-4",
        // Custom className overrides
        className,
        mobileClassName && isMobile && mobileClassName,
        tabletClassName && isTablet && tabletClassName,
        desktopClassName && isDesktop && desktopClassName,
      )}
    >
      {children}
    </div>
  )
}

'use client'

import React from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { Monitor, Tablet, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DESIGN } from '@/lib/design-system'

interface ScreenSizeGuardProps {
  children: React.ReactNode
  showOnMobile?: boolean
}

export function ScreenSizeGuard({ children, showOnMobile = true }: ScreenSizeGuardProps) {
  const isMobile = useIsMobile()

  if (!showOnMobile || !isMobile) {
    return <>{children}</>
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 p-6">
      <div className="max-w-md w-full text-center">
        <div className={`mx-auto mb-6 w-20 h-20 ${DESIGN.radius.xl} bg-white/10 backdrop-blur flex items-center justify-center border border-white/20`}>
          <Tablet className="h-10 w-10 text-blue-400" />
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
          Screen Too Small
        </h1>

        <p className="text-lg text-gray-300 mb-2">
          RHV Hospital DMS is designed for tablets and desktop computers.
        </p>

        <p className="text-sm text-gray-400 mb-8">
          Please use a device with a screen width of at least <span className="font-semibold text-white">768px</span> (tablet or larger).
        </p>

        <div className="flex items-center justify-center gap-3 text-xs text-gray-500 mb-8">
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Monitor className="h-3.5 w-3.5" /> Desktop Recommended
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Tablet className="h-3.5 w-3.5" /> Tablet Minimum
          </div>
        </div>

        <div className="text-[11px] text-gray-500">
          For security and compliance reasons, this system does not support mobile phones.
        </div>

        <Button
          variant="outline"
          className="mt-6 border-white/30 text-white bg-gray-800 hover:bg-white/10"
          onClick={() => window.location.reload()}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    </div>
  )
}

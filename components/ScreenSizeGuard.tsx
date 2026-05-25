'use client'

import React from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { Monitor, Tablet, AlertTriangle, Laptop } from 'lucide-react'
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
          RHV Hospital DMS is designed for desktop computers only.
        </p>

        <p className="text-sm text-gray-400 mb-8">
          Please use a device with a screen width of at least <span className="font-semibold text-white">1024px</span> (Laptop or larger).
        </p>

        <div className="flex items-center justify-center gap-3 text-xs text-gray-500 mb-8">
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Monitor className="h-3.5 w-3.5" /> Desktop Recommended
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Laptop className="h-3.5 w-3.5" /> Laptops Minimum
          </div>
        </div>

        <div className="text-[11px] text-gray-500">
          For security and compliance reasons, this system does not support mobile phones.
        </div>

        {/* Futuristic Interactive Refresh Button */}
        <button
          onClick={() => window.location.reload()}
          className="group relative mt-6 inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.5)] active:scale-[0.985]"
        >
          {/* Animated futuristic glow ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-cyan-400/10 to-blue-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Spinning holographic core */}
          <div className="relative flex h-5 w-5 items-center justify-center">
            <div className="absolute h-5 w-5 animate-[spin_2s_linear_infinite] rounded-full border border-white/30" />
            <div className="absolute h-5 w-5 animate-[spin_1.2s_linear_infinite_reverse] rounded-full border-t border-white/70" />
            <AlertTriangle className="relative h-3.5 w-3.5 text-blue-400 transition-transform group-active:rotate-12" />
          </div>

          <span className="relative z-10 tracking-[1.5px] text-white/90 group-hover:text-white">
            REINITIALIZE
          </span>

          {/* Subtle particle trail on hover */}
          <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-400 opacity-0 blur-sm transition-all group-hover:-translate-x-3 group-hover:-translate-y-3 group-hover:opacity-70" />
          <div className="absolute -bottom-1 -right-2 h-1.5 w-1.5 rounded-full bg-cyan-400 opacity-0 blur-sm transition-all delay-75 group-hover:-translate-x-4 group-hover:translate-y-2 group-hover:opacity-50" />
        </button>
      </div>
    </div>
  )
}

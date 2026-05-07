'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface GlowCircleProps {
  isActive?: boolean
  isExpanded?: boolean
  className?: string
}

export function GlowCircle({ isActive, isExpanded, className }: GlowCircleProps) {
  return (
    <div
      className={cn(
        'relative w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center',
        className
      )}
    >
      {/* Inner dot */}
      <div
        className={cn(
          'w-1.5 h-1.5 rounded-full transition-all duration-300',
          isActive || isExpanded
            ? 'bg-white scale-125'
            : 'bg-gray-400 group-hover:bg-blue-500'
        )}
      />
      
      {/* Glow effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-full blur-md transition-all duration-300',
          isActive || isExpanded
            ? 'bg-blue-400/60 scale-125 opacity-100'
            : 'bg-gray-300/0 scale-100 group-hover:bg-blue-400/40 group-hover:opacity-70'
        )}
      />
      
      {/* Outer ring */}
      <div
        className={cn(
          'absolute inset-0 rounded-full border transition-all duration-300',
          isActive || isExpanded
            ? 'border-white/50 scale-110'
            : 'border-transparent group-hover:border-blue-300/50'
        )}
      />
    </div>
  )
}

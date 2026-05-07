'use client'

import React from 'react'
import { FileText, Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileFillingLoaderProps {
  progress?: number
  fileName?: string
  variant?: 'default' | 'minimal'
  className?: string
}

export function FileFillingLoader({ progress = 0, fileName, variant = 'default', className }: FileFillingLoaderProps) {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100)

  if (variant === 'minimal') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
        <div className="relative">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <Loader className="absolute inset-0 h-8 w-8 text-primary animate-spin" style={{ opacity: 0.3 }} />
        </div>
        {fileName && <p className="text-sm text-muted-foreground truncate">{fileName}</p>}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-6', className)}>
      <div className="relative w-24 h-32">
        {/* File background */}
        <div className="absolute inset-0 bg-secondary border-2 border-primary rounded-lg" />

        {/* File fill animation */}
        <div
          className="absolute inset-0 bg-primary rounded-lg overflow-hidden"
          style={{
            clipPath: `inset(${100 - normalizedProgress}% 0 0 0)`,
            transition: 'clip-path 0.3s ease-out',
          }}
        />

        {/* File lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none">
          <div className="h-1 bg-muted-foreground/20 rounded w-4/5" />
          <div className="h-1 bg-muted-foreground/20 rounded w-3/5" />
          <div className="h-1 bg-muted-foreground/20 rounded w-4/5" />
        </div>

        {/* Progress text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground">{normalizedProgress}%</span>
        </div>
      </div>

      {fileName && <p className="text-sm text-muted-foreground text-center truncate max-w-xs">{fileName}</p>}
    </div>
  )
}

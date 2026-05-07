'use client'

import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  count?: number
  type?: 'card' | 'row' | 'circle' | 'text'
  className?: string
}

export function SkeletonLoader({ count = 1, type = 'card', className }: SkeletonLoaderProps) {
  const baseClass = 'bg-muted animate-skeleton-pulse rounded'

  if (type === 'card') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array(count)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="space-y-3">
              <div className={cn(baseClass, 'h-12 w-full')} />
              <div className={cn(baseClass, 'h-4 w-5/6')} />
              <div className={cn(baseClass, 'h-4 w-4/6')} />
            </div>
          ))}
      </div>
    )
  }

  if (type === 'row') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array(count)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={cn(baseClass, 'h-10 w-10 rounded-full flex-shrink-0')} />
              <div className="flex-1 space-y-2">
                <div className={cn(baseClass, 'h-4 w-1/3')} />
                <div className={cn(baseClass, 'h-4 w-1/4')} />
              </div>
            </div>
          ))}
      </div>
    )
  }

  if (type === 'circle') {
    return (
      <div className={cn('flex gap-4', className)}>
        {Array(count)
          .fill(0)
          .map((_, i) => (
            <div key={i} className={cn(baseClass, 'h-12 w-12 rounded-full')} />
          ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className={cn(baseClass, 'h-4', i === count - 1 && 'w-4/5')} />
        ))}
    </div>
  )
}

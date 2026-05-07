'use client'

import { cn } from '@/lib/utils'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4 p-4 bg-muted rounded-lg animate-skeleton-pulse">
        {Array(columns)
          .fill(0)
          .map((_, i) => (
            <div key={`header-${i}`} className={cn('h-4 bg-muted-foreground/20 rounded', i === 0 ? 'w-1/4' : 'flex-1')} />
          ))}
      </div>

      {/* Rows */}
      {Array(rows)
        .fill(0)
        .map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4 p-4 border rounded-lg animate-skeleton-pulse">
            {Array(columns)
              .fill(0)
              .map((_, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={cn('h-4 bg-muted-foreground/20 rounded', colIndex === 0 ? 'w-1/4' : 'flex-1')}
                />
              ))}
          </div>
        ))}
    </div>
  )
}

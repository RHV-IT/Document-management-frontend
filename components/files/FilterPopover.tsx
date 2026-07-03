'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

/** Windows-11-style multi-select checkbox list (the body of a filter dropdown/popover). */
export function FilterOptionList<T extends string>({
  options,
  active,
  onChange,
}: {
  options: { value: T; label: string }[]
  active: Set<T>
  onChange: (next: Set<T>) => void
}) {
  const hasActive = active.size > 0
  return (
    <div>
      <div className="space-y-0.5 max-h-56 overflow-y-auto">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'flex items-center gap-2 px-1.5 py-1 rounded hover:bg-accent/50 cursor-pointer text-xs'
            )}
          >
            <Checkbox checked={active.has(opt.value)} onCheckedChange={() => onChange(toggleInSet(active, opt.value))} />
            <span className="truncate">{opt.label}</span>
          </label>
        ))}
      </div>
      {hasActive && (
        <>
          <div className="h-px bg-border my-1.5" />
          <button
            onClick={() => onChange(new Set())}
            className="text-xs text-primary hover:underline w-full text-left px-1.5"
          >
            Clear filter
          </button>
        </>
      )}
    </div>
  )
}

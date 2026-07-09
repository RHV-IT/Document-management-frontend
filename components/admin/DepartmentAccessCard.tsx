'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Shield, Star, ChevronDown } from 'lucide-react'
import { CONFIDENTIALITY_LEVELS } from '@/lib/access-control'
import { cn } from '@/lib/utils'

const LEVEL_LABELS: Record<string, string> = {
  public: 'Public',
  internal: 'Internal',
  confidential: 'Confidential',
  highly_confidential: 'Highly Confidential',
}

interface DepartmentAccessCardProps {
  department: string
  isPrimary: boolean
  onSetPrimary: () => void
  confidentialityLevels: string[]
  onConfidentialityLevelsChange: (levels: string[]) => void
  defaultOpen?: boolean
}

export function DepartmentAccessCard({
  department,
  isPrimary,
  onSetPrimary,
  confidentialityLevels,
  onConfidentialityLevelsChange,
  defaultOpen = true,
}: DepartmentAccessCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  const toggleLevel = (level: string) => {
    if (confidentialityLevels.includes(level)) {
      onConfidentialityLevelsChange(confidentialityLevels.filter((l) => l !== level))
    } else {
      onConfidentialityLevelsChange([...confidentialityLevels, level])
    }
  }

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', isPrimary && 'border-primary/40 bg-primary/5')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold truncate">{department}</span>
          {isPrimary && (
            <Badge variant="secondary" className="gap-1 text-[10px] shrink-0">
              <Star className="h-2.5 w-2.5 fill-current" />
              Primary
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">Set as Primary</span>
          <Switch checked={isPrimary} onCheckedChange={(checked) => checked && onSetPrimary()} />
        </div>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground group">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            Allowed Confidentiality
            {!open && confidentialityLevels.length > 0 && (
              <span className="text-[10px] text-muted-foreground/70">({confidentialityLevels.length} selected)</span>
            )}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1.5 pt-2">
          {CONFIDENTIALITY_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={confidentialityLevels.includes(level)}
                onCheckedChange={() => toggleLevel(level)}
              />
              {LEVEL_LABELS[level]}
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default DepartmentAccessCard

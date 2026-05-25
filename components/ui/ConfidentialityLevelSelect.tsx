import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useConfidentialityLevelsConfigQuery } from '@/hooks/useSettings'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccessControl } from '@/hooks/useAccessControl'
import { CONFIDENTIALITY_LEVELS, getClearanceLabel, getHighestConfidentialityLevel } from '@/lib/access-control'
import { Shield } from 'lucide-react'

interface ConfidentialityLevelSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** @deprecated - component now sources allowed levels exclusively from logged-in user's confidentialityLevels via useAccessControl */
  userLevel?: string
  /** @deprecated - component now sources allowed levels exclusively from logged-in user's confidentialityLevels via useAccessControl */
  userRole?: string
  className?: string
  showRestrictionNote?: boolean
}

const CONFIDENTIALITY_COLORS: Record<string, string> = {
  public: '#10b981',
  internal: '#3b82f6',
  confidential: '#f59e0b',
  highly_confidential: '#ef4444'
}

const CONFIDENTIALITY_LABELS: Record<string, string> = {
  public: 'Everyone Can See',
  internal: 'Company Only',
  confidential: 'Limited Access Only',
  highly_confidential: 'Very Secret - Few People Only'
}

export function ConfidentialityLevelSelect({
  value,
  onValueChange,
  placeholder = 'Select confidentiality level',
  disabled = false,
  userLevel,
  userRole,
  className = '',
  showRestrictionNote = false,
}: ConfidentialityLevelSelectProps) {
  const { data: levels, isLoading } = useConfidentialityLevelsConfigQuery()
  const { allowedLevels } = useAccessControl()

  if (isLoading) {
    return <Skeleton className={`h-10 w-full ${className}`} />
  }

  // PRIMARY UI AUTHORITY: ONLY levels from current user's confidentialityLevels array (post-login normalized)
  const allowed = (allowedLevels || []) as string[]

  const fallbackOptions = [
    { value: 'public', label: CONFIDENTIALITY_LABELS.public, color: CONFIDENTIALITY_COLORS.public, description: 'Accessible to everyone' },
    { value: 'internal', label: CONFIDENTIALITY_LABELS.internal, color: CONFIDENTIALITY_COLORS.internal, description: 'Internal company use only' },
    { value: 'confidential', label: CONFIDENTIALITY_LABELS.confidential, color: CONFIDENTIALITY_COLORS.confidential, description: 'Sensitive information - restricted access' },
    { value: 'highly_confidential', label: CONFIDENTIALITY_LABELS.highly_confidential, color: CONFIDENTIALITY_COLORS.highly_confidential, description: 'Extremely sensitive - very limited access' },
  ]

  const options = levels && levels.length > 0
    ? levels
        .filter((level) => allowed.includes(level.value))
        .sort((a, b) => CONFIDENTIALITY_LEVELS.indexOf(a.value as any) - CONFIDENTIALITY_LEVELS.indexOf(b.value as any))
        .map((level) => ({
          value: level.value,
          label: CONFIDENTIALITY_LABELS[level.value] || level.label,
          color: CONFIDENTIALITY_COLORS[level.value] || '#6b7280',
          description: level.label,
        }))
    : fallbackOptions.filter((option) => allowed.includes(option.value))

  const effectiveHighest = getHighestConfidentialityLevel(allowed)

  return (
    <div className="w-full">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length > 0 ? (
            options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.description && option.description !== option.label && (
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No levels available for your access</div>
          )}
        </SelectContent>
      </Select>

      {showRestrictionNote && allowed.length > 0 && allowed.length < CONFIDENTIALITY_LEVELS.length && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
          <Shield className="h-3 w-3 flex-shrink-0" />
          <span>
            Limited to your clearance: <strong className="font-medium">{getClearanceLabel(effectiveHighest)}</strong>
          </span>
        </div>
      )}
    </div>
  )
}

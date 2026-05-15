import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useConfidentialityLevelsConfigQuery } from '@/hooks/useSettings'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'

interface ConfidentialityLevelSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  userLevel?: string // current user's confidentiality level for restrictions
  userRole?: string // current user's role for admin permissions
  className?: string
}

const CONFIDENTIALITY_COLORS: Record<string, string> = {
  public: '#10b981', // green
  internal: '#3b82f6', // blue
  confidential: '#f59e0b', // orange
  highly_confidential: '#ef4444', // red
}

const CONFIDENTIALITY_LABELS: Record<string, string> = {
  public: 'Everyone Can See',
  internal: 'Company Only',
  confidential: 'Limited Access Only',
  highly_confidential: 'Very Secret - Few People Only',
}

const CONFIDENTIALITY_LEVEL_ORDER = ['public', 'internal', 'confidential', 'highly_confidential']

function getAllowedLevels(userLevel?: string, userRole?: string): string[] {
  // Admins can see all levels
  if (userRole === 'admin') return CONFIDENTIALITY_LEVEL_ORDER

  if (!userLevel) return CONFIDENTIALITY_LEVEL_ORDER

  const userIndex = CONFIDENTIALITY_LEVEL_ORDER.indexOf(userLevel)
  if (userIndex === -1) return CONFIDENTIALITY_LEVEL_ORDER

  // User can choose their level and below
  return CONFIDENTIALITY_LEVEL_ORDER.slice(0, userIndex + 1)
}

export function ConfidentialityLevelSelect({
  value,
  onValueChange,
  placeholder = 'Select confidentiality level',
  disabled = false,
  userLevel,
  userRole,
  className = '',
}: ConfidentialityLevelSelectProps) {
  const { data: levels, isLoading } = useConfidentialityLevelsConfigQuery()
  const { user } = useAuth()

  const currentUserRole = userRole || user?.role
  const currentUserLevel = userLevel || user?.confidentialityLevel

  if (isLoading) {
    return <Skeleton className={`h-10 w-full ${className}`} />
  }

  const allowedLevels = getAllowedLevels(currentUserLevel, currentUserRole)
  // Fallback options in case API doesn't work
  const fallbackOptions = [
    { value: 'public', label: CONFIDENTIALITY_LABELS.public, color: CONFIDENTIALITY_COLORS.public, description: 'Accessible to everyone' },
    { value: 'internal', label: CONFIDENTIALITY_LABELS.internal, color: CONFIDENTIALITY_COLORS.internal, description: 'Internal company use only' },
    { value: 'confidential', label: CONFIDENTIALITY_LABELS.confidential, color: CONFIDENTIALITY_COLORS.confidential, description: 'Sensitive information - restricted access' },
    { value: 'highly_confidential', label: CONFIDENTIALITY_LABELS.highly_confidential, color: CONFIDENTIALITY_COLORS.highly_confidential, description: 'Extremely sensitive - very limited access' },
  ]

  const options = levels && levels.length > 0
    ? levels
        .filter(level => allowedLevels.includes(level.value))
        .sort((a, b) => CONFIDENTIALITY_LEVEL_ORDER.indexOf(a.value) - CONFIDENTIALITY_LEVEL_ORDER.indexOf(b.value))
        .map(level => ({
          value: level.value,
          label: CONFIDENTIALITY_LABELS[level.value] || level.label,
          color: CONFIDENTIALITY_COLORS[level.value] || '#6b7280',
          description: level.label,
        }))
    : fallbackOptions.filter(option => allowedLevels.includes(option.value))



  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
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
        ))}
      </SelectContent>
    </Select>
  )
}
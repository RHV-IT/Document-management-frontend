'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Crown, Briefcase, Users } from 'lucide-react'

export const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Full system access and management',
    color: '#ef4444',
    icon: Crown,
  },
  {
    value: 'hod',
    label: 'Manager',
    description: 'Department-level access and oversight',
    color: '#8b5cf6',
    icon: Briefcase,
  },
  {
    value: 'user',
    label: 'Standard User',
    description: 'Regular access to assigned functions',
    color: '#10b981',
    icon: Users,
  },
] as const

interface RoleSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function RoleSelect({ value, onValueChange, placeholder = 'Select role', className = '', disabled }: RoleSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((role) => {
          const IconComponent = role.icon
          return (
            <SelectItem key={role.value} value={role.value}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${role.color}20` }}>
                  <IconComponent className="h-4 w-4" style={{ color: role.color }} />
                </div>
                <div>
                  <div className="font-medium">{role.label}</div>
                  <div className="text-xs text-muted-foreground">{role.description}</div>
                </div>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

export default RoleSelect

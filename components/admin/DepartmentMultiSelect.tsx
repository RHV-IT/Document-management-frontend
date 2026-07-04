'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DepartmentOption {
  _id: string
  name: string
  code: string
  description?: string
  isActive: boolean
}

interface DepartmentMultiSelectProps {
  departments: DepartmentOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
}

/** Searchable multi-select with removable chips, replacing the old non-searchable toggle dropdown. */
export function DepartmentMultiSelect({ departments, value, onChange, placeholder = 'Search departments...', disabled }: DepartmentMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const selected = departments.filter((d) => value.includes(d.name))

  const toggle = (name: string) => {
    if (value.includes(name)) onChange(value.filter((v) => v !== name))
    else onChange([...value, name])
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((d) => (
            <Badge key={d._id} variant="secondary" className="gap-1 pr-1 text-xs font-medium">
              {d.name}
              <button
                type="button"
                onClick={() => toggle(d.name)}
                disabled={disabled}
                className="rounded-full hover:bg-foreground/10 p-0.5 transition-colors"
                aria-label={`Remove ${d.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal text-muted-foreground hover:text-foreground"
          >
            {placeholder}
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search departments..." />
            <CommandList>
              <CommandEmpty>No departments found.</CommandEmpty>
              <CommandGroup>
                {departments.map((d) => {
                  const isSelected = value.includes(d.name)
                  return (
                    <CommandItem key={d._id} value={`${d.name} ${d.code}`} onSelect={() => toggle(d.name)}>
                      <Check className={cn('mr-2 h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                      <span className="font-medium truncate">{d.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground shrink-0">{d.code}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DepartmentMultiSelect

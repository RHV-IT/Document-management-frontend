'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Folder, Home, Plus, X } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface ExplorerTabInfo {
  id: string
  label: string
  isFolder: boolean
}

interface TabBarProps {
  tabs: ExplorerTabInfo[]
  activeTabId: string
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onNewTab: () => void
}

export function TabBar({ tabs, activeTabId, onSelect, onClose, onNewTab }: TabBarProps) {
  return (
    <div className="h-9 flex items-end gap-0.5 px-2 pt-1.5 bg-muted/40 border-b overflow-x-auto shrink-0">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={cn(
              'group flex items-center gap-1.5 h-7.5 min-w-[110px] max-w-[180px] px-2.5 rounded-t-lg text-xs cursor-pointer select-none transition-colors shrink-0',
              isActive ? 'bg-card border border-b-0 font-medium text-foreground' : 'text-muted-foreground hover:bg-accent/50'
            )}
          >
            {tab.isFolder ? (
              <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            ) : (
              <Home className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate flex-1">{tab.label}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose(tab.id)
                }}
                className={cn(
                  'p-0.5 rounded hover:bg-accent shrink-0 transition-opacity',
                  isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-70 hover:!opacity-100'
                )}
                aria-label={`Close tab ${tab.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )
      })}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onNewTab}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors shrink-0 mb-0.5"
            aria-label="New tab"
          >
            <Plus className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>New tab</TooltipContent>
      </Tooltip>
    </div>
  )
}

export default TabBar

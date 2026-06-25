'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Folder, MoreVertical, Lock, Star, Check, GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu'

interface FolderCardProps {
  folder: {
    _id: string
    name: string
    description?: string
    isSystemFolder: boolean
    confidentialityLevel: string
    updatedAt?: string
  }
  viewMode: 'grid' | 'list'
  isSelected?: boolean
  isFavorite?: boolean
  onSelect?: (e: React.MouseEvent) => void
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
  onMove: () => void
  onToggleFavorite?: () => void
}

const CONFIDENTIALITY_COLORS: Record<string, string> = {
  public: 'bg-emerald-100 text-emerald-700',
  internal: 'bg-blue-100 text-blue-700',
  confidential: 'bg-amber-100 text-amber-700',
  highly_confidential: 'bg-red-100 text-red-700',
}

function getConfidentialityColor(level: string): string {
  return CONFIDENTIALITY_COLORS[level] || 'bg-gray-100 text-gray-700'
}

export function FolderCard({
  folder,
  viewMode,
  isSelected = false,
  isFavorite = false,
  onSelect,
  onOpen,
  onRename,
  onDelete,
  onMove,
  onToggleFavorite,
}: FolderCardProps) {
  if (viewMode === 'grid') {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Card
            className={cn(
              'group overflow-hidden border-0 bg-card hover:shadow-xl transition-all duration-300 cursor-pointer',
              isSelected && 'ring-2 ring-primary bg-primary/5'
            )}
            onClick={onSelect}
            onDoubleClick={onOpen}
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 flex items-center justify-center relative">
              <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                <Folder className="w-12 h-12 text-amber-500" />
              </div>

              {/* Selection checkbox */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white/80 border-gray-300 hover:border-primary'
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect?.(e)
                  }}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </button>
              </div>

              {/* Favorite star */}
              {isFavorite && (
                <div className="absolute top-2 left-2 group-hover:opacity-0 transition-opacity">
                  <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                </div>
              )}

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                      Open
                    </DropdownMenuItem>
                    {!folder.isSystemFolder && (
                      <>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(); }}>
                          Move
                        </DropdownMenuItem>
                        {onToggleFavorite && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
                            {isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {folder.isSystemFolder && (
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-blue-100 text-blue-700 text-[10px] font-medium flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    System
                  </Badge>
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="font-semibold truncate text-sm">{folder.name}</p>
              {folder.description && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {folder.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={cn('text-[10px]', getConfidentialityColor(folder.confidentialityLevel))}>
                  {folder.confidentialityLevel?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={onOpen}>Open</ContextMenuItem>
          {!folder.isSystemFolder && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={onRename}>Rename</ContextMenuItem>
              <ContextMenuItem onClick={onMove}>Move</ContextMenuItem>
              {onToggleFavorite && (
                <ContextMenuItem onClick={onToggleFavorite}>
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </ContextMenuItem>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem className="text-destructive" onClick={onDelete}>Delete</ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  // List view
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors group cursor-pointer rounded-lg',
            isSelected && 'bg-primary/5 ring-1 ring-primary'
          )}
          onClick={onSelect}
          onDoubleClick={onOpen}
        >
          {/* Drag handle */}
          <div className="opacity-0 group-hover:opacity-100 text-muted-foreground cursor-grab">
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Selection checkbox */}
          <button
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
              isSelected
                ? 'bg-primary border-primary text-white'
                : 'border-gray-300 hover:border-primary'
            )}
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.(e)
            }}
          >
            {isSelected && <Check className="w-3 h-3" />}
          </button>

          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
            <Folder className="w-5 h-5 text-amber-500" />
          </div>

          {/* Favorite indicator */}
          {isFavorite && (
            <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" fill="currentColor" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate text-sm">{folder.name}</span>
              {folder.isSystemFolder && (
                <Badge className="bg-blue-100 text-blue-700 text-[10px] font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  System
                </Badge>
              )}
            </div>
            {folder.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {folder.description}
              </p>
            )}
          </div>

          <Badge variant="outline" className={cn('text-[10px] hidden sm:inline-flex', getConfidentialityColor(folder.confidentialityLevel))}>
            {folder.confidentialityLevel?.replace('_', ' ')}
          </Badge>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                  Open
                </DropdownMenuItem>
                {!folder.isSystemFolder && (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(); }}>
                      Move
                    </DropdownMenuItem>
                    {onToggleFavorite && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
                        {isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onOpen}>Open</ContextMenuItem>
        {!folder.isSystemFolder && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onRename}>Rename</ContextMenuItem>
            <ContextMenuItem onClick={onMove}>Move</ContextMenuItem>
            {onToggleFavorite && (
              <ContextMenuItem onClick={onToggleFavorite}>
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem className="text-destructive" onClick={onDelete}>Delete</ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default FolderCard

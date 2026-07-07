'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Folder, Check, Star, MoreHorizontal, Lock } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FolderContextMenu } from '@/components/files/ContextMenus'
import { FolderItem } from '@/services/api/folders'
import { GridIconSize, getConfidentialityLabel, getConfidentialityColor } from '@/lib/file-utils'
import { formatBytes } from '@/lib/utils'

interface FolderCardProps {
  folder: FolderItem
  viewMode: 'grid' | 'list'
  size?: GridIconSize
  isSelected: boolean
  isFavorite: boolean
  canPaste: boolean
  onSelect: (e: React.MouseEvent) => void
  onOpen: () => void
  onOpenNewTab?: () => void
  onRename: () => void
  onDelete: () => void
  onMove: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  onToggleFavorite: () => void
  onProperties: () => void
  registerRef?: (el: HTMLElement | null) => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  isDropTarget?: boolean
}

export function FolderCard({
  folder,
  viewMode,
  size = 'large',
  isSelected,
  isFavorite,
  canPaste,
  onSelect,
  onOpen,
  onOpenNewTab,
  onRename,
  onDelete,
  onMove,
  onCopy,
  onCut,
  onPaste,
  onToggleFavorite,
  onProperties,
  registerRef,
  draggable = true,
  onDragStart,
  onDragOver,
  onDrop,
  isDropTarget,
}: FolderCardProps) {
  const isSystemFolder = !!folder.isSystemFolder
  const isRestricted = (folder as any).restricted === true

  const stop = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation()
    fn()
  }

  const menu = (
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem onClick={(e) => stop(e, onOpen)}>
        <Folder className="w-4 h-4 mr-2" />
        Open
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {!isSystemFolder && (
        <>
          <DropdownMenuItem onClick={(e) => stop(e, onRename)}>Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => stop(e, onMove)}>Move</DropdownMenuItem>
        </>
      )}
      <DropdownMenuItem onClick={(e) => stop(e, onCopy)}>Copy</DropdownMenuItem>
      {!isSystemFolder && <DropdownMenuItem onClick={(e) => stop(e, onCut)}>Cut</DropdownMenuItem>}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={(e) => stop(e, onToggleFavorite)}>
        <Star className={cn('w-4 h-4 mr-2', isFavorite && 'fill-current text-yellow-500')} />
        {isFavorite ? 'Remove Star' : 'Add Star'}
      </DropdownMenuItem>
      {!isSystemFolder && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => stop(e, onDelete)}>
            Delete
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  )

  const folderIconClass = size === 'small' ? 'h-5 w-5' : size === 'medium' ? 'h-6 w-6' : 'h-8 w-8'
  const cardPadClass = size === 'small' ? 'p-2' : size === 'medium' ? 'p-2.5' : 'p-3'

  const card =
    viewMode === 'grid' ? (
      <div
        ref={registerRef as any}
        data-folder-id={folder._id}
        className={cn(
          'group relative flex items-center gap-3 border rounded-xl bg-card hover:shadow-md hover:bg-accent/30 transition-all duration-200 cursor-pointer',
          cardPadClass,
          isSelected && 'ring-2 ring-primary bg-primary/5',
          isDropTarget && 'ring-2 ring-primary bg-primary/10'
        )}
        onClick={onSelect}
        onDoubleClick={onOpen}
        draggable={draggable && !isSystemFolder}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <button
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0',
            isSelected ? 'bg-primary border-primary text-white' : 'opacity-0 group-hover:opacity-100 border-gray-300 hover:border-primary'
          )}
          onClick={(e) => stop(e, () => onSelect(e))}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </button>
        <Folder className={cn(folderIconClass, 'text-amber-500 shrink-0')} fill="currentColor" fillOpacity={0.15} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium truncate text-sm">{folder.name}</p>
            {isFavorite && <Star className="w-3 h-3 text-yellow-500 shrink-0" fill="currentColor" />}
          </div>
          {size !== 'small' && (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {isSystemFolder && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">System</span>
              )}
              {isRestricted && (
                <Badge className="bg-red-100 text-red-700 text-[10px] font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Restricted
                </Badge>
              )}
              {folder.confidentialityLevel && (
                <Badge
                  className={cn('max-w-full shrink truncate text-[10px] font-medium', getConfidentialityColor(folder.confidentialityLevel))}
                  title={getConfidentialityLabel(folder.confidentialityLevel)}
                >
                  {getConfidentialityLabel(folder.confidentialityLevel)}
                </Badge>
              )}
            </div>
          )}
          {size !== 'small' && folder.stats && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {folder.stats.totalFolders} {folder.stats.totalFolders === 1 ? 'folder' : 'folders'} · {folder.stats.totalFiles} {folder.stats.totalFiles === 1 ? 'file' : 'files'} · {formatBytes(folder.stats.totalSize)}
            </p>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-accent transition-colors" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            {menu}
          </DropdownMenu>
        </div>
      </div>
    ) : (
      <div
        ref={registerRef as any}
        data-folder-id={folder._id}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors group cursor-pointer rounded-lg',
          isSelected && 'bg-primary/5 ring-1 ring-primary',
          isDropTarget && 'ring-2 ring-primary bg-primary/10'
        )}
        onClick={onSelect}
        onDoubleClick={onOpen}
        draggable={draggable && !isSystemFolder}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <button
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0',
            isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'
          )}
          onClick={(e) => stop(e, () => onSelect(e))}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </button>
        <Folder className="h-5 w-5 text-amber-500 shrink-0" />
        {isFavorite && <Star className="w-3.5 h-3.5 text-yellow-500 shrink-0" fill="currentColor" />}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="flex-1 min-w-0 truncate font-medium text-sm">{folder.name}</span>
          {isSystemFolder && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">System</span>
          )}
          {folder.confidentialityLevel && (
            <Badge
              className={cn('max-w-40 shrink truncate text-[10px] font-medium', getConfidentialityColor(folder.confidentialityLevel))}
              title={getConfidentialityLabel(folder.confidentialityLevel)}
            >
              {getConfidentialityLabel(folder.confidentialityLevel)}
            </Badge>
          )}
        </div>
        {folder.stats && (
          <span className="text-xs text-muted-foreground shrink-0 hidden lg:inline">
            {folder.stats.totalFolders} folders · {folder.stats.totalFiles} files · {formatBytes(folder.stats.totalSize)}
          </span>
        )}
        <span className="text-xs text-muted-foreground w-24 shrink-0 hidden md:inline">Folder</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-accent transition-colors" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            {menu}
          </DropdownMenu>
        </div>
      </div>
    )

  return (
    <FolderContextMenu
      isSystemFolder={isSystemFolder}
      isFavorite={isFavorite}
      onOpen={onOpen}
      onOpenNewTab={onOpenNewTab}
      onRename={onRename}
      onCopy={onCopy}
      onCut={onCut}
      onPaste={onPaste}
      canPaste={canPaste}
      onDelete={onDelete}
      onMove={onMove}
      onToggleFavorite={onToggleFavorite}
      onProperties={onProperties}
    >
      {card}
    </FolderContextMenu>
  )
}

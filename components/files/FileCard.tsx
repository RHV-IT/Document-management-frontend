'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatBytes } from '@/lib/utils'
import { FileItem } from '@/services/api/files'
import { getFileIconElement, getConfidentialityLabel, getConfidentialityColor, GridIconSize } from '@/lib/file-utils'
import { formatDistanceToNow } from 'date-fns'
import {
  MoreHorizontal,
  Eye,
  Download,
  Share2,
  Move,
  Copy,
  Scissors,
  Edit3,
  Trash2,
  Check,
  Star,
  Lock,
  History,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileContextMenu } from './ContextMenus'

interface FileCardProps {
  file: FileItem
  viewMode: 'grid' | 'list'
  size?: GridIconSize
  isSelected: boolean
  isFavorite: boolean
  canPaste: boolean
  onSelect: (e: React.MouseEvent) => void
  onOpen: () => void
  onPreview: () => void
  onDownload: () => void
  onShare: () => void
  onMove: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  onDelete: () => void
  onRename: () => void
  onVersions: () => void
  onToggleFavorite: () => void
  onProperties: () => void
  registerRef?: (el: HTMLElement | null) => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
}

export function FileCard({
  file,
  viewMode,
  size = 'large',
  isSelected,
  isFavorite,
  canPaste,
  onSelect,
  onOpen,
  onPreview,
  onDownload,
  onShare,
  onMove,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onRename,
  onVersions,
  onToggleFavorite,
  onProperties,
  registerRef,
  draggable = true,
  onDragStart,
}: FileCardProps) {
  const isRestricted = file.restricted === true
  const displayName = file.alias || file.name

  const menuContent = (stop: (e: React.MouseEvent, fn: () => void) => void) => (
    <DropdownMenuContent align="end" className="w-48">
      {!isRestricted && (
        <>
          <DropdownMenuItem onClick={(e) => stop(e, onPreview)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => stop(e, onDownload)}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => stop(e, onShare)}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuItem onClick={(e) => stop(e, onMove)}>
        <Move className="w-4 h-4 mr-2" />
        Move
      </DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => stop(e, onCopy)}>
        <Copy className="w-4 h-4 mr-2" />
        Copy
      </DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => stop(e, onCut)}>
        <Scissors className="w-4 h-4 mr-2" />
        Cut
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={(e) => stop(e, onRename)}>
        <Edit3 className="w-4 h-4 mr-2" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => stop(e, onVersions)}>
        <History className="w-4 h-4 mr-2" />
        Versions
      </DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => stop(e, onToggleFavorite)}>
        <Star className={cn('w-4 h-4 mr-2', isFavorite && 'fill-current text-yellow-500')} />
        {isFavorite ? 'Remove Star' : 'Add Star'}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => stop(e, onDelete)}>
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  const stop = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation()
    fn()
  }

  const iconSizeClass = size === 'small' ? 'h-5 w-5' : size === 'medium' ? 'h-6 w-6' : 'h-8 w-8'
  const iconPadClass = size === 'small' ? 'p-2' : size === 'medium' ? 'p-3' : 'p-4'

  const card =
    viewMode === 'grid' ? (
      <Card
        ref={registerRef as any}
        data-file-id={file.fileId}
        className={cn(
          'group relative overflow-hidden border bg-card hover:shadow-lg transition-all duration-200 cursor-pointer',
          isSelected && 'ring-2 ring-primary bg-primary/5',
          isRestricted && 'opacity-60'
        )}
        onClick={onSelect}
        onDoubleClick={() => !isRestricted && onOpen()}
        draggable={draggable && !isRestricted}
        onDragStart={onDragStart}
      >
        <div className={cn('bg-linear-to-br from-muted/50 to-muted/20 flex items-center justify-center relative', size === 'small' ? 'aspect-square' : 'aspect-4/3')}>
          <div
            className={cn(
              'absolute top-2 left-2 z-10 transition-opacity',
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <button
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                isSelected
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white/80 dark:bg-gray-800/80 border-gray-300 hover:border-primary'
              )}
              onClick={(e) => stop(e, () => onSelect(e))}
            >
              {isSelected && <Check className="w-3 h-3" />}
            </button>
          </div>

          {isFavorite && (
            <div className="absolute top-2 right-2 z-10 group-hover:opacity-0 transition-opacity">
              <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
            </div>
          )}

          {isRestricted && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-red-100 text-red-700 text-[10px] font-medium flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Restricted
              </Badge>
            </div>
          )}

          <div className={cn('bg-white/60 dark:bg-gray-900/60 rounded-xl shadow-sm group-hover:scale-105 transition-transform', iconPadClass)}>
            {getFileIconElement(file, iconSizeClass)}
          </div>

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              {menuContent(stop)}
            </DropdownMenu>
          </div>
        </div>

        <div className={size === 'small' ? 'p-2' : 'p-3'}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="font-medium truncate text-sm flex-1 min-w-0">{displayName}</p>
            {size !== 'small' && (
              <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
                {file.type?.split('/').pop()?.slice(0, 5) || '—'}
              </Badge>
            )}
          </div>
          {size !== 'small' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>{formatBytes(file.size)}</span>
              {file.updatedAt && (
                <>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(file.updatedAt))} ago</span>
                </>
              )}
            </div>
          )}
          {size === 'large' && file.confidentialityLevel && (
            <Badge
              className={cn('max-w-full truncate text-[10px]', getConfidentialityColor(file.confidentialityLevel))}
              title={getConfidentialityLabel(file.confidentialityLevel)}
            >
              {getConfidentialityLabel(file.confidentialityLevel)}
            </Badge>
          )}
        </div>
      </Card>
    ) : (
      <div
        ref={registerRef as any}
        data-file-id={file.fileId}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors group cursor-pointer rounded-lg',
          isSelected && 'bg-primary/5 ring-1 ring-primary',
          isRestricted && 'opacity-60'
        )}
        onClick={onSelect}
        onDoubleClick={() => !isRestricted && onOpen()}
        draggable={draggable && !isRestricted}
        onDragStart={onDragStart}
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

        <div className="p-1.5 bg-muted rounded-lg shrink-0">{getFileIconElement(file, 'h-5 w-5')}</div>

        {isFavorite && <Star className="w-3.5 h-3.5 text-yellow-500 shrink-0" fill="currentColor" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate text-sm">{displayName}</span>
            {isRestricted && (
              <Badge className="bg-red-100 text-red-700 text-[10px] font-medium flex items-center gap-1 shrink-0">
                <Lock className="w-2.5 h-2.5" />
                Restricted
              </Badge>
            )}
          </div>
        </div>

        <span className="text-xs text-muted-foreground w-24 shrink-0 hidden md:inline">{formatBytes(file.size)}</span>
        {file.confidentialityLevel ? (
          <Badge
            className={cn('max-w-32 shrink truncate text-[10px] hidden lg:inline-flex', getConfidentialityColor(file.confidentialityLevel))}
            title={getConfidentialityLabel(file.confidentialityLevel)}
          >
            {getConfidentialityLabel(file.confidentialityLevel)}
          </Badge>
        ) : (
          <span className="w-24 shrink-0 hidden lg:inline" />
        )}
        <span className="text-xs text-muted-foreground w-28 shrink-0 hidden sm:inline text-right">
          {file.updatedAt ? `${formatDistanceToNow(new Date(file.updatedAt))} ago` : '—'}
        </span>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-accent transition-colors" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            {menuContent(stop)}
          </DropdownMenu>
        </div>
      </div>
    )

  return (
    <FileContextMenu
      isRestricted={isRestricted}
      onOpen={onOpen}
      onPreview={onPreview}
      onCopy={onCopy}
      onCut={onCut}
      onPaste={onPaste}
      canPaste={canPaste}
      onDownload={onDownload}
      onShare={onShare}
      onDelete={onDelete}
      onMove={onMove}
      onRename={onRename}
      onVersions={onVersions}
      onProperties={onProperties}
    >
      {card}
    </FileContextMenu>
  )
}
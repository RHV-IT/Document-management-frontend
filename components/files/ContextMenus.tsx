'use client'

import React from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from '@/components/ui/context-menu'
import {
  FolderOpen,
  Edit3,
  Copy,
  CopyPlus,
  Scissors,
  Trash2,
  Download,
  Eye,
  FileInput,
  Share2,
  FileText,
  Move,
  History,
  ExternalLink,
  FolderArchive,
  Star,
  LayoutGrid,
  List,
  ArrowDownAZ,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FolderContextMenuProps {
  isSystemFolder: boolean
  isFavorite: boolean
  onOpen: () => void
  onOpenNewTab?: () => void
  onRename: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  canPaste: boolean
  onDelete: () => void
  onMove: () => void
  onDownloadZip?: () => void
  onToggleFavorite: () => void
  onProperties: () => void
  children: React.ReactNode
}

export function FolderContextMenu({
  isSystemFolder,
  isFavorite,
  onOpen,
  onOpenNewTab,
  onRename,
  onCopy,
  onCut,
  onPaste,
  canPaste,
  onDelete,
  onMove,
  onDownloadZip,
  onToggleFavorite,
  onProperties,
  children,
}: FolderContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onOpen}>
          <FolderOpen className="w-4 h-4 mr-2" />
          Open
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        {onOpenNewTab && (
          <ContextMenuItem onClick={onOpenNewTab}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in new tab
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {!isSystemFolder && (
          <>
            <ContextMenuItem onClick={onRename}>
              <Edit3 className="w-4 h-4 mr-2" />
              Rename
              <ContextMenuShortcut>F2</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onMove}>
              <Move className="w-4 h-4 mr-2" />
              Move
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem onClick={onCopy}>
          <Copy className="w-4 h-4 mr-2" />
          Copy
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
        {!isSystemFolder && (
          <ContextMenuItem onClick={onCut}>
            <Scissors className="w-4 h-4 mr-2" />
            Cut
            <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={onPaste} disabled={!canPaste}>
          <FileInput className="w-4 h-4 mr-2" />
          Paste
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        {onDownloadZip && (
          <ContextMenuItem onClick={onDownloadZip}>
            <FolderArchive className="w-4 h-4 mr-2" />
            Download as .zip
          </ContextMenuItem>
        )}
        <ContextMenuItem>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </ContextMenuItem>
        <ContextMenuItem onClick={onToggleFavorite}>
          <Star className={cn('w-4 h-4 mr-2', isFavorite && 'fill-current text-yellow-500')} />
          {isFavorite ? 'Remove from Starred' : 'Add to Starred'}
        </ContextMenuItem>
        {!isSystemFolder && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onProperties}>
          <FileText className="w-4 h-4 mr-2" />
          Properties
          <ContextMenuShortcut>Alt+Enter</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface FileContextMenuProps {
  isRestricted: boolean
  onOpen: () => void
  onPreview: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  canPaste: boolean
  onDownload: () => void
  onShare: () => void
  onDelete: () => void
  onMove: () => void
  onRename: () => void
  onVersions: () => void
  onProperties: () => void
  children: React.ReactNode
}

export function FileContextMenu({
  isRestricted,
  onOpen,
  onPreview,
  onCopy,
  onCut,
  onPaste,
  canPaste,
  onDownload,
  onShare,
  onDelete,
  onMove,
  onRename,
  onVersions,
  onProperties,
  children,
}: FileContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {!isRestricted && (
          <>
            <ContextMenuItem onClick={onPreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
              <ContextMenuShortcut>Space</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onOpen}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Open
              <ContextMenuShortcut>Enter</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
              <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={onRename}>
          <Edit3 className="w-4 h-4 mr-2" />
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onMove}>
          <Move className="w-4 h-4 mr-2" />
          Move
        </ContextMenuItem>
        <ContextMenuItem onClick={onCopy}>
          <Copy className="w-4 h-4 mr-2" />
          Copy
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onCut}>
          <Scissors className="w-4 h-4 mr-2" />
          Cut
          <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onPaste} disabled={!canPaste}>
          <FileInput className="w-4 h-4 mr-2" />
          Paste
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onVersions}>
          <History className="w-4 h-4 mr-2" />
          Versions
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onProperties}>
          <FileText className="w-4 h-4 mr-2" />
          Properties
          <ContextMenuShortcut>Alt+Enter</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface EmptyAreaContextMenuProps {
  onPaste: () => void
  onCreateFolder: () => void
  onUpload: () => void
  onBulkUpload: () => void
  hasClipboard: boolean
  canPaste: boolean
  viewMode: 'grid' | 'list' | 'details'
  onViewModeChange: (mode: 'grid' | 'list' | 'details') => void
  sortBy: string
  onSortChange: (sort: string) => void
  children: React.ReactNode
}

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'modified', label: 'Date Modified' },
  { value: 'size', label: 'Size' },
  { value: 'type', label: 'Type' },
  { value: 'confidentiality', label: 'Confidentiality' },
] as const

export function EmptyAreaContextMenu({
  onPaste,
  onCreateFolder,
  onUpload,
  onBulkUpload,
  hasClipboard,
  canPaste,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  children,
}: EmptyAreaContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onCreateFolder}>
          <FolderOpen className="w-4 h-4 mr-2" />
          New Folder
          <ContextMenuShortcut>Ctrl+Shift+N</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onUpload}>
          <FileInput className="w-4 h-4 mr-2" />
          Upload Files
          <ContextMenuShortcut>Ctrl+U</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onBulkUpload}>
          <CopyPlus className="w-4 h-4 mr-2" />
          Bulk Upload
        </ContextMenuItem>
        {hasClipboard && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onPaste} disabled={!canPaste}>
              <FileInput className="w-4 h-4 mr-2" />
              Paste
              <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <ArrowDownAZ className="w-3.5 h-3.5" /> Sort by
        </div>
        {SORT_OPTIONS.map((option) => (
          <ContextMenuItem key={option.value} className="pl-6" onClick={() => onSortChange(option.value)}>
            {sortBy === option.value && <span className="mr-2 text-primary">✓</span>}
            {option.label}
          </ContextMenuItem>
        ))}
        <ContextMenuSeparator />
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <LayoutGrid className="w-3.5 h-3.5" /> View
        </div>
        <ContextMenuItem className="pl-6" onClick={() => onViewModeChange('grid')}>
          {viewMode === 'grid' && <span className="mr-2 text-primary">✓</span>}
          Grid
        </ContextMenuItem>
        <ContextMenuItem className="pl-6" onClick={() => onViewModeChange('list')}>
          {viewMode === 'list' && <span className="mr-2 text-primary">✓</span>}
          List
        </ContextMenuItem>
        <ContextMenuItem className="pl-6" onClick={() => onViewModeChange('details')}>
          {viewMode === 'details' && <span className="mr-2 text-primary">✓</span>}
          Details
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
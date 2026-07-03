'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { FolderOpen, File, Upload, Search, Trash2, Archive, Share2, Inbox, ScanLine } from 'lucide-react'

interface EmptyStateProps {
  type: 'no-files' | 'no-folders' | 'no-results' | 'no-shared' | 'no-scanned' | 'no-pending' | 'no-archive' | 'recycle-bin' | 'drag-drop'
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
}

const emptyStateConfigs = {
  'no-files': {
    icon: FolderOpen,
    title: 'No files here yet',
    description: 'Drag and drop files here, or click Upload to get started',
    defaultActionLabel: 'Upload Files',
  },
  'no-folders': {
    icon: FolderOpen,
    title: 'No folders yet',
    description: 'Create a folder to start organizing your files',
    defaultActionLabel: 'New Folder',
  },
  'no-results': {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filters',
    defaultActionLabel: 'Clear Filters',
  },
  'no-shared': {
    icon: Share2,
    title: 'Nothing shared yet',
    description: 'Files shared with you, or by you, will appear here',
  },
  'no-scanned': {
    icon: ScanLine,
    title: 'No scanned files yet',
    description: 'Files uploaded via scanner will appear here',
  },
  'no-pending': {
    icon: Inbox,
    title: 'No pending scans',
    description: "You're all caught up — new scans awaiting confirmation will show here",
  },
  'no-archive': {
    icon: Archive,
    title: 'No archived files',
    description: 'Archived documents will appear here',
  },
  'recycle-bin': {
    icon: Trash2,
    title: 'Recycle bin is empty',
    description: 'Deleted files stay here for 30 days before permanent removal',
  },
  'drag-drop': {
    icon: Upload,
    title: 'Drop files to upload',
    description: 'Release to start uploading your files',
  },
} as const

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  const config = emptyStateConfigs[type]
  const Icon = config.icon
  const defaultActionLabel = 'defaultActionLabel' in config ? config.defaultActionLabel : undefined

  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-10 text-muted-foreground', className)}>
      <div className="mb-5">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-primary/5 rounded-full blur-xl" />
          <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary/60" />
          </div>
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title || config.title}</h3>
      <p className="text-sm max-w-xs mx-auto mb-5">{description || config.description}</p>
      <div className="flex flex-col sm:flex-row gap-2.5">
        {(actionLabel || defaultActionLabel) && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {actionLabel || defaultActionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

interface DragOverlayProps {
  isActive: boolean
  onDrop: (files: FileList) => void
}

export function DragOverlay({ isActive, onDrop }: DragOverlayProps) {
  if (!isActive) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-primary pointer-events-none"
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDrop(e.dataTransfer.files)
      }}
    >
      <div className="text-center pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <Upload className="h-16 w-16 text-primary relative" />
        </div>
        <p className="text-xl font-semibold text-primary mb-2">Drop files here to upload</p>
        <p className="text-muted-foreground">Supports multiple files and folders</p>
      </div>
    </div>
  )
}

/** Row/card skeletons used while the current view is loading (no spinners, per spec). */
export function FileGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
          <div className="aspect-4/3 bg-muted" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function FileRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-9 w-9 bg-muted rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-muted rounded w-1/3" />
          </div>
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-20" />
        </div>
      ))}
    </div>
  )
}
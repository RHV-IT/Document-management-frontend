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
  Scissors,
  Trash2,
  Download,
  Eye,
  FolderInput,
} from 'lucide-react'

interface FolderContextMenuProps {
  folderId: string
  folderName: string
  isSystemFolder: boolean
  onOpen: () => void
  onRename: () => void
  onCopy: () => void
  onCut: () => void
  onDelete: () => void
  children: React.ReactNode
}

export function FolderContextMenu({
  folderId,
  folderName,
  isSystemFolder,
  onOpen,
  onRename,
  onCopy,
  onCut,
  onDelete,
  children,
}: FolderContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onOpen}>
          <FolderOpen className="w-4 h-4 mr-2" />
          Open
        </ContextMenuItem>
        {!isSystemFolder && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onRename}>
              <Edit3 className="w-4 h-4 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={onCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </ContextMenuItem>
            <ContextMenuItem onClick={onCut}>
              <Scissors className="w-4 h-4 mr-2" />
              Cut
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface FileContextMenuProps {
  fileId: string
  fileName: string
  onOpen: () => void
  onCopy: () => void
  onCut: () => void
  onDownload: () => void
  onDelete: () => void
  children: React.ReactNode
}

export function FileContextMenu({
  fileId,
  fileName,
  onOpen,
  onCopy,
  onCut,
  onDownload,
  onDelete,
  children,
}: FileContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onOpen}>
          <Eye className="w-4 h-4 mr-2" />
          Open
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onCopy}>
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={onCut}>
          <Scissors className="w-4 h-4 mr-2" />
          Cut
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface EmptyAreaContextMenuProps {
  currentFolderId: string | null
  onPaste: () => void
  onCreateFolder: () => void
  onUpload: () => void
  hasClipboard: boolean
  children: React.ReactNode
}

export function EmptyAreaContextMenu({
  currentFolderId,
  onPaste,
  onCreateFolder,
  onUpload,
  hasClipboard,
  children,
}: EmptyAreaContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onCreateFolder}>
          <FolderOpen className="w-4 h-4 mr-2" />
          New Folder
        </ContextMenuItem>
        <ContextMenuItem onClick={onUpload}>
          <FolderInput className="w-4 h-4 mr-2" />
          Upload Files
        </ContextMenuItem>
        {hasClipboard && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onPaste}>
              <Copy className="w-4 h-4 mr-2" />
              Paste
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

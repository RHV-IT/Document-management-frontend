'use client'

import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFolderTreeQuery } from '@/hooks/useFolders'

interface TreeNode {
  _id: string
  name: string
  parentFolderId: string | null
  isSystemFolder: boolean
  children: TreeNode[]
}

interface FolderTreeItemProps {
  node: TreeNode
  level: number
  selectedFolderId: string | null
  expandedFolders: Set<string>
  onToggle: (folderId: string) => void
  onSelect: (folderId: string) => void
  onContextMenu: (e: React.MouseEvent, folderId: string) => void
}

function FolderTreeItem({
  node,
  level,
  selectedFolderId,
  expandedFolders,
  onToggle,
  onSelect,
  onContextMenu,
}: FolderTreeItemProps) {
  const isExpanded = expandedFolders.has(node._id)
  const isSelected = selectedFolderId === node._id
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors',
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-accent/50 text-sidebar-foreground'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelect(node._id)}
        onContextMenu={(e) => onContextMenu(e, node._id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggle(node._id)
          }}
          className={cn(
            'w-4 h-4 flex items-center justify-center flex-shrink-0',
            !hasChildren && 'invisible'
          )}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )
          )}
        </button>

        {isExpanded && hasChildren ? (
          <FolderOpen className="w-4 h-4 flex-shrink-0 text-amber-500" />
        ) : (
          <Folder className="w-4 h-4 flex-shrink-0 text-amber-500" />
        )}

        <span className="text-sm truncate flex-1">{node.name}</span>

        {node.isSystemFolder && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
            System
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderTreeItem
              key={child._id}
              node={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
              onToggle={onToggle}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function buildTree(folders: any[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  folders.forEach((folder) => {
    map.set(folder._id, {
      _id: folder._id,
      name: folder.name,
      parentFolderId: folder.parentFolderId,
      isSystemFolder: folder.isSystemFolder,
      children: [],
    })
  })

  folders.forEach((folder) => {
    const node = map.get(folder._id)!
    if (folder.parentFolderId && map.has(folder.parentFolderId)) {
      map.get(folder.parentFolderId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

interface FolderSidebarProps {
  selectedFolderId: string | null
  onFolderSelect: (folderId: string | null) => void
  onCreateFolder: (parentFolderId?: string | null) => void
  onRenameFolder: (folderId: string) => void
  onDeleteFolder: (folderId: string) => void
  onMoveFolder: (folderId: string) => void
}

export function FolderSidebar({
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder,
}: FolderSidebarProps) {
  const { data: folderTree, isLoading } = useFolderTreeQuery()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [contextMenuFolder, setContextMenuFolder] = useState<string | null>(null)

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent, folderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenuFolder(folderId)
  }, [])

  const tree = folderTree ? buildTree(folderTree) : []

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
        <span className="text-sm font-semibold text-sidebar-foreground">Folders</span>
        <button
          onClick={() => onCreateFolder(selectedFolderId)}
          className="p-1 rounded hover:bg-accent transition-colors"
          title="New Folder"
        >
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors mb-1',
            selectedFolderId === null
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-accent/50 text-sidebar-foreground'
          )}
          onClick={() => onFolderSelect(null)}
        >
          <Folder className="w-4 h-4 text-amber-500" />
          <span className="text-sm">All Files</span>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-4 flex-1" style={{ maxWidth: `${60 + Math.random() * 40}%` }} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && tree.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No folders yet</p>
            <button
              onClick={() => onCreateFolder(null)}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Create your first folder
            </button>
          </div>
        )}

        {tree.map((node) => (
          <DropdownMenu
            key={node._id}
            open={contextMenuFolder === node._id}
            onOpenChange={(open) => setContextMenuFolder(open ? node._id : null)}
          >
            <DropdownMenuTrigger asChild>
              <div />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem onClick={() => onFolderSelect(node._id)}>
                Open
              </DropdownMenuItem>
              {!node.isSystemFolder && (
                <>
                  <DropdownMenuItem onClick={() => onRenameFolder(node._id)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMoveFolder(node._id)}>
                    Move
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteFolder(node._id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}

        {tree.map((node) => (
          <FolderTreeItem
            key={`tree-${node._id}`}
            node={node}
            level={0}
            selectedFolderId={selectedFolderId}
            expandedFolders={expandedFolders}
            onToggle={toggleFolder}
            onSelect={onFolderSelect}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>
    </div>
  )
}

export default FolderSidebar

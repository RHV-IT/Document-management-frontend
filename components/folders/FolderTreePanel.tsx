'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Folder, FolderOpen, ChevronRight, ChevronDown, Plus, Home, Star, Clock, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useFolderTreeQuery } from '@/hooks/useFolders'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu'

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
  onOpenCreate: (parentFolderId: string) => void
  isFavorite: boolean
  onToggleFavorite: (folderId: string) => void
}

function FolderTreeItem({
  node,
  level,
  selectedFolderId,
  expandedFolders,
  onToggle,
  onSelect,
  onOpenCreate,
  isFavorite,
  onToggleFavorite,
}: FolderTreeItemProps) {
  const isExpanded = expandedFolders.has(node._id)
  const isSelected = selectedFolderId === node._id
  const hasChildren = node.children.length > 0

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div>
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors',
              isSelected
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent/50 text-sidebar-foreground'
            )}
            style={{ paddingLeft: `${level * 14 + 8}px` }}
            onClick={() => onSelect(node._id)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (hasChildren) onToggle(node._id)
              }}
              className={cn(
                'w-4 h-4 flex items-center justify-center flex-shrink-0 hover:bg-muted rounded',
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

            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(node._id)
              }}
              className={cn(
                'p-0.5 rounded transition-colors',
                isFavorite ? 'text-yellow-500' : 'text-muted-foreground opacity-0 group-hover:opacity-100'
              )}
            >
              <Star className="w-3 h-3" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>

            {node.isSystemFolder && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium leading-none">
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
                  onOpenCreate={onOpenCreate}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onSelect(node._id)}>Open</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onOpenCreate(node._id)}>New Subfolder</ContextMenuItem>
        <ContextMenuItem onClick={() => onToggleFavorite(node._id)}>
          {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </ContextMenuItem>
        {!node.isSystemFolder && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem className="text-destructive">Delete</ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

function buildTree(folders: any[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  if (!folders || !Array.isArray(folders)) return roots

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

interface FolderTreePanelProps {
  selectedFolderId: string | null
  onFolderSelect: (folderId: string | null) => void
  onCreateFolder: (parentFolderId?: string | null) => void
  isExpanded: boolean
  onToggleExpanded: () => void
  favoriteFolders: Set<string>
  onToggleFavorite: (folderId: string) => void
  recentFolders: string[]
}

export function FolderTreePanel({
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  isExpanded,
  onToggleExpanded,
  favoriteFolders,
  onToggleFavorite,
  recentFolders,
}: FolderTreePanelProps) {
  const { data: folderTree, isLoading } = useFolderTreeQuery()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

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

  const tree = useMemo(() => buildTree(folderTree || []), [folderTree])

  const favoriteNodes = useMemo(() => {
    const findFavorites = (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = []
      for (const node of nodes) {
        if (favoriteFolders.has(node._id)) {
          result.push(node)
        }
        if (node.children.length > 0) {
          result.push(...findFavorites(node.children))
        }
      }
      return result
    }
    return findFavorites(tree)
  }, [tree, favoriteFolders])

  return (
    <div className="border-b bg-muted/30">
      <div className="px-4 py-2 flex items-center justify-between border-b bg-card">
        <button
          onClick={onToggleExpanded}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Folders
        </button>
        <button
          onClick={() => onCreateFolder(selectedFolderId)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title="New Folder"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-2 max-h-80 overflow-y-auto">
          <button
            onClick={() => onFolderSelect(null)}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors',
              selectedFolderId === null
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-accent/50 text-foreground'
            )}
          >
            <Home className="w-4 h-4 text-muted-foreground" />
            <span>All Files</span>
          </button>

          {/* Favorites Section */}
          {favoriteNodes.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground">
                <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
                Favorites
              </div>
              {favoriteNodes.map((node) => (
                <FolderTreeItem
                  key={`fav-${node._id}`}
                  node={node}
                  level={0}
                  selectedFolderId={selectedFolderId}
                  expandedFolders={expandedFolders}
                  onToggle={toggleFolder}
                  onSelect={onFolderSelect}
                  onOpenCreate={onCreateFolder}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )}

          {/* Recent Section */}
          {recentFolders.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground">
                <Clock className="w-3 h-3" />
                Recent
              </div>
              {recentFolders.slice(0, 5).map((folderId) => {
                const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
                  for (const node of nodes) {
                    if (node._id === id) return node
                    const found = findNode(node.children, id)
                    if (found) return found
                  }
                  return null
                }
                const node = findNode(tree, folderId)
                if (!node) return null
                return (
                  <FolderTreeItem
                    key={`recent-${node._id}`}
                    node={node}
                    level={0}
                    selectedFolderId={selectedFolderId}
                    expandedFolders={expandedFolders}
                    onToggle={toggleFolder}
                    onSelect={onFolderSelect}
                    onOpenCreate={onCreateFolder}
                    isFavorite={favoriteFolders.has(node._id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                )
              })}
            </div>
          )}

          <div className="border-t my-2" />

          {isLoading && (
            <div className="space-y-1 mt-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-4 flex-1 max-w-[120px]" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && tree.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Folder className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No folders yet</p>
              <button
                onClick={() => onCreateFolder(null)}
                className="mt-1 text-xs text-primary hover:underline"
              >
                Create folder
              </button>
            </div>
          )}

          {/* All Folders */}
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground">
            <Folder className="w-3 h-3" />
            All Folders
          </div>
          {tree.map((node) => (
            <FolderTreeItem
              key={node._id}
              node={node}
              level={0}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
              onToggle={toggleFolder}
              onSelect={onFolderSelect}
              onOpenCreate={onCreateFolder}
              isFavorite={favoriteFolders.has(node._id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default FolderTreePanel

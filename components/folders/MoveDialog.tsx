'use client'

import React, { useState } from 'react'
import { useFolderTreeQuery, useMoveFolderMutation, useMoveFileToFolderMutation } from '@/hooks/useFolders'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Folder, FolderOpen, ChevronRight, ChevronDown, Ban } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface MoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'folder' | 'file'
  itemId: string
  itemName: string
}

interface TreeNode {
  _id: string
  name: string
  parentFolderId: string | null
  isSystemFolder: boolean
  children: TreeNode[]
}

interface FolderOptionProps {
  node: TreeNode
  level: number
  selectedId: string | null
  excludedIds: Set<string>
  expandedFolders: Set<string>
  onToggle: (folderId: string) => void
  onSelect: (folderId: string) => void
}

function FolderOption({
  node,
  level,
  selectedId,
  excludedIds,
  expandedFolders,
  onToggle,
  onSelect,
}: FolderOptionProps) {
  const isExpanded = expandedFolders.has(node._id)
  const isSelected = selectedId === node._id
  const isExcluded = excludedIds.has(node._id)
  const hasChildren = node.children.length > 0

  if (isExcluded) return null

  return (
    <div>
      <button
        type="button"
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors',
          isSelected
            ? 'bg-primary/10 text-primary ring-2 ring-primary'
            : 'hover:bg-accent/50 text-foreground'
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onSelect(node._id)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node._id)
            }}
            className="p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        {isExpanded && hasChildren ? (
          <FolderOpen className={cn("w-4 h-4", isSelected ? "text-primary" : "text-amber-500")} />
        ) : (
          <Folder className={cn("w-4 h-4", isSelected ? "text-primary" : "text-amber-500")} />
        )}
        <span className={cn("text-sm truncate", isSelected && "font-semibold")}>{node.name}</span>
        {isSelected && (
          <span className="ml-auto text-xs bg-primary text-white px-2 py-0.5 rounded">Selected</span>
        )}
      </button>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderOption
              key={child._id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              excludedIds={excludedIds}
              expandedFolders={expandedFolders}
              onToggle={onToggle}
              onSelect={onSelect}
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

function findFolderName(nodes: TreeNode[], targetId: string): string | null {
  for (const node of nodes) {
    if (node._id === targetId) {
      return node.name
    }
    if (node.children.length > 0) {
      const found = findFolderName(node.children, targetId)
      if (found) return found
    }
  }
  return null
}

export function MoveDialog({
  open,
  onOpenChange,
  type,
  itemId,
  itemName,
}: MoveDialogProps) {
  const { data: folderTree } = useFolderTreeQuery()
  const moveFolderMutation = useMoveFolderMutation()
  const moveFileMutation = useMoveFileToFolderMutation()

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const tree = folderTree ? buildTree(folderTree) : []

  const excludedIds = new Set<string>()
  if (type === 'folder') {
    excludedIds.add(itemId)
    const addChildren = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        excludedIds.add(node._id)
        addChildren(node.children)
      })
    }
    const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
      for (const node of nodes) {
        if (node._id === id) return node
        const found = findNode(node.children, id)
        if (found) return found
      }
      return null
    }
    const node = findNode(tree, itemId)
    if (node) addChildren(node.children)
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handleMove = async () => {
    try {
      if (type === 'folder') {
        await moveFolderMutation.mutateAsync({
          folderId: itemId,
          targetFolderId: selectedFolderId,
        })
      } else {
        await moveFileMutation.mutateAsync({
          fileId: itemId,
          folderId: selectedFolderId,
        })
      }
      onOpenChange(false)
    } catch (err) {
      console.error('Move failed:', err)
    }
  }

  const isLoading = type === 'folder' ? moveFolderMutation.isPending : moveFileMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move {type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
          <DialogDescription>
            Select a destination for &quot;{itemName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Destination</Label>
          <ScrollArea className="h-64 border rounded-lg p-2">
             <button
               type="button"
               className={cn(
                 'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors',
                 selectedFolderId === null
                   ? 'bg-primary/10 text-primary'
                   : 'hover:bg-accent/50 text-foreground'
               )}
               onClick={() => setSelectedFolderId(null)}
             >
               <Ban className="w-4 h-4 text-muted-foreground" />
               <span className="text-sm">Root Level (No Folder)</span>
             </button>

             {tree.map((node) => (
               <FolderOption
                 key={node._id}
                 node={node}
                 level={0}
                 selectedId={selectedFolderId}
                 excludedIds={excludedIds}
                 expandedFolders={expandedFolders}
                 onToggle={toggleFolder}
                 onSelect={setSelectedFolderId}
               />
             ))}
           </ScrollArea>
         </div>

         {/* Selected Destination Display */}
         <div className="bg-muted/50 rounded-lg p-3 border">
           <div className="flex items-center gap-2">
             <Folder className="w-4 h-4 text-amber-500" />
             <span className="text-sm font-medium">
               {selectedFolderId 
                 ? findFolderName(tree, selectedFolderId) || 'Unknown Folder'
                 : 'Root Level'
               }
             </span>
           </div>
         </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={isLoading}
          >
            {isLoading ? 'Moving...' : 'Move Here'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MoveDialog

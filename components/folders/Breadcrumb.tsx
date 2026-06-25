'use client'

import React from 'react'
import { useFolderTreeQuery } from '@/hooks/useFolders'
import { ChevronRight, Home, Folder } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface BreadcrumbProps {
  currentFolderId: string | null
  onNavigate: (folderId: string | null) => void
}

export function Breadcrumb({ currentFolderId, onNavigate }: BreadcrumbProps) {
  const { data: folderTree, isLoading } = useFolderTreeQuery()

  const path = useMemo(() => {
    if (!currentFolderId || !folderTree) return []

    const findPath = (folders: any[], targetId: string, currentPath: any[] = []): any[] | null => {
      for (const folder of folders) {
        if (folder._id === targetId) {
          return [...currentPath, folder]
        }
        if (folder.children && folder.children.length > 0) {
          const found = findPath(folder.children, targetId, [...currentPath, folder])
          if (found) return found
        }
      }
      return null
    }

    return findPath(folderTree, currentFolderId) || []
  }, [currentFolderId, folderTree])

  if (!currentFolderId) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-sm">
        <Skeleton className="h-4 w-16" />
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
        <Skeleton className="h-4 w-20" />
      </div>
    )
  }

  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto">
      <button
        onClick={() => onNavigate(null)}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors',
          'text-muted-foreground hover:text-foreground'
        )}
      >
        <Home className="w-3.5 h-3.5" />
        <span>All Files</span>
      </button>

      {path.map((folder, index) => (
        <React.Fragment key={folder._id}>
          <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <button
            onClick={() => onNavigate(folder._id)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors flex-shrink-0',
              index === path.length - 1
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate max-w-[150px]">{folder.name}</span>
          </button>
        </React.Fragment>
      ))}
    </nav>
  )
}

export default Breadcrumb

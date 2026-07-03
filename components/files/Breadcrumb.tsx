'use client'

import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useFolderTreeQuery } from '@/hooks/useFolders'
import { ChevronRight, Home, Folder, MoreHorizontal } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface BreadcrumbProps {
  currentFolderId: string | null
  onNavigate: (folderId: string | null) => void
  onCreateFolder?: (parentFolderId: string | null) => void
}

export function Breadcrumb({ currentFolderId, onNavigate, onCreateFolder }: BreadcrumbProps) {
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
    return (
      <nav className="flex items-center gap-1.5 h-9 px-3 text-sm" aria-label="Breadcrumb">
        <Home className="w-3.5 h-3.5 text-primary" />
        <span className="font-medium text-foreground">My Drive</span>
      </nav>
    )
  }

  if (isLoading) {
    return (
      <nav className="flex items-center gap-1 h-9 px-3 overflow-x-auto" aria-label="Breadcrumb">
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-20" />
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Skeleton className="h-8 w-24" />
        </div>
      </nav>
    )
  }

  const visiblePath = path.length > 5 ? path.slice(path.length - 4) : path
  const truncated = path.length > 5

  return (
    <nav className="flex items-center gap-1 h-9 px-3 overflow-x-auto" aria-label="Breadcrumb">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 shrink-0" onClick={() => onNavigate(null)}>
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Drive</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem className="flex items-center gap-2" onClick={() => onNavigate(null)}>
            <Home className="w-4 h-4" />
            My Drive
          </DropdownMenuItem>
          {onCreateFolder && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2" onClick={() => onCreateFolder(null)}>
                <Folder className="w-4 h-4" />
                New Folder Here
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {truncated && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Show more path segments">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </>
      )}

      {visiblePath.map((folder, index) => {
        const isLast = index === visiblePath.length - 1
        return (
          <React.Fragment key={folder._id}>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isLast ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('h-8 px-2 gap-1.5 shrink-0 truncate max-w-45', isLast && 'font-medium')}
                  onClick={() => onNavigate(folder._id)}
                >
                  <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem className="flex items-center gap-2" onClick={() => onNavigate(folder._id)}>
                  <Folder className="w-4 h-4" />
                  Open
                </DropdownMenuItem>
                {onCreateFolder && !folder.isSystemFolder && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => onCreateFolder(folder._id)}>
                      <Folder className="w-4 h-4" />
                      New Subfolder
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
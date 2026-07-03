'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, RotateCcw, File } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface DeletedFile {
  fileId: string
  name: string
  deletedAt: string
  permanentDeleteAt: string
  deletedBy: { name: string; email: string }
}

interface RecycleBinViewProps {
  files: DeletedFile[]
  onRestore: (fileId: string) => void
  onPermanentDelete: (fileId: string, name: string) => void
  isMutating?: boolean
}

export function RecycleBinView({ files, onRestore, onPermanentDelete, isMutating }: RecycleBinViewProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead className="sticky top-0 bg-card z-10 border-b">
        <tr>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Name</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Deleted By</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Deleted</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Permanently Removed</th>
          <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => (
          <tr key={file.fileId} className="border-b border-border/40 hover:bg-accent/40 transition-colors">
            <td className="px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <File className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate font-medium">{file.name}</span>
              </div>
            </td>
            <td className="px-3 py-2 text-muted-foreground truncate">{file.deletedBy?.name || '—'}</td>
            <td className="px-3 py-2 text-muted-foreground">
              {file.deletedAt ? `${formatDistanceToNow(new Date(file.deletedAt))} ago` : '—'}
            </td>
            <td className={cn('px-3 py-2 text-muted-foreground')}>
              {file.permanentDeleteAt ? `${formatDistanceToNow(new Date(file.permanentDeleteAt))}` : '—'}
            </td>
            <td className="px-3 py-2">
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5"
                  disabled={isMutating}
                  onClick={() => onRestore(file.fileId)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isMutating}
                  onClick={() => onPermanentDelete(file.fileId, file.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Forever
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default RecycleBinView

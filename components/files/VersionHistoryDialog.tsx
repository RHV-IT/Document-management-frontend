'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { History, RotateCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { formatBytes } from '@/lib/utils'
import { useVersionHistoryQuery, useRollbackVersionMutation } from '@/hooks/useFiles'
import { FileItem } from '@/services/api/files'

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem | null
}

export function VersionHistoryDialog({ open, onOpenChange, file }: VersionHistoryDialogProps) {
  const { data: versions, isLoading } = useVersionHistoryQuery(file?.fileId || '')
  const rollbackMutation = useRollbackVersionMutation()

  if (!file) return null

  const displayName = file.alias || file.name
  const sorted = [...(versions || [])].sort((a, b) => b.versionNumber - a.versionNumber)
  const currentVersion = sorted[0]?.versionNumber

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Version History</DialogTitle>
              <DialogDescription className="truncate">{displayName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-72">
          <div className="space-y-1 pr-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading versions...</p>
            ) : sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No version history for this file</p>
            ) : (
              sorted.map((v) => (
                <div key={v.versionNumber} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent/40">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Version {v.versionNumber}</span>
                      {v.versionNumber === currentVersion && (
                        <Badge variant="secondary" className="text-[10px]">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {v.uploadedBy?.name || 'Unknown'} · {formatBytes(v.size)} ·{' '}
                      {v.createdAt ? `${formatDistanceToNow(new Date(v.createdAt))} ago` : '—'}
                    </p>
                  </div>
                  {v.versionNumber !== currentVersion && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 shrink-0"
                      disabled={rollbackMutation.isPending}
                      onClick={() => rollbackMutation.mutate({ fileId: file.fileId, versionNumber: v.versionNumber })}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default VersionHistoryDialog

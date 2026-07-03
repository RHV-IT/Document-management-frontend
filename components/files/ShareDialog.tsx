'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Share2, X, UserRound } from 'lucide-react'
import { useUsersQuery } from '@/hooks/useUsers'
import { useFilePermissionsQuery, useShareFileMutation, useRevokePermissionMutation } from '@/hooks/useFiles'
import { FileItem } from '@/services/api/files'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem | null
}

const ACCESS_LEVELS = [
  { value: 'view', label: 'Can view' },
  { value: 'download', label: 'Can download' },
  { value: 'edit', label: 'Can edit' },
] as const

export function ShareDialog({ open, onOpenChange, file }: ShareDialogProps) {
  const [search, setSearch] = useState('')
  const [access, setAccess] = useState<'view' | 'download' | 'edit'>('view')

  const { data: usersData } = useUsersQuery({ search: search || undefined, limit: 10 })
  const { data: permissions } = useFilePermissionsQuery(file?.fileId || '')
  const shareMutation = useShareFileMutation()
  const revokeMutation = useRevokePermissionMutation()

  if (!file) return null

  const displayName = file.alias || file.name
  const sharedUserIds = new Set((permissions || []).filter((p) => !p.isRevoked).map((p) => p.userId?._id).filter(Boolean) as string[])
  const candidates = (usersData?.users || []).filter((u) => !sharedUserIds.has(u._id || u.id || ''))

  const handleShare = (userId: string) => {
    shareMutation.mutate({ fileId: file.fileId, userId, access })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Share &quot;{displayName}&quot;</DialogTitle>
              <DialogDescription>Grant people access to this file</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search people by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={access} onValueChange={(v) => setAccess(v as typeof access)}>
              <SelectTrigger className="w-36 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {search && (
            <ScrollArea className="h-40 border rounded-lg">
              <div className="p-1">
                {candidates.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No matching people</p>
                ) : (
                  candidates.map((u) => (
                    <button
                      key={u._id || u.id}
                      type="button"
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left hover:bg-accent/50 transition-colors"
                      onClick={() => handleShare(u._id || u.id || '')}
                      disabled={shareMutation.isPending}
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {u.name?.[0]?.toUpperCase() || <UserRound className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">People with access</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {(permissions || []).filter((p) => !p.isRevoked).length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Only you have access</p>
              ) : (
                (permissions || [])
                  .filter((p) => !p.isRevoked)
                  .map((p) => (
                    <div key={p._id} className="flex items-center gap-2 px-1 py-1.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {p.userId?.name?.[0]?.toUpperCase() || <UserRound className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.userId?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.userId?.email}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {p.access}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => revokeMutation.mutate(p._id)}
                        disabled={revokeMutation.isPending}
                        title="Revoke access"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShareDialog

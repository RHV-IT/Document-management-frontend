'use client'

import React, { useState, useEffect } from 'react'
import { useUpdateFolderMutation, useFolderQuery } from '@/hooks/useFolders'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit3 } from 'lucide-react'

interface RenameFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId: string
}

export function RenameFolderDialog({
  open,
  onOpenChange,
  folderId,
}: RenameFolderDialogProps) {
  const { data: folder } = useFolderQuery(folderId)
  const updateFolderMutation = useUpdateFolderMutation()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (folder) {
      setName(folder.name)
    }
  }, [folder])

  useEffect(() => {
    if (open) {
      setError('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Folder name is required')
      return
    }

    if (name.length > 255) {
      setError('Folder name must be less than 255 characters')
      return
    }

    try {
      await updateFolderMutation.mutateAsync({
        folderId,
        payload: { name: name.trim() },
      })
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to rename folder')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Edit3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Rename Folder</DialogTitle>
              <DialogDescription>
                Enter a new name for &quot;{folder?.name}&quot;
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rename-folder">Folder Name</Label>
            <Input
              id="rename-folder"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              autoFocus
              maxLength={255}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateFolderMutation.isPending || !name.trim()}
            >
              {updateFolderMutation.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RenameFolderDialog

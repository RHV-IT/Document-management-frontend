'use client'

import React, { useState, useEffect } from 'react'
import { useRenameFileMutation } from '@/hooks/useFiles'
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

interface RenameFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string
  currentName: string
}

export function RenameFileDialog({ open, onOpenChange, fileId, currentName }: RenameFileDialogProps) {
  const renameFileMutation = useRenameFileMutation()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(currentName)
      setError('')
    }
  }, [open, currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('File name is required')
      return
    }

    if (name.length > 255) {
      setError('File name must be less than 255 characters')
      return
    }

    try {
      await renameFileMutation.mutateAsync({ fileId, name: name.trim() })
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to rename file')
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
              <DialogTitle>Rename File</DialogTitle>
              <DialogDescription>Enter a new name for &quot;{currentName}&quot;</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rename-file">File Name</Label>
            <Input
              id="rename-file"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter file name"
              autoFocus
              maxLength={255}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={renameFileMutation.isPending || !name.trim()}>
              {renameFileMutation.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RenameFileDialog

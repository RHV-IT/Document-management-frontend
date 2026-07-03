'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAccessControl } from '@/hooks/useAccessControl'
import { useCreateFolderMutation } from '@/hooks/useFolders'
import { useConfidentialityLevelsConfigQuery } from '@/hooks/useSettings'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FolderPlus } from 'lucide-react'

interface CreateFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentFolderId?: string | null
  parentFolderName?: string
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentFolderId = null,
  parentFolderName,
}: CreateFolderDialogProps) {
  const { user } = useAuth()
  const { allowedLevels } = useAccessControl()
  const { data: configData } = useConfidentialityLevelsConfigQuery()
  const createFolderMutation = useCreateFolderMutation()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [confidentialityLevel, setConfidentialityLevel] = useState('internal')
  const [error, setError] = useState('')

  const confidentialityLevels = configData && configData.length > 0
    ? configData
    : [
      { value: 'public', label: 'Public' },
      { value: 'internal', label: 'Internal' },
      { value: 'confidential', label: 'Confidential' },
      { value: 'highly_confidential', label: 'Highly Confidential' },
    ]

  const filteredLevels = confidentialityLevels.filter((level: { value: string; label: string }) =>
    allowedLevels.includes(level.value as any)
  )

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setConfidentialityLevel('internal')
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
      await createFolderMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        parentFolderId,
        confidentialityLevel,
      })
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create folder')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <FolderPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>New Folder</DialogTitle>
              <DialogDescription>
                {parentFolderName
                  ? `Create a folder inside "${parentFolderName}"`
                  : 'Create a new folder at the root level'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name *</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              autoFocus
              maxLength={255}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-description">Description</Label>
            <Textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this folder"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-confidentiality">Confidentiality Level</Label>
            <Select value={confidentialityLevel} onValueChange={setConfidentialityLevel}>
              <SelectTrigger id="folder-confidentiality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filteredLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={createFolderMutation.isPending || !name.trim()}
            >
              {createFolderMutation.isPending ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateFolderDialog

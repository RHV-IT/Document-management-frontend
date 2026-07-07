'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ConfidentialityLevelSelect } from '@/components/ui/ConfidentialityLevelSelect'
import { UploadCloud, X, Loader2, CheckCircle2, AlertCircle, FileUp } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { getFileIconElement } from '@/lib/file-utils'
import { useUploadFileMutation } from '@/hooks/useFiles'

interface QueuedFile {
  id: string
  file: File
  alias: string
  confidentialityLevel: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId?: string | null
  initialFiles?: FileList | File[] | null
}

function makeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export function UploadDialog({ open, onOpenChange, folderId, initialFiles }: UploadDialogProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: uploadFile } = useUploadFileMutation()

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).map((file) => ({
      id: makeId(),
      file,
      alias: file.name,
      confidentialityLevel: 'internal',
      status: 'pending' as const,
    }))
    setQueue((prev) => [...prev, ...incoming])
  }, [])

  useEffect(() => {
    if (open && initialFiles && initialFiles.length > 0) {
      addFiles(initialFiles)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFiles])

  const removeFile = (id: string) => setQueue((prev) => prev.filter((f) => f.id !== id))
  const updateFile = (id: string, patch: Partial<QueuedFile>) =>
    setQueue((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))

  const reset = () => {
    setQueue([])
    setIsUploading(false)
  }

  const handleClose = (next: boolean) => {
    if (!next && !isUploading) reset()
    onOpenChange(next)
  }

  const handleUploadAll = () => {
    const pending = queue.filter((f) => f.status === 'pending' || f.status === 'error')
    if (pending.length === 0) return
    setIsUploading(true)
    pending.forEach((qf) => updateFile(qf.id, { status: 'uploading', error: undefined }))

    let remaining = pending.length
    pending.forEach((qf) => {
      const formData = new FormData()
      formData.append('file', qf.file)
      if (qf.alias && qf.alias !== qf.file.name) formData.append('alias', qf.alias)
      formData.append('confidentialityLevel', qf.confidentialityLevel)
      if (folderId) formData.append('folderId', folderId)

      uploadFile(formData, {
        onSuccess: () => updateFile(qf.id, { status: 'success' }),
        onError: (err: any) => updateFile(qf.id, { status: 'error', error: err?.message || 'Upload failed' }),
        onSettled: () => {
          remaining -= 1
          if (remaining === 0) {
            setIsUploading(false)
            setQueue((prev) => {
              const stillFailing = prev.some((f) => f.status === 'error')
              if (!stillFailing) {
                onOpenChange(false)
                return []
              }
              return prev
            })
          }
        },
      })
    })
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const successCount = queue.filter((f) => f.status === 'success').length
  const total = queue.length
  const progressValue = total > 0 ? Math.round((successCount / total) * 100) : 0
  const hasUploadable = queue.some((f) => f.status === 'pending' || f.status === 'error')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-5 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <UploadCloud className="h-4 w-4 text-primary" />
            </div>
            Upload files
          </DialogTitle>
          <DialogDescription>Drag and drop, or browse — add as many files as you need.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4">
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files)
              e.target.value = ''
            }}
          />

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/30'
            )}
          >
            <div className={cn('p-3 rounded-full transition-colors', isDragging ? 'bg-primary/15' : 'bg-muted')}>
              <FileUp className={cn('h-6 w-6', isDragging ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <p className="text-sm font-medium">
              {isDragging ? 'Drop to add files' : 'Click to browse or drop files here'}
            </p>
            <p className="text-xs text-muted-foreground">Any file type, multiple files supported</p>
          </div>

          {queue.length > 0 && (
            <div className="space-y-2">
              {queue.map((qf) => (
                <div key={qf.id} className="flex items-center gap-3 rounded-xl border p-2.5">
                  <div className="p-2 rounded-lg bg-muted shrink-0">{getFileIconElement(qf.file, 'h-4 w-4')}</div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Input
                      value={qf.alias}
                      disabled={qf.status === 'uploading' || qf.status === 'success'}
                      onChange={(e) => updateFile(qf.id, { alias: e.target.value })}
                      className="h-7 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-40 shrink-0">
                        <ConfidentialityLevelSelect
                          value={qf.confidentialityLevel}
                          onValueChange={(v) => updateFile(qf.id, { confidentialityLevel: v })}
                          disabled={qf.status === 'uploading' || qf.status === 'success'}
                          className="h-7 text-xs"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatBytes(qf.file.size)}</span>
                      {qf.error && <span className="text-xs text-destructive truncate">{qf.error}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {qf.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {qf.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {qf.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                    {qf.status !== 'uploading' && qf.status !== 'success' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFile(qf.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isUploading && (
            <div className="space-y-1.5">
              <Progress value={progressValue} className="h-1.5" />
              <p className="text-xs text-muted-foreground text-right">
                {successCount} of {total} uploaded
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t shrink-0">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isUploading}>
            {queue.some((f) => f.status === 'success') ? 'Done' : 'Cancel'}
          </Button>
          <Button onClick={handleUploadAll} disabled={!hasUploadable || isUploading} className="gap-2">
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
            Upload {queue.length > 0 ? `${queue.length} file${queue.length > 1 ? 's' : ''}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UploadDialog

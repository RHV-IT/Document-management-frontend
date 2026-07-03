'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Share2, FileWarning } from 'lucide-react'
import { usePreviewFileMutation } from '@/hooks/useFiles'
import { getFileCategory, getFileIconElement } from '@/lib/file-utils'
import { FileItem } from '@/services/api/files'

interface PreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem | null
  onDownload: () => void
  onShare: () => void
}

export function PreviewDialog({ open, onOpenChange, file, onDownload, onShare }: PreviewDialogProps) {
  const { mutate: fetchPreview, isPending, isError } = usePreviewFileMutation()
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open || !file) return
    const category = getFileCategory(file)
    if (category !== 'image' && category !== 'pdf') return

    fetchPreview(file.fileId, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob)
        objectUrlRef.current = url
        setObjectUrl(url)
      },
    })

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      setObjectUrl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.fileId])

  if (!file) return null

  const category = getFileCategory(file)
  const displayName = file.alias || file.name
  const canInlinePreview = category === 'image' || category === 'pdf'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-base">
            {getFileIconElement(file, 'h-5 w-5')}
            <span className="truncate">{displayName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[50vh] max-h-[70vh] overflow-auto bg-muted/20 flex items-center justify-center p-4">
          {!canInlinePreview ? (
            <div className="flex flex-col items-center gap-3 text-center text-muted-foreground py-12">
              <FileWarning className="h-10 w-10 opacity-50" />
              <p className="text-sm font-medium text-foreground">No inline preview available</p>
              <p className="text-xs max-w-xs">
                This file type can't be previewed in the browser. Download it to view the full content.
              </p>
              <Button size="sm" onClick={onDownload} className="gap-2 mt-1">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          ) : isPending ? (
            <div className="w-full h-[50vh] animate-pulse bg-muted rounded-lg" />
          ) : isError || !objectUrl ? (
            <div className="flex flex-col items-center gap-3 text-center text-muted-foreground py-12">
              <FileWarning className="h-10 w-10 opacity-50" />
              <p className="text-sm font-medium text-foreground">Preview failed to load</p>
              <Button size="sm" onClick={onDownload} className="gap-2 mt-1">
                <Download className="h-4 w-4" />
                Download instead
              </Button>
            </div>
          ) : category === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={objectUrl} alt={displayName} className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm" />
          ) : (
            <iframe src={objectUrl} title={displayName} className="w-full h-[65vh] rounded-lg bg-white" />
          )}
        </div>

        <div className="p-3 border-t flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button size="sm" onClick={onDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PreviewDialog

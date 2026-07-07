'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useUploadFileMutation, useBulkUploadMutation, useFilesQuery } from '@/hooks/useFiles'
import { ConfidentialityLevelSelect } from '@/components/ui/ConfidentialityLevelSelect'
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileBox,
  Sparkles,
  Shield,
  Trash2,
  Files,
  File as FileIcon,
  ArrowRight,
  Tag,
} from 'lucide-react'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn, formatBytes } from '@/lib/utils'
import { getFileIconElement, getFileCategory } from '@/lib/file-utils'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'
import type { FileItem } from '@/services/api/files'
import { useAuth } from '@/hooks/useAuth'
import { useAccessControl } from '@/hooks/useAccessControl'
import { addNotification } from '@/components/notifications/NotificationCenter'

type UploadMode = 'single' | 'multiple'

interface QueuedFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  alias: string
  confidentialityLevel: string
}

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf',
  '.xls', '.xlsx', '.ods', '.csv',
  '.ppt', '.pptx', '.odp',
  '.jpg', '.jpeg', '.png', '.gif', '.tiff', '.tif', '.bmp', '.webp',
  '.zip', '.rar', '.7z', '.tar', '.gz',
]

const MAX_FILES = 10
const MAX_FILE_SIZE = 50 * 1024 * 1024

function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

function validateFile(file: File): string | null {
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) return 'File type not supported.'
  if (file.size > MAX_FILE_SIZE) return 'File too large. Max 50 MB.'
  return null
}

/** Local object-URL thumbnail for image files; revoked automatically on cleanup. */
function useFilePreview(file: File | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file || getFileCategory(file) !== 'image') {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])
  return url
}

export default function UploadPage() {
  const singleInputRef = useRef<HTMLInputElement>(null)
  const multiInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<UploadMode>('single')

  // Single-file state
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [alias, setAlias] = useState('')
  const [tags, setTags] = useState('')
  const [confidentiality, setConfidentiality] = useState('internal')
  const [isDraggingSingle, setIsDraggingSingle] = useState(false)
  const singlePreviewUrl = useFilePreview(singleFile)

  // Multi-file state
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [isDraggingMulti, setIsDraggingMulti] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [viewFile, setViewFile] = useState<FileItem | null>(null)

  const { user } = useAuth()
  const { canUpload } = useAccessControl()

  const uploadFile = useUploadFileMutation()
  const bulkUpload = useBulkUploadMutation()
  const { data: filesData } = useFilesQuery({ owner: user?._id, limit: 8, sortBy: 'createdAt', sortOrder: 'desc' })

  // ---- Single-file handlers ----
  const handleSingleFile = (file: File | null) => {
    if (!file) return
    const err = validateFile(file)
    if (err) {
      addNotification('error', 'Invalid File', `${file.name}: ${err}`)
      return
    }
    setSingleFile(file)
  }

  const handleSingleUpload = () => {
    if (!singleFile) return
    if (!canUpload(confidentiality)) {
      addNotification('error', 'Upload Blocked', 'No permission for this confidentiality level.')
      return
    }
    const formData = new FormData()
    formData.append('file', singleFile)
    if (alias) formData.append('alias', alias)
    formData.append('tags', JSON.stringify(tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []))
    formData.append('confidentialityLevel', confidentiality)
    uploadFile.mutate(formData, {
      onSuccess: () => {
        setSingleFile(null)
        setAlias('')
        setTags('')
        setConfidentiality('internal')
      },
    })
  }

  // ---- Multi-file handlers ----
  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const arr = Array.from(files)
      const newFiles: QueuedFile[] = []
      for (const file of arr) {
        if (queue.length + newFiles.length >= MAX_FILES) {
          addNotification('error', 'Limit Reached', `Maximum ${MAX_FILES} files at a time.`)
          break
        }
        const err = validateFile(file)
        if (err) {
          addNotification('error', 'Invalid File', `${file.name}: ${err}`)
          continue
        }
        newFiles.push({ file, id: generateId(), status: 'pending', confidentialityLevel: 'internal', alias: '' })
      }
      if (newFiles.length > 0) setQueue((prev) => [...prev, ...newFiles])
    },
    [queue.length]
  )

  const updateFile = (id: string, updates: Partial<QueuedFile>) => {
    setQueue((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }
  const removeFile = (id: string) => setQueue((prev) => prev.filter((f) => f.id !== id))
  const clearAll = () => {
    setQueue([])
    setUploadProgress(0)
  }

  const handleMultiUpload = () => {
    const pending = queue.filter((f) => f.status === 'pending')
    if (pending.length === 0) return

    const validated = pending.map((item) =>
      canUpload(item.confidentialityLevel)
        ? item
        : { ...item, status: 'error' as const, error: 'No permission for this confidentiality level.' }
    )
    const invalidCount = validated.filter((i) => i.status === 'error').length
    if (invalidCount > 0) {
      setQueue((prev) => prev.map((p) => validated.find((v) => v.id === p.id) || p))
      if (invalidCount === pending.length) return
    }

    const valid = validated.filter((i) => i.status === 'pending')
    const files = valid.map((f) => f.file)
    const metadata = valid.map((f) => ({
      confidentialityLevel: f.confidentialityLevel || 'internal',
      ...(f.alias.trim() ? { alias: f.alias.trim() } : {}),
    }))

    setUploadProgress(0)
    setQueue((prev) => prev.map((f) => (valid.some((v) => v.id === f.id) ? { ...f, status: 'uploading' as const } : f)))

    bulkUpload.mutate(
      { files, metadata, onProgress: setUploadProgress },
      {
        onSuccess: () => {
          setUploadProgress(100)
          setQueue((prev) => prev.map((f) => (f.status === 'uploading' ? { ...f, status: 'success' as const } : f)))
        },
        onError: (error: any) => {
          setUploadProgress(0)
          setQueue((prev) =>
            prev.map((f) =>
              f.status === 'uploading'
                ? { ...f, status: 'error' as const, error: error.response?.data?.message || error.message }
                : f
            )
          )
        },
      }
    )
  }

  const pendingCount = queue.filter((f) => f.status === 'pending').length
  const successCount = queue.filter((f) => f.status === 'success').length
  const errorCount = queue.filter((f) => f.status === 'error').length

  return (
    <ResponsiveContainer>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <UploadCloud className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Upload Files</h1>
              <p className="text-sm text-muted-foreground">Choose how you'd like to upload</p>
            </div>
          </div>

          {/* Modern segmented mode toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted">
            <button
              onClick={() => setMode('single')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                mode === 'single' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FileIcon className="h-3.5 w-3.5" />
              Single
            </button>
            <button
              onClick={() => setMode('multiple')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                mode === 'multiple' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Files className="h-3.5 w-3.5" />
              Multiple
              {queue.length > 0 && (
                <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] ml-0.5">
                  {queue.length}
                </Badge>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* ===== LEFT: upload flow ===== */}
          <Card className="border shadow-sm overflow-hidden">
            <CardContent className="p-6">
              {mode === 'single' ? (
                <div key="single" className="animate-fade-in space-y-5">
                  {!singleFile ? (
                    <div
                      onClick={() => singleInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDraggingSingle(true)
                      }}
                      onDragLeave={() => setIsDraggingSingle(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDraggingSingle(false)
                        handleSingleFile(e.dataTransfer.files?.[0] || null)
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors py-16',
                        isDraggingSingle ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/30'
                      )}
                    >
                      <input
                        ref={singleInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleSingleFile(e.target.files?.[0] || null)}
                        accept={ALLOWED_EXTENSIONS.join(',')}
                      />
                      <div className={cn('p-3.5 rounded-full transition-colors', isDraggingSingle ? 'bg-primary/15' : 'bg-muted')}>
                        <UploadCloud className={cn('h-7 w-7', isDraggingSingle ? 'text-primary' : 'text-muted-foreground')} />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {isDraggingSingle ? 'Drop your file here' : 'Drag & drop or click to select a file'}
                      </p>
                      <p className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint, images, archives — up to 50 MB</p>
                    </div>
                  ) : (
                    <div className="space-y-5 animate-scale-in">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                        {singlePreviewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={singlePreviewUrl} alt={singleFile.name} className="w-14 h-14 rounded-lg object-cover shrink-0 shadow-sm" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-card shadow-sm flex items-center justify-center shrink-0">
                            {getFileIconElement(singleFile, 'h-6 w-6')}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-foreground">{singleFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(singleFile.size)}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSingleFile(null)} className="h-8 w-8 shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-foreground">Rename (optional)</label>
                          <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="File name" className="h-10" />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-foreground">Confidentiality</label>
                          <ConfidentialityLevelSelect value={confidentiality} onValueChange={setConfidentiality} placeholder="Select level" />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 text-foreground">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          Tags (optional)
                        </label>
                        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma separated tags" className="h-10" />
                      </div>

                      {confidentiality === 'highly_confidential' && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                          <Shield className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700 leading-snug">Only the uploader and administrators can access this file.</p>
                        </div>
                      )}

                      <Button onClick={handleSingleUpload} disabled={uploadFile.isPending} className="w-full h-11 gap-2">
                        {uploadFile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                        {uploadFile.isPending ? 'Uploading...' : 'Upload File'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div key="multiple" className="animate-fade-in space-y-5">
                  {queue.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {queue.length}/{MAX_FILES} files selected
                      </p>
                      <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-xs text-destructive hover:text-destructive">
                        Clear all
                      </Button>
                    </div>
                  )}

                  <input
                    ref={multiInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files)
                      e.target.value = ''
                    }}
                    accept={ALLOWED_EXTENSIONS.join(',')}
                  />

                  <div
                    onClick={() => multiInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingMulti(true)
                    }}
                    onDragLeave={() => setIsDraggingMulti(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDraggingMulti(false)
                      addFiles(e.dataTransfer.files)
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors',
                      queue.length > 0 ? 'py-8' : 'py-14',
                      isDraggingMulti ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/30'
                    )}
                  >
                    <div className={cn('p-3 rounded-full transition-colors', isDraggingMulti ? 'bg-primary/15' : 'bg-muted')}>
                      <UploadCloud className={cn('h-6 w-6', isDraggingMulti ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {isDraggingMulti ? 'Drop to add files' : 'Click to browse or drop files here'}
                    </p>
                    <p className="text-xs text-muted-foreground">Add up to {MAX_FILES} files at once</p>
                  </div>

                  {queue.length > 0 && (
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {queue.map((item, index) => (
                        <MultiFileRow
                          key={item.id}
                          item={item}
                          index={index}
                          onUpdate={(patch) => updateFile(item.id, patch)}
                          onRemove={() => removeFile(item.id)}
                        />
                      ))}
                    </div>
                  )}

                  {queue.some((f) => f.status === 'pending' && f.confidentialityLevel === 'highly_confidential') && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <Shield className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 leading-snug">
                        One or more files are marked Highly Confidential — only the uploader and administrators will be able to access them.
                      </p>
                    </div>
                  )}

                  {queue.length > 0 && (
                    <div className="space-y-3">
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Uploading...</span>
                            <span className="font-medium text-primary">{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-1.5" />
                        </div>
                      )}
                      {(successCount > 0 || errorCount > 0) && (
                        <div className="flex items-center gap-3 text-xs">
                          {successCount > 0 && (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> {successCount} done
                            </span>
                          )}
                          {errorCount > 0 && (
                            <span className="text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {errorCount} failed
                            </span>
                          )}
                        </div>
                      )}
                      <Button onClick={handleMultiUpload} disabled={pendingCount === 0 || bulkUpload.isPending} className="w-full h-11 gap-2">
                        {bulkUpload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                        {bulkUpload.isPending ? 'Uploading...' : `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== RIGHT: recent uploads ===== */}
          <Card className="border shadow-sm lg:sticky lg:top-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Recent Uploads</h2>
              </div>

              {filesData?.files && filesData.files.length > 0 ? (
                <>
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                    {filesData.files.slice(0, 8).map((file, index) => (
                      <button
                        key={file.fileId}
                        className={cn('w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left animate-slide-in-up', `stagger-${Math.min(index + 1, 8)}`)}
                        onClick={() => setViewFile(file)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          {getFileIconElement(file, 'h-4 w-4')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-foreground">{file.alias || file.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {file.createdAt ? format(new Date(file.createdAt), 'MMM d, h:mm a') : ''}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          {file.confidentialityLevel?.replace(/_/g, ' ') || 'internal'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/dashboard/files"
                    className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    View all in Files
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              ) : (
                <div className="text-center py-10">
                  <FileBox className="h-9 w-9 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-xs font-medium text-muted-foreground">No uploads yet</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">Your uploaded files will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!viewFile} onOpenChange={() => setViewFile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
          </DialogHeader>
          {viewFile && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-card shadow-sm flex items-center justify-center shrink-0">
                  {getFileIconElement(viewFile, 'h-5 w-5')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-sm">{viewFile.name}</p>
                  <p className="text-xs text-muted-foreground">{viewFile.alias || 'No alias'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[11px] text-muted-foreground mb-0.5">Type</p>
                  <p className="text-sm font-medium">{viewFile.fileCategory || viewFile.type}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[11px] text-muted-foreground mb-0.5">Confidentiality</p>
                  <Badge variant="outline">{viewFile.confidentialityLevel}</Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ResponsiveContainer>
  )
}

function MultiFileRow({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: QueuedFile
  index: number
  onUpdate: (patch: Partial<QueuedFile>) => void
  onRemove: () => void
}) {
  const previewUrl = useFilePreview(item.status === 'pending' ? item.file : null)

  return (
    <div
      className={cn(
        'rounded-xl p-3 border transition-colors animate-slide-in-up',
        `stagger-${Math.min(index + 1, 8)}`,
        item.status === 'success' && 'bg-emerald-50 border-emerald-200',
        item.status === 'error' && 'bg-red-50 border-red-200',
        item.status === 'uploading' && 'bg-primary/5 border-primary/20',
        item.status === 'pending' && 'bg-card border-border'
      )}
    >
      <div className="flex items-center gap-3">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={item.file.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            {getFileIconElement(item.file, 'h-4 w-4')}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">{item.file.name}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {item.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
          {item.status === 'uploading' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
          {item.status === 'pending' && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {item.status === 'pending' && (
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/60">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Rename</label>
            <Input value={item.alias} onChange={(e) => onUpdate({ alias: e.target.value })} placeholder={item.file.name} className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Confidentiality</label>
            <ConfidentialityLevelSelect
              value={item.confidentialityLevel}
              onValueChange={(v) => onUpdate({ confidentialityLevel: v })}
              placeholder="Level"
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}

      {item.error && <p className="text-xs text-destructive mt-2">{item.error}</p>}
    </div>
  )
}

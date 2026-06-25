'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useUploadFileMutation, useBulkUploadMutation, useFilesQuery } from '@/hooks/useFiles'
import { ConfidentialityLevelSelect } from '@/components/ui/ConfidentialityLevelSelect'
import {
  Upload, X, CheckCircle, AlertCircle,
  Cloud, FileText, Layers, FileBox, ArrowUpCircle, Shield, Lock,
  Image as ImageIcon, FileSpreadsheet, Presentation, FileArchive, FileCode, Plus, Sparkles, Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'
import type { FileItem } from '@/services/api/files'
import { useAuth } from '@/hooks/useAuth'
import { useAccessControl } from '@/hooks/useAccessControl'
import { addNotification } from '@/components/notifications/NotificationCenter'

type UploadMethod = 'single' | 'bulk'

interface BulkFileStatus {
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

const MAX_BULK_FILES = 10
const MAX_FILE_SIZE = 50 * 1024 * 1024

function getFileIcon(name: string, type?: string) {
  const ext = name?.toLowerCase() || ''
  const mime = (type || '').toLowerCase()
  if (mime.includes('image') || /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(ext)) return <ImageIcon className="h-5 w-5 text-blue-500" />
  if (mime.includes('pdf') || ext.endsWith('.pdf')) return <FileText className="h-5 w-5 text-red-500" />
  if (/\.(xls|xlsx)$/.test(ext) || mime.includes('sheet')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />
  if (/\.(ppt|pptx)$/.test(ext) || mime.includes('presentation')) return <Presentation className="h-5 w-5 text-orange-500" />
  if (/\.(zip|rar|7z)$/.test(ext)) return <FileArchive className="h-5 w-5 text-purple-500" />
  if (/\.(doc|docx)$/.test(ext) || mime.includes('word')) return <FileText className="h-5 w-5 text-blue-600" />
  return <FileCode className="h-5 w-5 text-gray-500" />
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function UploadPage() {
  const singleInputRef = useRef<HTMLInputElement>(null)
  const bulkInputRef = useRef<HTMLInputElement>(null)

  // Upload method selector
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('single')

  // Single file state
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [alias, setAlias] = useState('')
  const [tags, setTags] = useState('')
  const [confidentiality, setConfidentiality] = useState('internal')
  const [isDraggingSingle, setIsDraggingSingle] = useState(false)

  // Bulk file state
  const [bulkFiles, setBulkFiles] = useState<BulkFileStatus[]>([])
  const [isDraggingBulk, setIsDraggingBulk] = useState(false)
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0)

  // Shared
  const [viewFile, setViewFile] = useState<FileItem | null>(null)

  const { user } = useAuth()
  const { canUpload } = useAccessControl()

  const uploadFile = useUploadFileMutation()
  const bulkUpload = useBulkUploadMutation()
  const { data: filesData } = useFilesQuery({ limit: 8 })

  const generateId = () => Math.random().toString(36).substring(2, 15)

  const validateFile = (file: File): string | null => {
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) return 'File type not supported.'
    if (file.size > MAX_FILE_SIZE) return 'File too large. Max 50 MB.'
    return null
  }

  // ---- Single file handlers ----
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { addNotification('error', 'Invalid File', `${file.name}: ${err}`); return }
    setSingleFile(file)
  }

  const handleSingleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDraggingSingle(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { addNotification('error', 'Invalid File', `${file.name}: ${err}`); return }
    setSingleFile(file)
  }

  const handleSingleUpload = () => {
    if (!singleFile) return
    const err = validateFile(singleFile)
    if (err) { addNotification('error', 'Invalid File', `${singleFile.name}: ${err}`); return }
    if (!canUpload(confidentiality)) { addNotification('error', 'Upload Blocked', 'No permission for this confidentiality level.'); return }
    const formData = new FormData()
    formData.append('file', singleFile)
    if (alias) formData.append('alias', alias)
    formData.append('tags', JSON.stringify(tags ? tags.split(',').map(t => t.trim()) : []))
    formData.append('confidentialityLevel', confidentiality)
    uploadFile.mutate(formData, { onSuccess: () => { setSingleFile(null); setAlias(''); setTags('') } })
  }

  // ---- Bulk file handlers ----
  const handleBulkFileSelect = useCallback((files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
    const newFiles: BulkFileStatus[] = []
    for (const file of arr) {
      if (bulkFiles.length + newFiles.length >= MAX_BULK_FILES) {
        addNotification('error', 'Limit Reached', `Maximum ${MAX_BULK_FILES} files at a time.`); break
      }
      const err = validateFile(file)
      if (err) { addNotification('error', 'Invalid File', `${file.name}: ${err}`); continue }
      newFiles.push({ file, id: generateId(), status: 'pending', confidentialityLevel: 'internal', alias: '' })
    }
    if (newFiles.length > 0) setBulkFiles(prev => [...prev, ...newFiles])
  }, [bulkFiles.length])

  const handleBulkDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDraggingBulk(false)
    handleBulkFileSelect(e.dataTransfer.files)
  }

  const updateBulkFile = (id: string, updates: Partial<BulkFileStatus>) => {
    setBulkFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeBulkFile = (id: string) => setBulkFiles(prev => prev.filter(f => f.id !== id))

  const handleBulkUpload = () => {
    const pending = bulkFiles.filter(f => f.status === 'pending')
    if (pending.length === 0) return
    const validated = pending.map(item => {
      if (!canUpload(item.confidentialityLevel)) return { ...item, status: 'error' as const, error: 'No permission for this confidentiality level.' }
      return item
    })
    const invalidCount = validated.filter(i => i.status === 'error').length
    if (invalidCount > 0) {
      setBulkFiles(prev => prev.map(p => { const m = validated.find(v => v.id === p.id); return m || p }))
      if (invalidCount === pending.length) return
    }
    const valid = validated.filter(i => i.status === 'pending')
    const files = valid.map(f => f.file)
    const metadata = valid.map(f => ({
      confidentialityLevel: f.confidentialityLevel || 'internal',
      ...(f.alias?.trim() ? { alias: f.alias.trim() } : {}),
    }))
    setBulkUploadProgress(0)
    setBulkFiles(prev => prev.map(f => f.status === 'pending' && valid.some(v => v.id === f.id) ? { ...f, status: 'uploading' as const } : f))
    bulkUpload.mutate(
      { files, metadata, onProgress: (p: number) => setBulkUploadProgress(p) },
      {
        onSuccess: () => { setBulkUploadProgress(100); setBulkFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'success' as const } : f)) },
        onError: (error: any) => { setBulkUploadProgress(0); setBulkFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'error' as const, error: error.response?.data?.message || error.message } : f)) }
      }
    )
  }

  const pendingCount = bulkFiles.filter(f => f.status === 'pending').length
  const successCount = bulkFiles.filter(f => f.status === 'success').length
  const errorCount = bulkFiles.filter(f => f.status === 'error').length

  return (
    <ResponsiveContainer className="!p-0 !max-w-[1400px] !mx-auto">
      <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>

        {/* ===== HEADER ===== */}
        <div className="px-8 pt-8 pb-6">
          <h1 className="text-[42px] font-bold tracking-tight" style={{ color: '#111827' }}>
            Upload Files
          </h1>
          <p className="text-lg mt-3" style={{ color: '#6B7280' }}>
            Choose your upload method below
          </p>
        </div>

        {/* ===== UPLOAD METHOD SELECTOR CARDS ===== */}
        <div className="px-8 pb-8">
          <div className="flex gap-5">
            {/* Single Upload Card */}
            <button
              onClick={() => setUploadMethod('single')}
              className={cn(
                "relative flex-1 h-[170px] rounded-[16px] border-2 text-left transition-all duration-200 cursor-pointer p-6",
                uploadMethod === 'single'
                  ? "border-[#3B82F6] bg-white shadow-[0_0_20px_rgba(59,130,246,0.12)]"
                  : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
              )}
            >
              <div className="flex items-start justify-between h-full">
                <div className="flex flex-col justify-between h-full">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[30px] font-semibold" style={{ color: '#111827' }}>Single</p>
                    <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Upload one file with metadata</p>
                  </div>
                </div>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  uploadMethod === 'single' ? "bg-blue-100" : "bg-gray-100"
                )}>
                  <Upload className={cn("h-4 w-4", uploadMethod === 'single' ? "text-blue-600" : "text-gray-400")} />
                </div>
              </div>
            </button>

            {/* Bulk Upload Card */}
            <button
              onClick={() => setUploadMethod('bulk')}
              className={cn(
                "relative flex-1 h-[170px] rounded-[16px] border-2 text-left transition-all duration-200 cursor-pointer p-6",
                uploadMethod === 'bulk'
                  ? "border-[#A855F7] bg-white shadow-[0_0_20px_rgba(168,85,247,0.12)]"
                  : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
              )}
            >
              <div className="flex items-start justify-between h-full">
                <div className="flex flex-col justify-between h-full">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[30px] font-semibold" style={{ color: '#111827' }}>Bulk</p>
                    <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Upload multiple files (max 10)</p>
                  </div>
                </div>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  uploadMethod === 'bulk' ? "bg-purple-100" : "bg-gray-100"
                )}>
                  <Layers className={cn("h-4 w-4", uploadMethod === 'bulk' ? "text-purple-600" : "text-gray-400")} />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ===== MAIN CONTENT: TWO COLUMNS ===== */}
        <div className="px-8 pb-12">
          <div className="flex gap-6 items-start">

            {/* ===== LEFT PANEL (65%) ===== */}
            <div className="w-[65%]">
              <Card className="rounded-[18px] border-0" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <CardContent className="p-6">

                  {/* ===== SINGLE UPLOAD PANEL ===== */}
                  {uploadMethod === 'single' && (
                    <div>
                      {/* Header */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                          <Upload className="h-5 w-5 text-blue-600" />
                          <h2 className="text-xl font-semibold" style={{ color: '#111827' }}>Single File Upload</h2>
                        </div>
                        <p className="text-sm" style={{ color: '#6B7280' }}>Upload one file with metadata</p>
                      </div>

                      {/* Dropzone or File Preview */}
                      {!singleFile ? (
                        <div
                          className={cn(
                            "border-2 border-dashed rounded-[16px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                            isDraggingSingle ? "border-blue-500 bg-blue-50/50" : "border-[#CBD5E1] hover:border-blue-300 hover:bg-blue-50/20"
                          )}
                          style={{ height: 250 }}
                          onClick={() => singleInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingSingle(true) }}
                          onDragLeave={(e) => { e.preventDefault(); setIsDraggingSingle(false) }}
                          onDrop={handleSingleDrop}
                        >
                          <input ref={singleInputRef} type="file" className="hidden" onChange={handleSingleFileChange}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.csv,.ods,.odp,.jpg,.jpeg,.png,.gif,.tiff,.tif,.bmp,.webp,.zip,.rar,.7z,.tar,.gz" />
                          <Cloud className={cn("h-10 w-10 mb-3 transition-colors", isDraggingSingle ? "text-blue-500" : "text-gray-300")} />
                          <p className={cn("font-medium text-base", isDraggingSingle ? "text-blue-600" : "text-gray-600")}>
                            {isDraggingSingle ? 'Drop your file here' : 'Drag & drop or click to select'}
                          </p>
                          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>PDF, Word, Excel, PowerPoint, Text files</p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {/* File info */}
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F8FAFC]">
                            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              {getFileIcon(singleFile.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate" style={{ color: '#111827' }}>{singleFile.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(singleFile.size)}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSingleFile(null)} className="h-7 w-7 shrink-0">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Metadata fields */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-1.5 block" style={{ color: '#374151' }}>Rename (Optional)</label>
                              <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="File name" className="h-10" />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1.5 block" style={{ color: '#374151' }}>Confidentiality</label>
                              <ConfidentialityLevelSelect value={confidentiality} onValueChange={setConfidentiality} placeholder="Select level" />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1.5 block" style={{ color: '#374151' }}>Tags (optional)</label>
                            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma separated tags" className="h-10" />
                          </div>

                          {confidentiality === 'highly_confidential' && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                              <Shield className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-red-700 leading-snug">Only the uploader and administrators can access this file.</p>
                            </div>
                          )}

                          <Button
                            onClick={handleSingleUpload}
                            disabled={uploadFile.isPending}
                            className="w-full h-12 rounded-xl text-white font-medium gap-2"
                            style={{ background: 'linear-gradient(135deg, #5B8DEF 0%, #4F7BFF 100%)' }}
                          >
                            <Upload className="h-4 w-4" />
                            {uploadFile.isPending ? 'Uploading...' : 'Upload File'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ===== BULK UPLOAD PANEL ===== */}
                  {uploadMethod === 'bulk' && (
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Layers className="h-5 w-5 text-purple-600" />
                            <h2 className="text-xl font-semibold" style={{ color: '#111827' }}>Bulk Upload</h2>
                          </div>
                          <p className="text-sm" style={{ color: '#6B7280' }}>Upload multiple files at once (max 10)</p>
                        </div>
                        {bulkFiles.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setBulkFiles([]); setBulkUploadProgress(0) }}
                            className="h-8 text-xs text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            Clear all
                          </Button>
                        )}
                      </div>

                      {/* Dropzone */}
                      <div
                        className={cn(
                          "border-2 border-dashed rounded-[16px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                          isDraggingBulk ? "border-purple-500 bg-purple-50/50" : "border-[#CBD5E1] hover:border-purple-300 hover:bg-purple-50/20"
                        )}
                        style={{ height: bulkFiles.length > 0 ? 180 : 280 }}
                        onClick={() => bulkInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingBulk(true) }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingBulk(false) }}
                        onDrop={handleBulkDrop}
                      >
                        <input ref={bulkInputRef} type="file" multiple className="hidden" onChange={(e) => { handleBulkFileSelect(e.target.files); e.target.value = '' }} />
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                            <Plus className={cn("h-5 w-5 transition-colors", isDraggingBulk ? "text-purple-500" : "text-gray-400")} />
                          </div>
                          <p className={cn("font-medium", isDraggingBulk ? "text-purple-600" : "text-gray-600")}>
                            {isDraggingBulk ? 'Drop files here' : 'Drag & drop or click to browse'}
                          </p>
                          <p className="text-sm" style={{ color: '#9CA3AF' }}>
                            {bulkFiles.length}/{MAX_BULK_FILES} files selected • PDF, Word, Excel, PowerPoint, Text
                          </p>
                        </div>
                      </div>

                      {/* File list with per-file metadata */}
                      {bulkFiles.length > 0 && (
                        <div className="mt-5 space-y-3 max-h-[400px] overflow-y-auto pr-1">
                          {bulkFiles.map((item, idx) => (
                            <div
                              key={item.id}
                              className={cn(
                                "rounded-xl p-4 transition-colors border",
                                item.status === 'success' && "bg-green-50/50 border-green-200",
                                item.status === 'error' && "bg-red-50/50 border-red-200",
                                item.status === 'uploading' && "bg-blue-50/50 border-blue-200",
                                item.status === 'pending' && "bg-white border-gray-100"
                              )}
                            >
                              {/* File header row */}
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#F8FAFC] flex items-center justify-center shrink-0">
                                  {getFileIcon(item.file.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>{item.file.name}</p>
                                  <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {item.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  {item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                                  {item.status === 'uploading' && <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                                  {item.status === 'pending' && (
                                    <Button variant="ghost" size="icon" onClick={() => removeBulkFile(item.id)} className="h-7 w-7 cursor-pointer text-gray-400 hover:text-red-500">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Per-file metadata for pending files */}
                              {item.status === 'pending' && (
                                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                                  <div>
                                    <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>Rename</label>
                                    <Input
                                      value={item.alias}
                                      onChange={(e) => updateBulkFile(item.id, { alias: e.target.value })}
                                      placeholder={item.file.name}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium mb-1 block" style={{ color: '#6B7280' }}>Confidentiality</label>
                                    <ConfidentialityLevelSelect
                                      value={item.confidentialityLevel}
                                      onValueChange={(v) => updateBulkFile(item.id, { confidentialityLevel: v })}
                                      placeholder="Level"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Error message */}
                              {item.error && (
                                <p className="text-xs text-red-500 mt-2">{item.error}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Progress & Upload */}
                      {bulkFiles.length > 0 && (
                        <div className="mt-5 space-y-3">
                          {bulkUploadProgress > 0 && bulkUploadProgress < 100 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Uploading...</span>
                                <span className="font-medium text-purple-600">{bulkUploadProgress}%</span>
                              </div>
                              <Progress value={bulkUploadProgress} className="h-1.5" />
                            </div>
                          )}
                          {(successCount > 0 || errorCount > 0) && (
                            <div className="flex items-center gap-3 text-xs">
                              {successCount > 0 && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {successCount} done</span>}
                              {errorCount > 0 && <span className="text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errorCount} failed</span>}
                            </div>
                          )}
                          <Button
                            onClick={handleBulkUpload}
                            disabled={pendingCount === 0 || bulkUpload.isPending}
                            className="w-full h-12 rounded-xl text-white font-medium gap-2"
                            style={{ background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)' }}
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                            {bulkUpload.isPending ? 'Uploading...' : `Upload ${pendingCount} File${pendingCount !== 1 ? 's' : ''}`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>

            {/* ===== RIGHT PANEL (35%) ===== */}
            <div className="w-[35%]">
              <Card className="rounded-[18px] border-0 sticky top-6" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold" style={{ color: '#111827' }}>Recent Uploads</h2>
                  </div>

                  {filesData?.files && filesData.files.length > 0 ? (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {filesData.files.slice(0, 8).map((file) => (
                        <div
                          key={file.fileId}
                          className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors group"
                          style={{ backgroundColor: '#F8FAFC' }}
                          onClick={() => setViewFile(file)}
                        >
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                            {getFileIcon(file.name, file.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>
                              {file.alias || file.name}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                              {file.createdAt ? format(new Date(file.createdAt), 'MMM d, h:mm a') : ''}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium"
                            style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}
                          >
                            {file.confidentialityLevel?.replace(/_/g, ' ') || 'Internal'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileBox className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium" style={{ color: '#6B7280' }}>No uploads yet</p>
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Your uploaded files will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>

        {/* ===== FILE DETAILS DIALOG ===== */}
        <Dialog open={!!viewFile} onOpenChange={() => setViewFile(null)}>
          <DialogContent className="max-w-md rounded-[18px]">
            <DialogHeader>
              <DialogTitle>File Details</DialogTitle>
            </DialogHeader>
            {viewFile && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: '#F8FAFC' }}>
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    {getFileIcon(viewFile.name, viewFile.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{viewFile.name}</p>
                    <p className="text-sm text-gray-500">{viewFile.alias || 'No alias'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                    <p className="text-[11px] text-gray-400 mb-0.5">Type</p>
                    <p className="text-sm font-medium">{viewFile.fileCategory || viewFile.type}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                    <p className="text-[11px] text-gray-400 mb-0.5">Confidentiality</p>
                    <Badge variant="outline">{viewFile.confidentialityLevel}</Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </ResponsiveContainer>
  )
}

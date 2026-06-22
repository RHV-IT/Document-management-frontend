'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUploadFileMutation, useBulkUploadMutation, useFilesQuery } from '@/hooks/useFiles'
import { ConfidentialityLevelSelect } from '@/components/ui/ConfidentialityLevelSelect'
import {
  Upload, X, FileIcon, CheckCircle, AlertCircle,
  Cloud, FileText, Trash2, File, Layers, FileBox, ArrowUpCircle, Shield, Lock
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

interface FileStatus {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  alias?: string
  confidentialityLevel?: string
  preview?: string
}

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [alias, setAlias] = useState('')
  const [tags, setTags] = useState('')
  const [confidentiality, setConfidentiality] = useState('internal')
  const [activeTab, setActiveTab] = useState('single')
  const [isDraggingSingle, setIsDraggingSingle] = useState(false)

  const [bulkFiles, setBulkFiles] = useState<FileStatus[]>([])
  const [isDraggingBulk, setIsDraggingBulk] = useState(false)
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0)

  const [isDraggingPage, setIsDraggingPage] = useState(false)
  const [viewFile, setViewFile] = useState<FileItem | null>(null)

  const { user } = useAuth()
  const { canUpload, clearanceBadge, isAdmin, userDepartment } = useAccessControl()

  const uploadFile = useUploadFileMutation()
  const bulkUpload = useBulkUploadMutation()

  const { data: filesData } = useFilesQuery({ limit: 10 })

  const generateId = () => Math.random().toString(36).substring(2, 15)

  const MAX_BULK_FILES = 10
  const MAX_FILE_SIZE = 50 * 1024 * 1024
  const ALLOWED_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf',
    '.xls', '.xlsx', '.ods', '.csv',
    '.ppt', '.pptx', '.odp',
    '.jpg', '.jpeg', '.png', '.gif', '.tiff', '.tif', '.bmp', '.webp',
    '.zip', '.rar', '.7z', '.tar', '.gz',
  ]

  const validateFile = (file: File): string | null => {
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return 'File type not supported. Upload PDFs, Word, Excel, PowerPoint, images, text, or archives (ZIP/RAR/7Z).'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 50 MB.'
    }
    return null
  }

  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validationError = validateFile(file)
    if (validationError) {
      addNotification('error', 'Invalid File', `${file.name}: ${validationError}`)
      return
    }
    setSingleFile(file)
  }

  const handleSingleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingSingle(true)
  }

  const handleSingleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingSingle(false)
  }

  const handleSingleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingSingle(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      if (ALLOWED_EXTENSIONS.includes(fileExtension)) {
        setSingleFile(file)
      }
    }
  }

  const handleSingleUpload = () => {
    if (!singleFile) return
    const validationError = validateFile(singleFile)
    if (validationError) {
      addNotification('error', 'Invalid File', `${singleFile.name}: ${validationError}`)
      return
    }
    if (!canUpload(confidentiality)) {
      addNotification('error', 'Upload Blocked', 'You don\'t have permission to upload files with this confidentiality level.')
      return
    }
    const formData = new FormData()
    formData.append('file', singleFile)
    if (alias) formData.append('alias', alias)
    formData.append('tags', JSON.stringify(tags ? tags.split(',').map(t => t.trim()) : []))
    formData.append('confidentialityLevel', confidentiality)
    uploadFile.mutate(formData, {
      onSuccess: () => {
        setSingleFile(null)
        setAlias('')
        setTags('')
      }
    })
  }

  const handleBulkFileSelect = async (files: FileList | null) => {
    if (!files) return
    const filesArray = Array.from(files)
    const newFiles: FileStatus[] = []
    for (const file of filesArray) {
      if (bulkFiles.length + newFiles.length >= MAX_BULK_FILES) {
        addNotification('error', 'Upload Limit', 'Maximum 10 files at a time.')
        break
      }
      const validationError = validateFile(file)
      if (validationError) {
        addNotification('error', 'Invalid File', `${file.name}: ${validationError}`)
        continue
      }
      newFiles.push({ file, id: generateId(), status: 'pending' as const, confidentialityLevel: 'internal', alias: '' })
    }
    if (newFiles.length > 0) {
      setBulkFiles(prev => [...prev, ...newFiles])
    }
  }

  const handleBulkFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleBulkFileSelect(e.target.files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleBulkDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingBulk(true)
  }

  const handleBulkDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingBulk(false)
  }

  const handleBulkDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingBulk(false)
    await handleBulkFileSelect(e.dataTransfer.files)
  }

  const handleBulkUpload = () => {
    let pendingItems = bulkFiles.filter(f => f.status === 'pending')
    const validatedItems = pendingItems.map(item => {
      const lvl = item.confidentialityLevel || 'internal'
      if (!canUpload(lvl)) {
        return { ...item, status: 'error' as const, error: 'You don\'t have permission to upload files with this confidentiality level.' }
      }
      return item
    })
    const invalidCount = validatedItems.filter(i => i.status === 'error').length
    if (invalidCount > 0) {
      setBulkFiles(prev => prev.map(p => {
        const match = validatedItems.find(v => v.id === p.id)
        return match ? match : p
      }))
    }
    const validPending = validatedItems.filter(i => i.status === 'pending')
    const files = validPending.map(f => f.file)
    if (files.length === 0) {
      if (invalidCount > 0) return
      addNotification('error', 'No Files', 'Please select at least one file to upload.')
      return
    }
    const validFiles = files.filter(f => f && typeof f === 'object' && f.constructor.name === 'File') as File[]
    if (validFiles.length === 0) {
      addNotification('error', 'Invalid Files', 'None of the selected files are valid.')
      return
    }
    const metadata = validPending.map(f => ({
      confidentialityLevel: f.confidentialityLevel || 'internal',
      ...(f.alias && f.alias.trim() ? { alias: f.alias.trim() } : {})
    }))
    setBulkUploadProgress(0)
    setBulkFiles(prev => prev.map(f => f.status === 'pending' && validPending.some(v => v.id === f.id) ? { ...f, status: 'uploading' as const } : f))
    bulkUpload.mutate(
      { files: validFiles, metadata, onProgress: (p: number) => setBulkUploadProgress(p) },
      {
        onSuccess: () => {
          setBulkUploadProgress(100)
          setBulkFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'success' as const } : f))
        },
        onError: (error: any) => {
          setBulkUploadProgress(0)
          setBulkFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'error' as const, error: error.response?.data?.message || error.message } : f))
        }
      }
    )
  }

  const clearAllBulk = () => {
    setBulkFiles([])
    setBulkUploadProgress(0)
  }

  const handlePageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isDraggingSingle && !isDraggingBulk) {
      setIsDraggingPage(true)
    }
  }

  const handlePageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.clientX === 0 && e.clientY === 0) {
      setIsDraggingPage(false)
    }
  }

  const handlePageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingPage(false)
  }

  const removeBulkFile = (id: string) => {
    setBulkFiles(prev => prev.filter(f => f.id !== id))
  }

  const updateBulkFile = (id: string, updates: Partial<FileStatus>) => {
    setBulkFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  return (
    <ResponsiveContainer>
      <div
        className={`flex-1 p-8 bg-gradient-to-br from-gray-50/80 to-gray-100/50 overflow-auto animate-fade-in relative ${isDraggingPage ? 'bg-blue-50/30' : ''}`}
        onDragOver={handlePageDragOver}
        onDragLeave={handlePageDragLeave}
        onDrop={handlePageDrop}
      >
        {isDraggingPage && (
          <div className="absolute inset-0 z-50 bg-primary/5 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-primary rounded-lg m-4 pointer-events-none">
            <div className="text-center">
              <Upload className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="text-xl font-semibold text-primary">Drop files here to upload</p>
              <p className="text-sm text-muted-foreground mt-1">Switch to Bulk Upload tab for multiple files</p>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleBulkFilesChange} />

        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Upload Files</h1>
            <p className="text-muted-foreground mt-1">Upload documents, images, archives, and more</p>
          </div>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Max file size: 50 MB</span>
            </div>
            <div className="flex items-center gap-2">
              <File className="h-4 w-4" />
              <span>PDF, Word, Excel, PowerPoint, Images, Text, Archives</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="hidden">
              <TabsTrigger value="single" />
              <TabsTrigger value="bulk" />
            </TabsList>

            <TabsContent value="single">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Single File Upload
                    </CardTitle>
                    <CardDescription>Upload one file with metadata</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${isDraggingSingle ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}
                      onClick={() => document.getElementById('single-file-input')?.click()}
                      onDragOver={handleSingleDragOver}
                      onDragLeave={handleSingleDragLeave}
                      onDrop={handleSingleDrop}
                    >
                      <input
                        id="single-file-input"
                        type="file"
                        className="hidden"
                        onChange={handleSingleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.csv,.ods,.odp,.jpg,.jpeg,.png,.gif,.tiff,.tif,.bmp,.webp,.zip,.rar,.7z,.tar,.gz"
                      />
                      <div className={`transition-transform duration-200 ${isDraggingSingle ? 'scale-110' : ''}`}>
                        <Cloud className={`h-12 w-12 mx-auto mb-4 transition-colors duration-200 ${isDraggingSingle ? 'text-blue-500' : 'text-gray-400'}`} />
                      </div>
                      {singleFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileIcon className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">{singleFile.name}</span>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSingleFile(null) }} className="cursor-pointer">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className={`font-medium transition-colors duration-200 ${isDraggingSingle ? 'text-blue-600' : 'text-gray-600'}`}>
                            {isDraggingSingle ? 'Drop your file here' : 'Drag & drop or click to select'}
                          </p>
                          <p className="text-sm text-gray-400 mt-2">PDF, Word, Excel, PowerPoint, Images, Text, Archives</p>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Rename (Optional)</label>
                        <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="File name" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Confidentiality</label>
                        <ConfidentialityLevelSelect
                          value={confidentiality}
                          onValueChange={setConfidentiality}
                          placeholder="Select level"
                          showRestrictionNote
                        />
                        {confidentiality === 'highly_confidential' && (
                          <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-md flex gap-2">
                            <Shield className="h-3.5 w-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-[11px] text-red-700 leading-snug">
                              Only the uploader and administrators can access this file.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Tags (optional)</label>
                      <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma separated tags" />
                    </div>

                    <Button
                      onClick={handleSingleUpload}
                      disabled={!singleFile || uploadFile.isPending}
                      className="w-full gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadFile.isPending ? 'Uploading...' : 'Upload File'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Recent Uploads
                    </CardTitle>
                    <CardDescription>Your latest uploaded files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filesData?.files && filesData.files.length > 0 ? (
                      <div className="space-y-3">
                        {filesData.files.slice(0, 5).map((file) => (
                          <div
                            key={file.fileId}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => setViewFile(file)}
                          >
                            <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.alias || file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.createdAt && format(new Date(file.createdAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {file.fileCategory || file.type || 'File'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileBox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No uploads yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bulk">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileIcon className="h-5 w-5" />
                      Bulk Upload
                    </CardTitle>
                    <CardDescription>Upload multiple files at once (max 10)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${isDraggingBulk ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleBulkDragOver}
                      onDragLeave={handleBulkDragLeave}
                      onDrop={handleBulkDrop}
                    >
                      <div className={`transition-transform duration-200 ${isDraggingBulk ? 'scale-110' : ''}`}>
                        <Cloud className={`h-12 w-12 mx-auto mb-4 transition-colors duration-200 ${isDraggingBulk ? 'text-blue-500' : 'text-gray-400'}`} />
                      </div>
                      <p className={`font-medium transition-colors duration-200 ${isDraggingBulk ? 'text-blue-600' : 'text-gray-600'}`}>
                        {isDraggingBulk ? 'Drop files here' : 'Drag & drop or click to select'}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">Up to 10 files (PDF, Word, Excel, PowerPoint, Images, Text, Archives)</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Selected Files ({bulkFiles.length}/10)
                    </CardTitle>
                    <CardDescription>
                      {bulkFiles.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearAllBulk} className="h-6 text-xs text-red-500 hover:text-red-600 cursor-pointer">
                          Clear All
                        </Button>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bulkFiles.length > 0 ? (
                      <div className="space-y-3">
                        {bulkFiles.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={item.alias || item.file.name}
                                onChange={(e) => updateBulkFile(item.id, { alias: e.target.value })}
                                className="w-full text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0"
                                placeholder="File name"
                              />
                              {item.error && <p className="text-xs text-red-500 mt-1">{item.error}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              {item.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                              {item.status === 'uploading' && <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                              {item.status === 'pending' && (
                                <Button variant="ghost" size="icon" onClick={() => removeBulkFile(item.id)} className="h-6 w-6 cursor-pointer">
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}

                        {bulkUploadProgress > 0 && bulkUploadProgress < 100 && (
                          <div className="space-y-2">
                            <Progress value={bulkUploadProgress} />
                            <p className="text-xs text-muted-foreground text-center">{bulkUploadProgress}%</p>
                          </div>
                        )}

                        <Button
                          onClick={handleBulkUpload}
                          disabled={bulkFiles.filter(f => f.status === 'pending').length === 0 || bulkUpload.isPending}
                          className="w-full gap-2"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          {bulkUpload.isPending ? 'Uploading...' : `Upload ${bulkFiles.filter(f => f.status === 'pending').length} Files`}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileBox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No files selected</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={!!viewFile} onOpenChange={() => setViewFile(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>File Details</DialogTitle>
            </DialogHeader>
            {viewFile && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <FileText className="h-10 w-10 text-blue-500" />
                  <div>
                    <p className="font-medium">{viewFile.name}</p>
                    <p className="text-sm text-gray-500">{viewFile.alias || 'No alias'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-medium">{viewFile.fileCategory || viewFile.type}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Confidentiality</p>
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

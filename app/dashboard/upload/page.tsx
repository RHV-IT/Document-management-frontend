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
  Cloud, FileText, Trash2, File, Layers, FileBox, ArrowUpCircle
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

interface FileStatus {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  preview?: string
}

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Single file state
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [alias, setAlias] = useState('')
  const [tags, setTags] = useState('')
  const [confidentiality, setConfidentiality] = useState('internal')
  const [activeTab, setActiveTab] = useState('single')
  const [isDraggingSingle, setIsDraggingSingle] = useState(false)

  // Bulk files state
  const [bulkFiles, setBulkFiles] = useState<FileStatus[]>([])
  const [isDraggingBulk, setIsDraggingBulk] = useState(false)

  // Page-level drag state
  const [isDraggingPage, setIsDraggingPage] = useState(false)

  // Dialog state
  const [viewFile, setViewFile] = useState<FileItem | null>(null)

  // Auth
  const { user } = useAuth()

  // Mutations
  const uploadFile = useUploadFileMutation()
  const bulkUpload = useBulkUploadMutation()

  // Queries
  const { data: filesData } = useFilesQuery({ limit: 10 })

  const generateId = () => Math.random().toString(36).substring(2, 15)

  // Single file handlers
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSingleFile(file)
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
      // Check if it's an accepted file type
      const acceptedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      if (acceptedTypes.includes(fileExtension) || file.type.startsWith('application/') || file.type.startsWith('text/')) {
        setSingleFile(file)
      }
    }
  }

  const handleSingleUpload = () => {
    if (!singleFile) return
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

  // Bulk file handlers
  const handleBulkFileSelect = async (files: FileList | null) => {
    if (!files) return
    const newFiles: FileStatus[] = Array.from(files).map(file => ({
      file,
      id: generateId(),
      status: 'pending' as const
    }))
    setBulkFiles(prev => [...prev, ...newFiles])
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

  const removeBulkFile = (id: string) => {
    setBulkFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleBulkUpload = () => {
    const files = bulkFiles.map(f => f.file)
    setBulkFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })))
    bulkUpload.mutate(files, {
      onSuccess: () => {
        setBulkFiles(prev => prev.map(f => ({ ...f, status: 'success' as const })))
      },
      onError: (error: any) => {
        setBulkFiles(prev => prev.map(f => ({
          ...f,
          status: 'error' as const,
          error: error.response?.data?.message
        })))
      }
    })
  }

  const clearAllBulk = () => setBulkFiles([])

  // Page-level drag handlers
  const handlePageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isDraggingSingle && !isDraggingBulk) {
      setIsDraggingPage(true)
    }
  }

  const handlePageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // Only hide if we're actually leaving the page
    if (e.clientX === 0 && e.clientY === 0) {
      setIsDraggingPage(false)
    }
  }

  const handlePageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingPage(false)
  }

  return (
    <ResponsiveContainer>
      <div
        className={`flex-1 p-8 bg-gradient-to-br from-gray-50/80 to-gray-100/50 overflow-auto animate-fade-in relative ${isDraggingPage ? 'bg-blue-50/30' : ''
          }`}
        onDragOver={handlePageDragOver}
        onDragLeave={handlePageDragLeave}
        onDrop={handlePageDrop}
      >
        {/* Page-level drag overlay */}
        {isDraggingPage && (
          <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[2px] flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded-2xl p-8 shadow-2xl border border-blue-200 animate-in fade-in-0 zoom-in-95 duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Cloud className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Drop files anywhere on the page</h3>
                <p className="text-gray-600">Drag files to the upload areas below</p>
              </div>
            </div>
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Upload Files
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Choose your upload method below</p>
        </div>

        {/* Upload Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setActiveTab('single')}
            className={cn(
              "group relative p-6 rounded-2xl border-2 shadow-sm transition-all duration-300 cursor-pointer text-left",
              activeTab === 'single'
                ? "bg-white border-blue-400 shadow-lg shadow-blue-500/10"
                : "bg-white border-gray-100 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10"
            )}
          >
            <div className="absolute top-4 right-4 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <File className="h-5 w-5 text-blue-600" />
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
              <ArrowUpCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Single</h3>
            <p className="text-sm text-gray-500 mt-1">Upload one file with metadata</p>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={cn(
              "group relative p-6 rounded-2xl border-2 shadow-sm transition-all duration-300 cursor-pointer text-left",
              activeTab === 'bulk'
                ? "bg-white border-purple-400 shadow-lg shadow-purple-500/10"
                : "bg-white border-gray-100 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10"
            )}
          >
            <div className="absolute top-4 right-4 w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
              <FileBox className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Bulk</h3>
            <p className="text-sm text-gray-500 mt-1">Upload multiple files (max 10)</p>
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden">
            <TabsTrigger value="single" />
            <TabsTrigger value="bulk" />
          </TabsList>

          {/* Single Upload */}
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
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${isDraggingSingle
                        ? 'border-blue-500 bg-blue-50 scale-105'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                      }`}
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
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    />
                    <div className={`transition-transform duration-200 ${isDraggingSingle ? 'scale-110' : ''}`}>
                      <Cloud className={`h-12 w-12 mx-auto mb-4 transition-colors duration-200 ${isDraggingSingle ? 'text-blue-500' : 'text-gray-400'
                        }`} />
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
                        <p className={`font-medium transition-colors duration-200 ${isDraggingSingle ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                          {isDraggingSingle ? 'Drop your file here' : 'Drag & drop or click to select'}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">PDF, Word, Excel, PowerPoint, Text files</p>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Rename (optional)</label>
                      <Input
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        placeholder="File name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Confidentiality</label>
                      <ConfidentialityLevelSelect
                        value={confidentiality}
                        onValueChange={setConfidentiality}
                        userLevel={user?.confidentialityLevel}
                        placeholder="Select level"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Tags (optional)</label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Comma separated tags"
                    />
                  </div>

                  <Button
                    onClick={handleSingleUpload}
                    disabled={!singleFile || uploadFile.isPending}
                    className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadFile.isPending ? 'Uploading...' : 'Upload File'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Recent Files</CardTitle>
                </CardHeader>
                <CardContent>
                  {filesData?.files && filesData.files.length > 0 ? (
                    <div className="space-y-3">
                      {filesData.files.slice(0, 8).map((file) => (
                        <div
                          key={file.fileId}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                          onClick={() => setViewFile(file)}
                        >
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">{format(new Date(file.createdAt), 'MMM d, yyyy')}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{file.confidentialityLevel}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No files uploaded yet</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bulk Upload */}
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
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${isDraggingBulk
                        ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                      }`}
                    onDragOver={handleBulkDragOver}
                    onDragLeave={handleBulkDragLeave}
                    onDrop={handleBulkDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleBulkFilesChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    />
                    <div className={`transition-transform duration-200 ${isDraggingBulk ? 'scale-110' : ''}`}>
                      <Cloud className={`h-12 w-12 mx-auto mb-4 transition-colors duration-200 ${isDraggingBulk ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                    </div>
                    <p className={`font-medium transition-colors duration-200 ${isDraggingBulk ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                      {isDraggingBulk ? 'Drop your files here' : 'Drag & drop or click to browse'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Maximum 10 files • PDF, Word, Excel, PowerPoint, Text</p>
                  </div>

                  {bulkFiles.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Selected Files ({bulkFiles.length})</p>
                        <Button variant="ghost" size="sm" onClick={clearAllBulk} className="cursor-pointer text-red-600">
                          <Trash2 className="h-4 w-4 mr-1" /> Clear
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {bulkFiles.map((file) => (
                          <div key={file.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <FileIcon className="h-4 w-4 text-gray-400" />
                            <span className="flex-1 text-sm truncate">{file.file.name}</span>
                            {file.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                            {file.status === 'pending' && (
                              <Button variant="ghost" size="icon" onClick={() => removeBulkFile(file.id)} className="cursor-pointer h-6 w-6">
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={handleBulkUpload}
                        disabled={bulkUpload.isPending || bulkFiles.every(f => f.status !== 'pending')}
                        className="w-full mt-4 cursor-pointer bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {bulkUpload.isPending ? 'Uploading...' : `Upload ${bulkFiles.filter(f => f.status === 'pending').length} Files`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle>Recent Uploads</CardTitle></CardHeader>
                <CardContent>
                  {filesData?.files && filesData.files.length > 0 ? (
                    <div className="space-y-3">
                      {filesData.files.slice(0, 8).map((file) => (
                        <div key={file.fileId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">{format(new Date(file.createdAt), 'MMM d, h:mm a')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No uploads yet</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>




        </Tabs>

        {/* File Details Dialog */}
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
                    <p className="font-medium">{viewFile.type}</p>
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

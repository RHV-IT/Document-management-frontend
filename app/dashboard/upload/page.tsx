'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUploadFileMutation, useBulkUploadMutation, useFilesQuery } from '@/hooks/useFiles'
import { useUploadToPendingMutation, useBulkUploadToPendingMutation, useScannerFilesQuery } from '@/hooks/useScanner'
import { ConfidentialityLevelSelect } from '@/components/ui/ConfidentialityLevelSelect'
import type { ScannerPendingItem } from '@/services/api/files'
import { 
  Upload, X, FileIcon, CheckCircle, AlertCircle, 
  Cloud, FileText, Trash2, Image, File, FolderOpen,
  ScanLine, Layers, FileBox, ArrowUpCircle
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
  const scanInputRef = useRef<HTMLInputElement>(null)
  
  // Single file state
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [alias, setAlias] = useState('')
  const [tags, setTags] = useState('')
  const [confidentiality, setConfidentiality] = useState('internal')
  const [activeTab, setActiveTab] = useState('single')
  
  // Bulk files state
  const [bulkFiles, setBulkFiles] = useState<FileStatus[]>([])
  const [isDraggingBulk, setIsDraggingBulk] = useState(false)
  
  // Scan files state
  const [scanFiles, setScanFiles] = useState<FileStatus[]>([])
  const [isDraggingScan, setIsDraggingScan] = useState(false)
  
  // Dialog state
  const [viewFile, setViewFile] = useState<FileItem | null>(null)
  const [viewScanFile, setViewScanFile] = useState<ScannerPendingItem | null>(null)
  
  // Auth
  const { user } = useAuth()

  // Mutations
  const uploadFile = useUploadFileMutation()
  const bulkUpload = useBulkUploadToPendingMutation()
  const uploadScan = useUploadToPendingMutation()

  // Queries
  const { data: filesData } = useFilesQuery({ limit: 10 })
  const { data: scannerFiles } = useScannerFilesQuery({ limit: 10 })

  const generateId = () => Math.random().toString(36).substring(2, 15)

  // Single file handlers
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSingleFile(file)
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
    bulkUpload(files, {
      onSuccess: () => {
        setBulkFiles(prev => prev.map(f => ({ ...f, status: 'success' as const })))
      },
      onError: (error) => {
        setBulkFiles(prev => prev.map(f => ({ 
          ...f, 
          status: 'error' as const,
          error: error.response?.data?.message
        })))
      }
    })
  }

  // Scan file handlers
  const getFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        resolve('')
      }
    })
  }

  const handleScanFileSelect = async (files: FileList | null) => {
    if (!files) return
    const newFiles: FileStatus[] = await Promise.all(
      Array.from(files).map(async (file) => ({
        file,
        id: generateId(),
        status: 'pending' as const,
        preview: await getFilePreview(file)
      }))
    )
    setScanFiles(prev => [...prev, ...newFiles])
  }

  const handleScanFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleScanFileSelect(e.target.files)
    if (scanInputRef.current) scanInputRef.current.value = ''
  }

  const handleScanDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingScan(true)
  }

  const handleScanDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingScan(false)
  }

  const handleScanDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingScan(false)
    await handleScanFileSelect(e.dataTransfer.files)
  }

  const removeScanFile = (id: string) => {
    setScanFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleScanUpload = () => {
    const files = scanFiles.map(f => f.file)
    setScanFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })))
    files.forEach((file, idx) => {
      uploadScan({ file, onProgress: (progress) => {
        // Progress tracking could be added here
      }}, {
        onSuccess: () => {
          setScanFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'success' as const } : f))
        },
        onError: (error) => {
          setScanFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'error' as const, error: error.response?.data?.message } : f))
        }
      })
    })
  }

  const clearAllBulk = () => setBulkFiles([])
  const clearAllScan = () => setScanFiles([])

  return (
    <ResponsiveContainer>
      <div className="flex-1 p-8 bg-gradient-to-br from-gray-50/80 to-gray-100/50 overflow-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Upload Files
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Choose your upload method below</p>
      </div>

      {/* Upload Type Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        <button
          onClick={() => setActiveTab('scan')}
          className={cn(
            "group relative p-6 rounded-2xl border-2 shadow-sm transition-all duration-300 cursor-pointer text-left",
            activeTab === 'scan' 
              ? "bg-white border-green-400 shadow-lg shadow-green-500/10" 
              : "bg-white border-gray-100 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10"
          )}
        >
          <div className="absolute top-4 right-4 w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <ScanLine className="h-5 w-5 text-green-600" />
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 mb-4">
            <Image className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">Scan</h3>
          <p className="text-sm text-gray-500 mt-1">Upload scanned document</p>
        </button>

        <button
          onClick={() => setActiveTab('bulkScan')}
          className={cn(
            "group relative p-6 rounded-2xl border-2 shadow-sm transition-all duration-300 cursor-pointer text-left",
            activeTab === 'bulkScan' 
              ? "bg-white border-orange-400 shadow-lg shadow-orange-500/10" 
              : "bg-white border-gray-100 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/10"
          )}
        >
          <div className="absolute top-4 right-4 w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <FolderOpen className="h-5 w-5 text-orange-600" />
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4">
            <ScanLine className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">Bulk Scan</h3>
          <p className="text-sm text-gray-500 mt-1">Multiple scanned files (max 20)</p>
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden">
          <TabsTrigger value="single" />
          <TabsTrigger value="bulk" />
          <TabsTrigger value="scan" />
          <TabsTrigger value="bulkScan" />
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
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => document.getElementById('single-file-input')?.click()}
                >
                  <input
                    id="single-file-input"
                    type="file"
                    className="hidden"
                    onChange={handleSingleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  />
                  <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                      <p className="text-gray-600 font-medium">Click to select a file</p>
                      <p className="text-sm text-gray-400 mt-2">PDF, Word, Excel, PowerPoint, Text</p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Alias (optional)</label>
                    <Input
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="File alias"
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
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDraggingBulk ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
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
                  <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Drop files here or click to browse</p>
                  <p className="text-sm text-gray-400 mt-2">Maximum 10 files</p>
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

        {/* Scan Upload */}
        <TabsContent value="scan">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Scan Upload
                </CardTitle>
                <CardDescription>Upload a scanned document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => document.getElementById('scan-file-input')?.click()}
                >
                  <input
                    id="scan-file-input"
                    type="file"
                    className="hidden"
                    onChange={handleScanFilesChange}
                    accept="image/*,.pdf"
                  />
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Click to select scanned file</p>
                  <p className="text-sm text-gray-400 mt-2">PDF, JPG, PNG</p>
                </div>

                {scanFiles.length > 0 && (
                  <div className="space-y-2">
                    {scanFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        {file.preview ? (
                          <img src={file.preview} alt="" className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <FileIcon className="h-10 w-10 text-gray-400" />
                        )}
                        <span className="flex-1 text-sm truncate">{file.file.name}</span>
                        {file.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {file.status === 'pending' && (
                          <Button variant="ghost" size="icon" onClick={() => removeScanFile(file.id)} className="cursor-pointer">
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleScanUpload}
                  disabled={uploadScan.isPending || scanFiles.filter(f => f.status === 'pending').length === 0}
                  className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadScan.isPending ? 'Uploading...' : 'Upload Scanned Document'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Recent Scans</CardTitle></CardHeader>
              <CardContent>
                {scannerFiles && scannerFiles.length > 0 ? (
                  <div className="space-y-3">
                    {scannerFiles.slice(0, 8).map((file) => (
                      <div 
                        key={file._id} 
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => setViewScanFile(file)}
                      >
                        {file.isImage ? (
                          <Image className="h-5 w-5 text-green-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-blue-500" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <p className="text-xs text-gray-400">{format(new Date(file.createdAt), 'MMM d, h:mm a')}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{file.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No scanned documents yet</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bulk Scan */}
        <TabsContent value="bulkScan">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Bulk Scan Upload
                </CardTitle>
                <CardDescription>Upload multiple scanned documents (max 20)</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDraggingScan ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleScanDragOver}
                  onDragLeave={handleScanDragLeave}
                  onDrop={handleScanDrop}
                  onClick={() => scanInputRef.current?.click()}
                >
                  <input
                    ref={scanInputRef}
                    type="file"
                    multiple
                    onChange={handleScanFilesChange}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Drop scanned files here or click to browse</p>
                  <p className="text-sm text-gray-400 mt-2">Maximum 20 files, PDF, JPG, PNG</p>
                </div>

                {scanFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Selected Files ({scanFiles.length})</p>
                      <Button variant="ghost" size="sm" onClick={clearAllScan} className="cursor-pointer text-red-600">
                        <Trash2 className="h-4 w-4 mr-1" /> Clear
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {scanFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          {file.preview ? (
                            <img src={file.preview} alt="" className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <FileIcon className="h-10 w-10 text-gray-400" />
                          )}
                          <span className="flex-1 text-sm truncate">{file.file.name}</span>
                          {file.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                          {file.status === 'pending' && (
                            <Button variant="ghost" size="icon" onClick={() => removeScanFile(file.id)} className="cursor-pointer h-6 w-6">
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleScanUpload}
                      disabled={uploadScan.isPending || scanFiles.filter(f => f.status === 'pending').length === 0}
                      className="w-full mt-4 cursor-pointer bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadScan.isPending ? 'Uploading...' : `Upload ${scanFiles.filter(f => f.status === 'pending').length} Scanned Files`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Recent Scanned Documents</CardTitle></CardHeader>
              <CardContent>
                {scannerFiles && scannerFiles.length > 0 ? (
                  <div className="space-y-3">
                    {scannerFiles.slice(0, 8).map((file) => (
                      <div 
                        key={file._id} 
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => setViewScanFile(file)}
                      >
                        {file.isImage ? (
                          <Image className="h-5 w-5 text-green-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-blue-500" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <p className="text-xs text-gray-400">{format(new Date(file.createdAt), 'MMM d, h:mm a')}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{file.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No scanned documents yet</div>
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

      {/* Scanner File View Dialog */}
      <Dialog open={!!viewScanFile} onOpenChange={() => setViewScanFile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scanned File Details</DialogTitle>
          </DialogHeader>
          {viewScanFile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                {viewScanFile.isImage ? (
                  <Image className="h-10 w-10 text-green-500" />
                ) : (
                  <FileText className="h-10 w-10 text-blue-500" />
                )}
                <div>
                  <p className="font-medium">{viewScanFile.fileName}</p>
                  <p className="text-sm text-gray-500">{viewScanFile.status}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium">{viewScanFile.mimeType}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Size</p>
                  <p className="font-medium">{(viewScanFile.fileSize / 1024).toFixed(1)} KB</p>
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

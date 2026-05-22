'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import {
  useFilesQuery,
  useArchiveFilesQuery,
  useDeleteFileMutation,
  useDownloadFileMutation,
  useRevokePermissionMutation,
  useVersionHistoryQuery,
  useRollbackVersionMutation,
  useUploadFileMutation
} from '@/hooks/useFiles'

import {
  useMyPermissionsQuery,
  useMySentPermissionsQuery,
  useGrantPermissionMutation
} from '@/hooks/usePermissions'

import { useUsersQuery as useUsersListQuery } from '@/hooks/useUsers'
import { useConfidentialityLevelsConfigQuery } from '@/hooks/useSettings'
import {
  usePendingScans,
  useScannerPendingStatsQuery,
  useScannerConfirmMutation,
  useScannerCancelMutation
} from '@/hooks/useScanner'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'

// Icons
import {
  Download, Trash2, Share2, MoreHorizontal, X, Search, Users, Scan, FileCheck,
  AlertCircle, Loader2, File, FileSpreadsheet, FileCode, FileArchive,
  Presentation, Upload, Eye, FolderOpen, LayoutGrid, List, Image as ImageIcon,
  FileText, Archive, User, Building2
} from 'lucide-react'

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'



import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { formatDistanceToNow } from 'date-fns'
import { formatBytes, getMachineId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useAccessControl } from '@/hooks/useAccessControl'
import { addNotification } from '@/components/notifications/NotificationCenter'
import { FileItem } from '@/services/api/files'
import { Lock, Shield } from 'lucide-react'
import { ScannerConfirmModal } from '@/components/scanner/ScannerConfirmModal'

// Helper Functions
function getConfidentialityColor(level: any): string {
  const colors: Record<string, string> = {
    public: 'bg-green-100 text-green-700',
    internal: 'bg-blue-100 text-blue-700',
    confidential: 'bg-orange-100 text-orange-700',
    highly_confidential: 'bg-red-100 text-red-700'
  }
  return ['public', 'internal', 'confidential', 'highly_confidential'].includes(level)
    ? colors[level]
    : 'bg-gray-100 text-gray-700'
}

function getConfidentialityLabel(level: any): string {
  const labels: Record<string, string> = {
    public: 'Everyone Can See',
    internal: 'Company Only',
    confidential: 'Limited Access Only',
    highly_confidential: 'Very Secret - Few People Only'
  }
  return ['public', 'internal', 'confidential', 'highly_confidential'].includes(level)
    ? labels[level]
    : 'Unknown'
}

export default function FilesPage() {
  const [activeTab, setActiveTab] = useState('myfiles')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [confidentialityFilter, setConfidentialityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [accessLevel, setAccessLevel] = useState<'view' | 'download' | 'edit'>('view')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'pdf' | 'image' | 'viewer' | 'unsupported' | null>(null)
  const [scannerModalOpen, setScannerModalOpen] = useState(false)
  const [pendingScannerFile, setPendingScannerFile] = useState<any | null>(null)

  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  // Auth
  const { user } = useAuth()
  const { canView, filterFiles, clearanceBadge, isAdmin, userDepartment } = useAccessControl()

  // Queries
  const { data: usersData } = useUsersListQuery({ search: undefined, limit: 50 })
  const { data: confidentialityLevels } = useConfidentialityLevelsConfigQuery()

  const { data: ownedFilesData, isLoading: ownedLoading } = useFilesQuery({
    owner: user?._id,
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    confidentiality: confidentialityFilter !== 'all' ? confidentialityFilter : undefined,
  })

  const { data: myPermissionsData } = useMyPermissionsQuery()
  const { data: sentPermissionsData } = useMySentPermissionsQuery()

  const { data: scannedFilesData, isLoading: scannedLoading } = useFilesQuery({
    isScanned: true,
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  })

  const { data: scannerFilesData = [], isLoading: scannerLoading } = usePendingScans()
  const { data: scannerStatsData } = useScannerPendingStatsQuery()



  const { data: versionHistoryData = [] } = useVersionHistoryQuery(selectedFile?.fileId || '')

  // Archive files filters
  const [archiveSearch, setArchiveSearch] = useState('')
  const [archiveConfidentiality, setArchiveConfidentiality] = useState('')
  const [archiveDepartment, setArchiveDepartment] = useState('')
  const [archiveUploadedBy, setArchiveUploadedBy] = useState('')
  const [archiveSortBy, setArchiveSortBy] = useState<'newest' | 'oldest'>('newest')
  const [archiveRestrictedOnly, setArchiveRestrictedOnly] = useState(false)

  // Archive files query
  const { data: archiveFilesData, isLoading: archiveLoading } = useArchiveFilesQuery({
    page: 1,
    limit: 50,
    search: archiveSearch || undefined,
    confidentialityLevel: archiveConfidentiality || undefined,
    department: archiveDepartment || undefined,
    uploadedBy: archiveUploadedBy || undefined,
    sortBy: 'createdAt',
    sortOrder: archiveSortBy === 'newest' ? 'desc' : 'asc',
    restrictedOnly: archiveRestrictedOnly || undefined,
  })

  // Mutations
  const uploadFile = useUploadFileMutation()
  const deleteFile = useDeleteFileMutation()
  const downloadFile = useDownloadFileMutation()
  const revokePermission = useRevokePermissionMutation()
  const grantPermission = useGrantPermissionMutation()
  const rollbackVersion = useRollbackVersionMutation()
  const scannerConfirm = useScannerConfirmMutation()
  const scannerCancel = useScannerCancelMutation()


  // Data - strict frontend filtering applied before any render/pagination/counters/search
  const ownedRaw = ownedFilesData?.files || []
  const ownedFiles = useMemo(() => filterFiles(ownedRaw as any), [ownedRaw, filterFiles])
  const scannedRaw = scannedFilesData?.files || []
  const scannedFiles = useMemo(() => filterFiles(scannedRaw as any), [scannedRaw, filterFiles])
  const scannedOnlyFiles = useMemo(() => scannedFiles.filter((f: any) => f.isScanned === true), [scannedFiles])
  const scannerFiles = scannerFilesData || []
  const scannerStats = scannerStatsData || { pending: 0 }

  const ownedTotal = ownedFilesData?.total || 0
  const archiveRaw = archiveFilesData?.files || []
  const archiveFiles = useMemo(() => filterFiles(archiveRaw as any), [archiveRaw, filterFiles])

  // Build permission lists
  const buildList = useCallback((data: any) => {
    if (!Array.isArray(data)) return []
    return data.filter((p: any) => p.fileId && typeof p.fileId === 'object')
      .map((p: any) => ({
        ...(p.fileId),
        permissionId: p._id,
        permission: p.access,
        grantedBy: p.grantedBy,
        grantedTo: p.userId
      }))
  }, [])

  // Shared files (received/sent via explicit permissions) always visible — sharing is the only exception to dept/confidentiality rules
  const receivedFilesList = useMemo(() => buildList(myPermissionsData || []), [myPermissionsData, buildList])
  const sentFilesList = useMemo(() => buildList(sentPermissionsData || []), [sentPermissionsData, buildList])

  const availableUsers = useMemo(() => {
    const usersList = usersData?.users || []
    const existing = new Set((myPermissionsData || []).map((p: any) => p.userId?._id || p.userId).filter(Boolean))
    return usersList.filter((u: any) => u._id && u._id !== user?._id && !existing.has(u._id))
  }, [usersData, myPermissionsData, user])

  const stats = useMemo(() => ({
    total: ownedFiles.length,
    scanned: scannedOnlyFiles.length,
    sharedWithMe: receivedFilesList.length,
    sharedByMe: sentFilesList.length,
    pending: scannerStats.pending || scannerFiles.length
  }), [ownedFiles.length, scannedOnlyFiles.length, receivedFilesList.length, sentFilesList.length, scannerStats.pending, scannerFiles])

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragOver) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set drag over to false if we're leaving the main container
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file) {
        handleFileUpload(file)
      }
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  // Handlers
  const handleFileUpload = (file: File) => {
    if (!file) {
      addNotification('error', 'Upload Failed', 'No file selected')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('alias', file.name || '')
    formData.append('tags', JSON.stringify([]))
    formData.append('confidentialityLevel', 'internal')

    uploadFile.mutate(formData, {
      onSuccess: () => {
        addNotification('success', 'Upload Complete', 'File uploaded successfully.')
        setIsUploading(false)
        setUploadProgress(null)
      },
      onError: (error: any) => {
        const message = error?.message || 'Failed to upload file'
        addNotification('error', 'Upload Failed', message)
        setIsUploading(false)
        setUploadProgress(null)
      }
    })
  }

  const getFileIcon = (file: FileItem) => {
    const type = file.type?.toLowerCase() || ''
    const name = file.name?.toLowerCase() || ''

    if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) return <ImageIcon className="h-8 w-8 text-blue-500" />
    if (type.includes('pdf') || name.endsWith('.pdf')) return <File className="h-8 w-8 text-red-500" />
    if (type.includes('sheet') || name.match(/\.(xls|xlsx)$/)) return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    if (type.includes('word') || name.match(/\.(doc|docx)$/)) return <FileText className="h-8 w-8 text-blue-600" />
    if (type.includes('presentation') || name.match(/\.(ppt|pptx)$/)) return <Presentation className="h-8 w-8 text-orange-500" />
    if (name.match(/\.(zip|rar|7z)$/)) return <FileArchive className="h-8 w-8 text-purple-500" />
    if (type.includes('text') || name.match(/\.(txt|rtf|md)$/)) return <FileCode className="h-8 w-8 text-gray-500" />
    return <File className="h-8 w-8 text-gray-400" />
  }

  const detectPreviewType = (file: FileItem): 'pdf' | 'image' | 'viewer' | 'unsupported' => {
    const mimeType = (file.type || '').toLowerCase()
    const name = (file.name || '').toLowerCase()
    const extension = name.split('.').pop() || ''
    if (mimeType.includes('pdf') || extension === 'pdf') return 'pdf'
    if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) return 'image'
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'md'].includes(extension)) return 'viewer'
    return 'unsupported'
  }

  const handlePreview = async (file: FileItem) => {
    if (!canView(file)) {
      addNotification('error', 'Access Denied', 'You do not have permission to access this file.')
      return
    }
    if (file.restricted) {
      addNotification('warning', 'Access Restricted', file.restrictionReason || 'Cannot preview highly confidential files.')
      return
    }

    setPreviewFile(file)
    setPreviewError(null)
    setBlobUrl(null)
    setPreviewLoading(true)
    const type = detectPreviewType(file)
    setPreviewType(type)
    if (type === 'unsupported') {
      setPreviewLoading(false)
      return
    }
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rhv-dms-backend.vercel.app'

      if (type === 'pdf' || type === 'image') {
        const response = await fetch(`${baseUrl}/api/v1/files/${file.fileId}/preview`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!response.ok) throw new Error(`Failed to load: ${response.status}`)
        const blob = await response.blob()
        setBlobUrl(window.URL.createObjectURL(blob))
      } else {
        const response = await fetch(`${baseUrl}/api/v1/files/${file.fileId}/preview/google`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!response.ok) throw new Error(`Failed to load preview: ${response.status}`)
        const html = await response.text()
        const blob = new Blob([html], { type: 'text/html' })
        setBlobUrl(window.URL.createObjectURL(blob))
      }
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to load preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreview = () => {
    if (blobUrl) window.URL.revokeObjectURL(blobUrl)
    setPreviewFile(null)
    setPreviewError(null)
    setBlobUrl(null)
    setPreviewType(null)
  }

  const handleDownload = (fileId: string, fileName: string) => {
    downloadFile.mutate(fileId, {
      onSuccess: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    })
  }

  const handleDelete = (fileId: string) => deleteFile.mutate({ fileId })

  const openShareDialog = (file: FileItem) => {
    if (file.restricted) {
      addNotification('warning', 'Access Restricted', file.restrictionReason || 'Cannot share highly confidential files.')
      return
    }

    setSelectedFile(file)
    setShareDialogOpen(true)
    setSelectedUsers([])
  }

  const toggleUserSelection = (userId: string) =>
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId])

  const handleShare = () => {
    if (!selectedFile) return
    selectedUsers.forEach(userId => grantPermission.mutate({ fileId: selectedFile.fileId, userId, access: accessLevel }))
    setShareDialogOpen(false)
    setSelectedUsers([])
    setSelectedFile(null)
  }

  const handleRevoke = (permissionId: string) => {
    revokePermission.mutate(permissionId, {
      onSuccess: () => addNotification('success', 'Access Revoked', 'File access has been revoked.')
    })
    setRevokeConfirm(null)
  }

  const openScannerModal = (file: any) => {
    setPendingScannerFile(file)
    setScannerModalOpen(true)
  }

  const handleScannerConfirm = (data: any) =>
    scannerConfirm.mutate(data, {
      onSuccess: () => {
        setScannerModalOpen(false)
        setPendingScannerFile(null)
      }
    })

  const handleScannerCancel = (id: string) =>
    scannerCancel.mutate(id, {
      onSuccess: () => {
        setScannerModalOpen(false)
        setPendingScannerFile(null)
      }
    })



  return (
    <ResponsiveContainer>
      <div
        className="flex-1 flex flex-col min-h-0 bg-background relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-primary rounded-lg m-4 pointer-events-none">
            <div className="text-center">
              <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-lg font-semibold text-primary">Drop file here to upload</p>
              <p className="text-sm text-muted-foreground">Release to start uploading</p>
            </div>
          </div>
        )}
        {/* File Input */}
        <input
          type="file"
          id="file-input"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
            e.target.value = ''
          }}
        />

        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Files</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage and organize all your documents</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isUploading && uploadProgress !== null && (
                  <div className="flex items-center gap-3 text-sm">
                    <span>Uploading...</span>
                    <Progress value={uploadProgress} className="w-24 h-2" />
                    <span>{uploadProgress}%</span>
                  </div>
                )}
                <Button className="gap-2" onClick={() => document.getElementById('file-input')?.click()} disabled={isUploading}>
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">New Upload</span>
                </Button>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="File Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="doc,docx">Document</SelectItem>
                  <SelectItem value="xls,xlsx">Spreadsheet</SelectItem>
                  <SelectItem value="ppt,pptx">Presentation</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>

              <Select value={confidentialityFilter} onValueChange={setConfidentialityFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Confidentiality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {confidentialityLevels?.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: {
                              public: '#10b981',
                              internal: '#3b82f6',
                              confidential: '#f59e0b',
                              highly_confidential: '#ef4444'
                            }[level.value] || '#6b7280'
                          }}
                        />
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode - Affects All Tabs */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total Files', value: stats.total, icon: File, color: 'bg-blue-500/10 text-blue-500' },
              { label: 'Scanned Files', value: stats.scanned, icon: Scan, color: 'bg-green-500/10 text-green-500' },
              { label: 'Shared With Me', value: stats.sharedWithMe, icon: Users, color: 'bg-purple-500/10 text-purple-500' },
              { label: 'Files I Shared', value: stats.sharedByMe, icon: Share2, color: 'bg-orange-500/10 text-orange-500' },
              { label: 'Pending Scans', value: stats.pending, icon: Loader2, color: 'bg-amber-500/10 text-amber-500' }
            ].map((stat, i) => (
              <Card key={i} className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-muted/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-6 flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-xl bg-muted p-1 mb-4">
              <TabsTrigger value="myfiles">My Files</TabsTrigger>
              <TabsTrigger value="received">Shared With Me</TabsTrigger>
              <TabsTrigger value="sent">Shared By Me</TabsTrigger>
              <TabsTrigger value="scanned">Scanned Files</TabsTrigger>
              <TabsTrigger value="scanner">Pending Scans</TabsTrigger>
              <TabsTrigger value="archive">Archive</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto rounded-2xl bg-card border min-h-0">

              {/* ==================== MY FILES ==================== */}
              <TabsContent value="myfiles" className="m-0 h-full flex flex-col">
                {ownedLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : ownedFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center p-6">
                      <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No files found</p>
                      <p className="text-sm">Upload your first file</p>
                    </div>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="divide-y">
                    {ownedFiles.map((f: any) => (
                      <div key={f.fileId} className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors group">
                        <div className="p-2 bg-muted rounded-xl">{getFileIcon(f)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{f.alias || f.name}</span>
                            <Badge variant="outline" className="text-xs">{f.type}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{formatBytes(f.size)}</span>
                            <span>{f.confidentialityLevel ? getConfidentialityLabel(f.confidentialityLevel) : '-'}</span>
                            <span>{f.createdAt ? formatDistanceToNow(new Date(f.createdAt)) + ' ago' : ''}</span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handlePreview(f)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(f.fileId, f.name)}><Download className="h-4 w-4" /></Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openShareDialog(f)}>Share</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedFile(f); setVersionHistoryOpen(true) }}>Version History</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(f.fileId)} className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {ownedFiles.map((f: any) => (
                      <Card key={f.fileId} className="group overflow-hidden border-0 bg-card hover:shadow-xl transition-all duration-300">
                        <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
                          <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                            {getFileIcon(f)}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold truncate">{f.alias || f.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{f.name}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0">{f.type}</Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <File className="h-3 w-3" />
                              <span className="truncate">{formatBytes(f.size)}</span>
                            </div>
                            {f.confidentialityLevel && (
                              <Badge className={cn("w-fit", getConfidentialityColor(f.confidentialityLevel))}>
                                {getConfidentialityLabel(f.confidentialityLevel)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => handlePreview(f)}>
                              <Eye className="h-3 w-3" /> Preview
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="px-2">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownload(f.fileId, f.name)}>
                                  <Download className="h-4 w-4 mr-2" /> Download
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openShareDialog(f)}>
                                  <Share2 className="h-4 w-4 mr-2" /> Share
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedFile(f); setVersionHistoryOpen(true) }}>
                                  Versions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(f.fileId)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ==================== SHARED WITH ME ==================== */}
              <TabsContent value="received" className="m-0 h-full flex flex-col p-6">
                {receivedFilesList.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center p-6">
                      <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">Nothing shared with you yet</p>
                    </div>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="space-y-3">
                    {receivedFilesList.map((f: any) => (
                      <Card key={f.permissionId} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-xl">{getFileIcon(f)}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{f.name}</p>
                                {f.confidentialityLevel && (
                                  <Badge className={cn("text-xs", getConfidentialityColor(f.confidentialityLevel))}>
                                    {getConfidentialityLabel(f.confidentialityLevel)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">Shared by {f.grantedBy?.name || 'Unknown'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handlePreview(f)}>Preview</Button>
                            <Button size="sm" onClick={() => handleDownload(f.fileId, f.name)}>Download</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {receivedFilesList.map((f: any) => (
                      <Card key={f.permissionId} className="group overflow-hidden">
                        <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
                          <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl">{getFileIcon(f)}</div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{f.name}</p>
                            {f.confidentialityLevel && (
                              <Badge className={cn("text-xs shrink-0", getConfidentialityColor(f.confidentialityLevel))}>
                                {getConfidentialityLabel(f.confidentialityLevel)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">By {f.grantedBy?.name}</p>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => handlePreview(f)}>Preview</Button>
                            <Button size="sm" className="flex-1" onClick={() => handleDownload(f.fileId, f.name)}>Download</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ==================== FILES I SHARED ==================== */}
              <TabsContent value="sent" className="m-0 h-full flex flex-col p-6">
                {sentFilesList.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center p-6">
                      <Share2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">You haven't shared any files yet</p>
                    </div>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="space-y-3">
                    {sentFilesList.map((f: any) => (
                      <Card key={f.permissionId} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-xl">{getFileIcon(f)}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{f.name}</p>
                                {f.confidentialityLevel && (
                                  <Badge className={cn("text-xs", getConfidentialityColor(f.confidentialityLevel))}>
                                    {getConfidentialityLabel(f.confidentialityLevel)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">Shared with {f.grantedTo?.name || f.grantedTo?.email || 'Unknown'}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setRevokeConfirm(f.permissionId)}>Revoke</Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sentFilesList.map((f: any) => (
                      <Card key={f.permissionId} className="group overflow-hidden">
                        <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
                          <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl">{getFileIcon(f)}</div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{f.name}</p>
                            {f.confidentialityLevel && (
                              <Badge className={cn("text-xs shrink-0", getConfidentialityColor(f.confidentialityLevel))}>
                                {getConfidentialityLabel(f.confidentialityLevel)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">To {f.grantedTo?.name}</p>
                          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setRevokeConfirm(f.permissionId)}>
                            Revoke Access
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ==================== PENDING SCANS ==================== */}
              <TabsContent value="scanner" className="m-0 h-full flex flex-col p-6">
                {scannerLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : scannerFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center p-6">
                      <Scan className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No pending scans</p>
                      <p className="text-sm">Files scanned with the agent will appear here for review</p>
                    </div>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="space-y-3">
                    {scannerFiles.map((f: any) => (
                      <Card key={f._id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-xl">
                              {f.isImage ? <ImageIcon className="h-8 w-8 text-amber-500" /> : <File className="h-8 w-8 text-amber-500" />}
                            </div>
                            <div>
                              <p className="font-medium">{f.originalName || f.fileName}</p>
                              <p className="text-sm text-muted-foreground">{formatBytes(f.size || 0)}</p>
                            </div>
                          </div>
                          <Button onClick={() => openScannerModal(f)}>Review</Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scannerFiles.map((f: any) => (
                      <Card key={f._id} className="p-6 text-center">
                        <div className="mx-auto mb-4">
                          {f.isImage ? <ImageIcon className="h-12 w-12 mx-auto text-amber-500" /> : <File className="h-12 w-12 mx-auto text-amber-500" />}
                        </div>
                        <p className="font-medium line-clamp-2">{f.originalName || f.fileName}</p>
                        <Button className="mt-6 w-full" onClick={() => openScannerModal(f)}>Review</Button>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ==================== SCANNED ==================== */}
              <TabsContent value="scanned" className="m-0 h-full flex flex-col">
                {scannedLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : scannedOnlyFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center p-6">
                      <FileCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No scanned files yet</p>
                      <p className="text-sm">Files uploaded via scanner will appear here</p>
                    </div>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="divide-y">
                    {scannedOnlyFiles.map((f: any) => (
                      <div key={f.fileId} className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors group">
                        <div className="p-2 bg-muted rounded-xl">{getFileIcon(f)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{f.alias || f.name}</span>
                            <Badge variant="outline" className="text-xs">{f.type}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{formatBytes(f.size)}</span>
                            <span>{f.confidentialityLevel ? getConfidentialityLabel(f.confidentialityLevel) : '-'}</span>
                            <span>{f.createdAt ? formatDistanceToNow(new Date(f.createdAt)) + ' ago' : ''}</span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handlePreview(f)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(f.fileId, f.name)}><Download className="h-4 w-4" /></Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openShareDialog(f)}>Share</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedFile(f); setVersionHistoryOpen(true) }}>Version History</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(f.fileId)} className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {scannedOnlyFiles.map((f: any) => (
                      <Card key={f.fileId} className="group overflow-hidden border-0 bg-card hover:shadow-xl transition-all duration-300">
                        <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
                          <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                            {getFileIcon(f)}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold truncate">{f.alias || f.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{f.name}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0">{f.type}</Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <File className="h-3 w-3" />
                              <span className="truncate">{formatBytes(f.size)}</span>
                            </div>
                            {f.confidentialityLevel && (
                              <Badge className={cn("w-fit", getConfidentialityColor(f.confidentialityLevel))}>
                                {getConfidentialityLabel(f.confidentialityLevel)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => handlePreview(f)}>
                              <Eye className="h-3 w-3" /> Preview
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="px-2">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownload(f.fileId, f.name)}>
                                  <Download className="h-4 w-4 mr-2" /> Download
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openShareDialog(f)}>
                                  <Share2 className="h-4 w-4 mr-2" /> Share
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedFile(f); setVersionHistoryOpen(true) }}>
                                  Versions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(f.fileId)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ==================== ARCHIVE FILES ==================== */}
              <TabsContent value="archive" className="m-0 h-full flex flex-col">
                {/* Admin Filters */}
                {user?.role === 'admin' && (
                  <div className="p-4 border-b bg-gray-50/50">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 min-w-48">
                        <label className="text-sm font-medium text-gray-600 mb-1.5 block">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search files..."
                            value={archiveSearch}
                            onChange={(e) => setArchiveSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="w-40">
                        <label className="text-sm font-medium text-gray-600 mb-1.5 block">Department</label>
                        <Input
                          placeholder="Department name"
                          value={archiveDepartment}
                          onChange={(e) => setArchiveDepartment(e.target.value)}
                        />
                      </div>

                      <div className="w-40">
                        <label className="text-sm font-medium text-gray-600 mb-1.5 block">Uploaded By</label>
                        <Input
                          placeholder="Uploader name"
                          value={archiveUploadedBy}
                          onChange={(e) => setArchiveUploadedBy(e.target.value)}
                        />
                      </div>

                      <div className="w-36">
                        <label className="text-sm font-medium text-gray-600 mb-1.5 block">Level</label>
                        <Select value={archiveConfidentiality || "all"} onValueChange={(value) => setArchiveConfidentiality(value === "all" ? "" : value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="All levels" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All levels</SelectItem>
                            <SelectItem value="public">Everyone Can See</SelectItem>
                            <SelectItem value="internal">Company Only</SelectItem>
                            <SelectItem value="confidential">Limited Access Only</SelectItem>
                            <SelectItem value="highly_confidential">Very Secret - Few People Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-32">
                        <label className="text-sm font-medium text-gray-600 mb-1.5 block">Sort</label>
                        <Select value={archiveSortBy} onValueChange={(value: 'newest' | 'oldest') => setArchiveSortBy(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="restricted-only"
                          checked={archiveRestrictedOnly}
                          onChange={(e) => setArchiveRestrictedOnly(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="restricted-only" className="text-sm font-medium text-gray-600">
                          Restricted only
                        </label>
                      </div>

                      {(archiveSearch || archiveDepartment || archiveUploadedBy || archiveConfidentiality || archiveRestrictedOnly) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setArchiveSearch('')
                            setArchiveDepartment('')
                            setArchiveUploadedBy('')
                            setArchiveConfidentiality('')
                            setArchiveRestrictedOnly(false)
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {archiveLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : archiveFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center p-6">
                      <Archive className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No archive files available</p>
                      <p className="text-sm">
                        {user?.role === 'admin'
                          ? 'No files match your current filters'
                          : 'Archive files from other departments will appear here'
                        }
                      </p>
                    </div>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="divide-y">
                    {archiveFiles.map((f: any) => (
                      <div key={f.fileId} className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors group">
                        <div className="p-1.5 sm:p-2 bg-muted rounded-lg sm:rounded-xl flex-shrink-0">{getFileIcon(f)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm sm:text-base truncate">{f.alias || f.name}</span>
                            <Badge variant="outline" className="text-xs shrink-0">{f.type}</Badge>
                            {f.confidentialityLevel && (
                              <Badge className={cn(
                                "text-xs flex items-center gap-1",
                                f.restricted
                                  ? "bg-red-100 text-red-700 border-red-300"
                                  : getConfidentialityColor(f.confidentialityLevel)
                              )}>
                                {f.restricted && <Lock className="h-2.5 w-2.5" />}
                                {getConfidentialityLabel(f.confidentialityLevel)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {f.uploadedBy?.name || f.owner?.name || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {typeof f.department === 'object' ? f.department.name : f.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <File className="h-3 w-3" />
                              {formatBytes(f.size)}
                            </span>
                            <span className="hidden sm:inline">
                              {f.createdAt ? formatDistanceToNow(new Date(f.createdAt)) + ' ago' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0">
                          {f.restricted ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Lock className="h-4 w-4" />
                              <span className="text-xs">Restricted</span>
                            </div>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-1"
                                onClick={() => handlePreview(f)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-1"
                                onClick={() => handleDownload(f.fileId, f.name)}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-1">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handlePreview(f)} className="text-sm">
                                    <Eye className="h-4 w-4 mr-2" /> Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownload(f.fileId, f.name)} className="text-sm">
                                    <Download className="h-4 w-4 mr-2" /> Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openShareDialog(f)} className="text-sm">
                                    <Share2 className="h-4 w-4 mr-2" /> Share
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedFile(f); setVersionHistoryOpen(true) }} className="text-sm">
                                    File Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {archiveFiles.map((f: any) => (
                      <Card key={f.fileId} className="group overflow-hidden border-0 bg-card hover:shadow-xl transition-all duration-300">
                        <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
                          <div className="p-3 sm:p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                            {getFileIcon(f)}
                          </div>
                        </div>
                        <div className="p-3 sm:p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm sm:text-base truncate">{f.alias || f.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{f.name}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0 text-xs">{f.type}</Badge>
                          </div>
                          <div className="space-y-1 text-xs sm:text-sm mb-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate">{f.uploadedBy?.name || f.owner?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate">{typeof f.department === 'object' ? f.department.name : f.department}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <File className="h-3 w-3" />
                              <span>{formatBytes(f.size)}</span>
                            </div>
                          </div>
                          {f.confidentialityLevel && (
                            <Badge className={cn(
                              "w-fit text-xs mb-3 flex items-center gap-1",
                              f.restricted
                                ? "bg-red-100 text-red-700 border-red-300"
                                : getConfidentialityColor(f.confidentialityLevel)
                            )}>
                              {f.restricted && <Lock className="h-2.5 w-2.5" />}
                              {getConfidentialityLabel(f.confidentialityLevel)}
                            </Badge>
                          )}
                          {f.restricted ? (
                            <div className="mt-3 sm:mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 text-red-700">
                                <Lock className="h-4 w-4" />
                                <span className="text-xs sm:text-sm font-medium">Restricted Access</span>
                              </div>
                              <p className="text-xs text-red-600 mt-1">
                                Highly confidential file. HODs can only view metadata.
                              </p>
                            </div>
                          ) : (
                            <div className="flex gap-1 mt-3 sm:mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs sm:text-sm" onClick={() => handlePreview(f)}>
                                <Eye className="h-3 w-3" /> <span className="hidden sm:inline">Preview</span>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="px-1 sm:px-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleDownload(f.fileId, f.name)} className="text-xs sm:text-sm">
                                    <Download className="h-4 w-4 mr-2" /> Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openShareDialog(f)} className="text-xs sm:text-sm">
                                    <Share2 className="h-4 w-4 mr-2" /> Share
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedFile(f); setVersionHistoryOpen(true) }} className="text-xs sm:text-sm">
                                    File Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>





            </div>
          </Tabs>
        </div>

        {/* Preview Modal */}
        <Dialog open={!!previewFile} onOpenChange={(o) => !o && closePreview()}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full sm:max-w-5xl p-0 gap-0">
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg">{previewFile?.alias || previewFile?.name}</DialogTitle>
                  {previewFile?.confidentialityLevel && (
                    <Badge className={cn("text-xs", getConfidentialityColor(previewFile.confidentialityLevel))}>
                      {getConfidentialityLabel(previewFile.confidentialityLevel)}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={closePreview}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 relative bg-background">
                {previewLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading preview...</p>
                  </div>
                ) : previewError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <AlertCircle className="h-16 w-16 text-red-500" />
                    <p className="text-muted-foreground">{previewError}</p>
                    <Button variant="outline" onClick={() => previewFile && handleDownload(previewFile.fileId, previewFile.name)}>
                      <Download className="h-4 w-4 mr-2" /> Download instead
                    </Button>
                  </div>
                ) : blobUrl ? (
                  previewFile?.restricted ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
                      <div className="text-center">
                        <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Restricted Access</h3>
                        <p className="text-gray-600 text-sm">
                          Highly confidential file. HODs can only view metadata.
                        </p>
                      </div>
                    </div>
                  ) : previewType === 'image' ? (
                    <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
                      <img src={blobUrl} alt={previewFile?.name} className="max-w-full max-h-full object-contain rounded-lg" />
                    </div>
                  ) : (
                    <iframe src={blobUrl} className="w-full h-full border-0" title="Preview" />
                  )
                ) : null}
              </div>
            </div>

            <div className="border-t p-4 flex justify-end">
              <Button
                variant="outline"
                disabled={previewFile?.restricted}
                className={cn(previewFile?.restricted && "cursor-not-allowed opacity-50")}
                onClick={() => previewFile && !previewFile.restricted && handleDownload(previewFile.fileId, previewFile.name)}
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share: {selectedFile?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Select Users</label>
                <div className="mt-2 max-h-40 overflow-auto border rounded-lg p-2 space-y-2">
                  {availableUsers.map((u: any) => (
                    <label key={u._id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-accent rounded">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u._id)}
                        onChange={() => toggleUserSelection(u._id)}
                      />
                      <span className="text-sm">{u.name} ({u.email})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Access Level</label>
                <Select value={accessLevel} onValueChange={(v: any) => setAccessLevel(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="download">Can Download</SelectItem>
                    <SelectItem value="edit">Can Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleShare} disabled={selectedUsers.length === 0}>Share</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Revoke Dialog */}
        <AlertDialog open={!!revokeConfirm} onOpenChange={() => setRevokeConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
              <AlertDialogDescription>
                The user will no longer have access to this file. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => revokeConfirm && handleRevoke(revokeConfirm)}>Revoke</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



        {/* Version History Modal */}
        <Dialog open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Version History</DialogTitle>
              <DialogDescription>{selectedFile?.name}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 max-h-96 overflow-y-auto">
              {versionHistoryData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No version history available</p>
              ) : (
                versionHistoryData.map((version: any, idx: number) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">Version {version.versionNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(version.createdAt))} ago • {formatBytes(version.size)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rollbackVersion.mutate({
                          fileId: selectedFile!.fileId,
                          versionNumber: version.versionNumber
                        })}
                      >
                        Restore
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Scanner Modal */}
        {pendingScannerFile && (
          <ScannerConfirmModal
            open={scannerModalOpen}
            onOpenChange={(o) => { setScannerModalOpen(o); if (!o) setPendingScannerFile(null) }}
            pendingFile={pendingScannerFile}
            onConfirm={handleScannerConfirm}
            onCancel={handleScannerCancel}
            isConfirming={scannerConfirm.isPending}
            isCancelling={scannerCancel.isPending}
          />
        )}
      </div>
    </ResponsiveContainer>
  )
}
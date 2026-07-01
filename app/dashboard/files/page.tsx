'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  FileText, Archive, User, Building2,
  Folder,
  Check
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
import { Lock, Shield, FolderPlus, ChevronDown, ChevronRight, Home, Star, Clock, FolderInput, Copy, CheckSquare, Square } from 'lucide-react'
import { ScannerConfirmModal } from '@/components/scanner/ScannerConfirmModal'
import { FolderTreePanel } from '@/components/folders/FolderTreePanel'
import { FolderCard } from '@/components/folders/FolderCard'
import { CreateFolderDialog } from '@/components/folders/CreateFolderDialog'
import { RenameFolderDialog } from '@/components/folders/RenameFolderDialog'
import { MoveDialog } from '@/components/folders/MoveDialog'
import { Breadcrumb } from '@/components/folders/Breadcrumb'
import { useFoldersQuery, useFolderContentsQuery, useDeleteFolderMutation, useMoveFileToFolderMutation, useBulkMoveFilesToFolderMutation } from '@/hooks/useFolders'
import { FolderItem } from '@/services/api/folders'

// Helper Functions - using confidentialityLevels array with rightful professional colors
const CONFIDENTIALITY_LEVELS = ['public', 'internal', 'confidential', 'highly_confidential'] as const

const CONFIDENTIALITY_COLOR_MAP: Record<string, string> = {
  public: '#10b981',
  internal: '#3b82f6',
  confidential: '#f59e0b',
  highly_confidential: '#ef4444',
}

const CONFIDENTIALITY_LABEL_MAP: Record<string, string> = {
  public: 'Everyone Can See',
  internal: 'Company Only',
  confidential: 'Limited Access Only',
  highly_confidential: 'Very Secret - Few People Only',
}

type FileTab = 'myfiles' | 'received' | 'sent' | 'scanned' | 'scanner' | 'archive'

const FILE_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Documents' },
  { value: 'spreadsheet', label: 'Spreadsheets' },
  { value: 'presentation', label: 'Presentations' },
  { value: 'image', label: 'Images' },
  { value: 'zip', label: 'Archives' },
  { value: 'other', label: 'Other' },
] as const

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function getDepartmentName(department: any) {
  if (!department) return ''
  return typeof department === 'object' ? (department.name || department._id || '') : department
}

function getFileName(file: FileItem) {
  return file.alias || file.name || ''
}

function getFileExtension(file: FileItem) {
  const name = file.name || ''
  const parts = name.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

function getFileCategory(file: FileItem): string {
  const ext = getFileExtension(file)
  const type = (file.type || '').toLowerCase()

  // PDF
  if (ext === 'pdf' || type.includes('pdf')) return 'pdf'
  // Document
  if (['doc', 'docx', 'odt', 'txt', 'rtf'].includes(ext) ||
    type.includes('word') || type.includes('msword') ||
    type.includes('opendocument.text') || type.includes('plain') ||
    type.includes('rtf')) return 'document'
  // Spreadsheet
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext) ||
    type.includes('excel') || type.includes('spreadsheet')) return 'spreadsheet'
  // Presentation
  if (['ppt', 'pptx', 'odp'].includes(ext) ||
    type.includes('powerpoint') || type.includes('presentation')) return 'presentation'
  // Image
  if (['jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif', 'bmp', 'webp'].includes(ext) ||
    type.includes('image')) return 'image'
  // Archive/Zip
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) ||
    type.includes('zip') || type.includes('archive')) return 'zip'
  // Other (fallback for unknown types)
  return 'other'
}

function fileMatchesType(file: FileItem, typeFilter: string) {
  if (typeFilter === 'all') return true
  const fileCategory = getFileCategory(file)
  return fileCategory === typeFilter
}

function fileMatchesSearch(file: FileItem, searchTerm: string) {
  const query = normalizeSearch(searchTerm)
  if (!query) return true
  const searchable = [
    getFileName(file),
    file.name,
    file.alias,
    file.type,
    file.tags?.join(' '),
    getDepartmentName(file.department),
    file.owner?.name,
    file.uploadedBy?.name,
    file.confidentialityLevel ? getConfidentialityLabel(file.confidentialityLevel) : '',
  ].join(' ')
  return normalizeSearch(searchable).includes(query)
}

function fileMatchesConfidentiality(file: FileItem, confidentialityFilter: string) {
  return confidentialityFilter === 'all' || file.confidentialityLevel === confidentialityFilter
}

function getServerTypeValue(typeFilter: string) {
  return typeFilter === 'all' ? undefined : typeFilter
}

function getSearchableFileText(file: FileItem) {
  return [
    getFileName(file),
    file.name,
    file.alias,
    file.type,
    file.tags?.join(' '),
    getDepartmentName(file.department),
    file.owner?.name,
    file.uploadedBy?.name,
    file.confidentialityLevel ? getConfidentialityLabel(file.confidentialityLevel) : '',
  ].join(' ')
}

function getConfidentialityColor(level: any): string {
  const colors: Record<string, string> = {
    public: 'bg-emerald-100 text-emerald-700',
    internal: 'bg-blue-100 text-blue-700',
    confidential: 'bg-amber-100 text-amber-700',
    highly_confidential: 'bg-red-100 text-red-700'
  }
  return CONFIDENTIALITY_LEVELS.includes(level)
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
  return CONFIDENTIALITY_LEVELS.includes(level)
    ? labels[level]
    : 'Unknown'
}

export default function FilesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') || 'myfiles') as FileTab
  const initialSearch = searchParams.get('q') || ''
  // Support both 'type' (legacy) and 'fileCategory' (new) parameters for backward compatibility
  const initialTypeParam = searchParams.get('type') || searchParams.get('fileCategory') || 'all'
  const initialConfidentiality = searchParams.get('confidentiality') || 'all'
  const [activeTab, setActiveTab] = useState<FileTab>(initialTab)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  const [typeFilter, setTypeFilter] = useState(initialTypeParam)
  const [confidentialityFilter, setConfidentialityFilter] = useState(initialConfidentiality)
  const [page, setPage] = useState(1)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareSearch, setShareSearch] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [accessLevel, setAccessLevel] = useState<'view' | 'download' | 'edit'>('view')
  const MAX_SHARE_USERS = 10
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

  // Folder state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderTreeExpanded, setFolderTreeExpanded] = useState(true)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null)
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null)
const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [moveDialogType, setMoveDialogType] = useState<'folder' | 'file'>('folder')
  const [moveDialogItemId, setMoveDialogItemId] = useState<string>('')
  const [moveDialogItemIds, setMoveDialogItemIds] = useState<string[]>([])
  const [moveDialogItemName, setMoveDialogItemName] = useState('')

  // Multi-select and clipboard state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedItemType, setSelectedItemType] = useState<'file' | 'folder' | null>(null)
  const [clipboard, setClipboard] = useState<{ items: string[]; type: 'file' | 'folder'; action: 'copy' | 'cut' } | null>(null)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Folder enhancements state
  const [favoriteFolders, setFavoriteFolders] = useState<Set<string>>(new Set())
  const [recentFolders, setRecentFolders] = useState<string[]>([])
  const [folderColors, setFolderColors] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const tab = searchParams.get('tab')
    const q = searchParams.get('q')
    // Support both 'type' and 'fileCategory' parameters
    const type = searchParams.get('type') || searchParams.get('fileCategory')
    const confidentiality = searchParams.get('confidentiality')
    const fileId = searchParams.get('fileId')

    if (tab && ['myfiles', 'received', 'sent', 'scanned', 'scanner', 'archive'].includes(tab)) {
      setActiveTab(tab as FileTab)
    }
    if (q !== null && q !== search) setSearch(q)
    if (type && FILE_TYPE_OPTIONS.some(option => option.value === type)) setTypeFilter(type)
    if (confidentiality && confidentiality !== 'all') setConfidentialityFilter(confidentiality)
    if (fileId) {
      const timer = setTimeout(() => {
        const element = document.querySelector(`[data-file-id="${CSS.escape(fileId)}"]`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element?.classList.add('ring-2', 'ring-blue-500')
        setTimeout(() => element?.classList.remove('ring-2', 'ring-blue-500'), 2500)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  // Sync URL with filters
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('tab', activeTab)
    if (search) params.set('q', search)
    if (typeFilter !== 'all') params.set('fileCategory', typeFilter)
    if (confidentialityFilter !== 'all') params.set('confidentiality', confidentialityFilter)
    // Update URL without triggering another useEffect
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
  }, [activeTab, search, typeFilter, confidentialityFilter])

  // Auth
  const { user } = useAuth()
  const { canView, filterFiles, clearanceBadge, isAdmin, userDepartment, allowedLevels } = useAccessControl()

  // Queries
  const { data: usersData } = useUsersListQuery({ search: shareSearch || undefined, limit: 100, status: 'active' })
  const { data: confidentialityLevels } = useConfidentialityLevelsConfigQuery()

  // Build the filter dropdown items from settings config, filtered to only the levels the user has access to.
  // Falls back to the allowedLevels array ensures it always works even if settings haven't loaded yet.
  const allowedLevelsForFilter: string[] = useMemo(() => {
    const allowed = (allowedLevels || []) as string[]
    if (confidentialityLevels && confidentialityLevels.length > 0) {
      return confidentialityLevels
        .filter((l) => allowed.includes(l.value))
        .map((l) => l.value)
    }
    return allowed
  }, [allowedLevels, confidentialityLevels])

  // Merge settings labels with hardcoded fallback so labels always resolve.
  const confidentialityLabelMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = { ...CONFIDENTIALITY_LABEL_MAP }
    if (confidentialityLevels) {
      confidentialityLevels.forEach((l) => {
        map[l.value] = l.label
      })
    }
    return map
  }, [confidentialityLevels])

  const confidentialityColorMap: Record<string, string> = CONFIDENTIALITY_COLOR_MAP

  // Folder queries
  const { data: currentFolderContents, isLoading: folderContentsLoading } = useFolderContentsQuery(currentFolderId)
  const childFolders = currentFolderContents?.folders || []
  const folderFiles = currentFolderContents?.files || []

  const { data: ownedFilesData, isLoading: ownedLoading } = useFilesQuery({
    owner: user?._id,
    page,
    limit: 50,
    search: debouncedSearch || undefined,
    fileCategory: getServerTypeValue(typeFilter),
    confidentiality: confidentialityFilter !== 'all' ? confidentialityFilter : undefined,
  })

  const { data: myPermissionsData } = useMyPermissionsQuery()
  const { data: sentPermissionsData } = useMySentPermissionsQuery()

  const { data: scannedFilesData, isLoading: scannedLoading } = useFilesQuery({
    isScanned: true,
    page,
    limit: 50,
    search: debouncedSearch || undefined,
    fileCategory: getServerTypeValue(typeFilter),
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

  // Folder mutations
  const deleteFolder = useDeleteFolderMutation()
  const moveFileToFolder = useMoveFileToFolderMutation()
  const bulkMoveFilesToFolder = useBulkMoveFilesToFolderMutation()

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
    setShowBulkActions(false)
    setLastSelectedIndex(null)
    setSelectedItemType(null)
  }, [])

  // Folder handlers
  const handleFolderSelect = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId)
    setPage(1)
    clearSelection()

    if (folderId) {
      setRecentFolders(prev => {
        const filtered = prev.filter(id => id !== folderId)
        return [folderId, ...filtered].slice(0, 10)
      })
    }
  }, [clearSelection])

  const handleCreateFolder = useCallback((parentFolderId?: string | null) => {
    setCreateFolderParentId(parentFolderId ?? currentFolderId)
    setCreateFolderDialogOpen(true)
  }, [currentFolderId])

  const handleRenameFolder = useCallback((folderId: string) => {
    setRenameFolderId(folderId)
  }, [])

  const handleDeleteFolder = useCallback((folderId: string) => {
    if (folderId) {
      deleteFolder.mutate(folderId)
    }
  }, [deleteFolder])

  const handleMoveFolder = useCallback((folderId: string, folderName: string) => {
    setMoveDialogType('folder')
    setMoveDialogItemId(folderId)
    setMoveDialogItemName(folderName)
    setMoveDialogOpen(true)
  }, [])

  // Toggle favorite folder
  const toggleFavorite = useCallback((folderId: string) => {
    setFavoriteFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

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

  const applyFileFilters = useCallback((files: FileItem[]) => {
    return files.filter((file) =>
      fileMatchesSearch(file, search) &&
      fileMatchesType(file, typeFilter) &&
      fileMatchesConfidentiality(file, confidentialityFilter)
    )
  }, [search, typeFilter, confidentialityFilter])

  // Shared files (received/sent via explicit permissions) always visible — sharing is the only exception to dept/confidentiality rules
  const receivedFilesList = useMemo(() => applyFileFilters(buildList(myPermissionsData || [])), [myPermissionsData, buildList, applyFileFilters])
  const sentFilesList = useMemo(() => applyFileFilters(buildList(sentPermissionsData || [])), [sentPermissionsData, buildList, applyFileFilters])

  // Data - strict frontend filtering applied before any render/pagination/counters/search
  const ownedRaw = ownedFilesData?.files || []
  const ownedFiles = useMemo(() => applyFileFilters(filterFiles(ownedRaw as any)), [ownedRaw, filterFiles, applyFileFilters])
  const scannedRaw = scannedFilesData?.files || []
  const scannedFiles = useMemo(() => applyFileFilters(filterFiles(scannedRaw as any)), [scannedRaw, filterFiles, applyFileFilters])
  const scannedOnlyFiles = useMemo(() => scannedFiles.filter((f: any) => f.isScanned === true), [scannedFiles])
  const scannerFiles = scannerFilesData || []
  const scannerStats = scannerStatsData || { pending: 0 }

  const ownedTotal = ownedFilesData?.total || 0
  const archiveRaw = archiveFilesData?.files || []
  const archiveFiles = useMemo(() => applyFileFilters(filterFiles(archiveRaw as any)), [archiveRaw, filterFiles])

  // Merge owned + explicitly shared files for the main "My Files" view
  const myAccessibleFiles = useMemo(() => {
    const map = new Map<string, any>()
    ownedFiles.forEach((f: any) => { if (f.fileId) map.set(f.fileId, f) })
    receivedFilesList.forEach((f: any) => { if (f.fileId) map.set(f.fileId, f) })
    return Array.from(map.values())
  }, [ownedFiles, receivedFilesList])

  const handleMoveFile = useCallback((fileId?: string, fileName?: string) => {
    // If fileId and fileName provided, use them (individual file move from dropdown)
    // Otherwise use selected items from multi-selection
    let fileIds: string[]
    let displayName: string

    if (fileId && fileName) {
      fileIds = [fileId]
      displayName = fileName
    } else {
      // Get selected file IDs from the multi-selection
      fileIds = Array.from(selectedItems)
        .filter(key => key.startsWith('file-'))
        .map(key => key.replace('file-', ''))
      
      if (fileIds.length === 0) {
        addNotification('error', 'Unable to move', 'No files selected.')
        return
      }

      // Get the name of the first file for display
      const firstFileId = fileIds[0]
      const firstFile = (currentFolderId ? folderFiles : myAccessibleFiles).find(f => f.fileId === firstFileId)
      displayName = fileIds.length > 1 ? `${fileIds.length} items` : (firstFile?.alias || firstFile?.name || firstFileId)
    }

    setMoveDialogType('file')
    setMoveDialogItemId(fileIds[0])
    setMoveDialogItemIds(fileIds)
    setMoveDialogItemName(displayName)
    setMoveDialogOpen(true)
  }, [selectedItems, currentFolderId, folderFiles, myAccessibleFiles, addNotification])

  const availableUsers = useMemo(() => {
    const usersList = usersData?.users || []
    const existing = new Set((myPermissionsData || []).map((p: any) => p.userId?._id || p.userId).filter(Boolean))
    return usersList.filter((u: any) => u._id && u._id !== user?._id && !existing.has(u._id))
  }, [usersData, myPermissionsData, user])

  const selectedUsersList = useMemo(() => {
    const usersList = usersData?.users || []
    return usersList.filter((u: any) => selectedUsers.includes(u._id))
  }, [usersData, selectedUsers])

  const stats = useMemo(() => ({
    total: ownedFiles.length,
    scanned: scannedOnlyFiles.length,
    sharedWithMe: receivedFilesList.length,
    sharedByMe: sentFilesList.length,
    pending: scannerStats.pending || scannerFiles.length
  }), [ownedFiles.length, scannedOnlyFiles.length, receivedFilesList.length, sentFilesList.length, scannerStats.pending, scannerFiles])

  // Folder stats
  const folderStats = useMemo(() => {
    const currentFolders = currentFolderId ? childFolders : []
    const currentFiles = currentFolderId ? folderFiles : myAccessibleFiles

    return {
      folderCount: currentFolders.length,
      fileCount: currentFiles.length,
      totalSize: currentFiles.reduce((acc: number, f: any) => acc + (f.size || 0), 0),
      lastModified: currentFiles.length > 0
        ? currentFiles.reduce((latest: string, f: any) => {
          const date = f.updatedAt || f.createdAt
          return date && date > latest ? date : latest
        }, '')
        : null
    }
  }, [currentFolderId, childFolders, folderFiles, myAccessibleFiles])

  // Check if item is selected
  const isItemSelected = useCallback((id: string, type: 'file' | 'folder') => {
    return selectedItems.has(`${type}-${id}`)
  }, [selectedItems])

  const toggleItemSelection = useCallback((id: string, type: 'file' | 'folder', index: number, shiftKey: boolean = false) => {
    const key = `${type}-${id}`
    setSelectedItems(prev => {
      const next = new Set(prev)
      const isSelected = next.has(key)

      if (shiftKey && lastSelectedIndex !== null && selectedItemType === type) {
        const items = currentFolderId
          ? [
            ...childFolders.map((folder: FolderItem, folderIndex: number) => ({ key: `folder-${folder._id}`, type: 'folder', index: folderIndex })),
            ...folderFiles.map((file: any, fileIndex: number) => ({ key: `file-${file.fileId}`, type: 'file', index: childFolders.length + fileIndex }))
          ]
          : [
            ...childFolders.map((folder: FolderItem, folderIndex: number) => ({ key: `folder-${folder._id}`, type: 'folder', index: folderIndex })),
            ...myAccessibleFiles.map((file: any, fileIndex: number) => ({ key: `file-${file.fileId}`, type: 'file', index: childFolders.length + fileIndex }))
          ]

        const start = Math.min(lastSelectedIndex, index)
        const end = Math.max(lastSelectedIndex, index)

        items
          .filter((item) => item.type === type && item.index >= start && item.index <= end)
          .forEach((item) => next.add(item.key))
      } else {
        if (isSelected) {
          next.delete(key)
        } else {
          next.add(key)
        }
      }

      setShowBulkActions(next.size > 0)
      return next
    })

    setSelectedItemType(type)
    setLastSelectedIndex(index)
  }, [childFolders, currentFolderId, folderFiles, lastSelectedIndex, myAccessibleFiles, selectedItemType])

  // Paste handler
  const handlePaste = useCallback(() => {
    if (!clipboard || clipboard.items.length === 0) return

    clipboard.items.forEach(itemId => {
      if (clipboard.type === 'file') {
        moveFileToFolder.mutate({
          fileId: itemId,
          targetFolderId: currentFolderId
        })
      }
    })

    if (clipboard.action === 'copy') {
      setClipboard(null)
    }
  }, [clipboard, currentFolderId, moveFileToFolder])

  // Bulk delete handler
  const handleBulkDelete = useCallback(() => {
    selectedItems.forEach(itemId => {
      if (itemId.startsWith('folder-')) {
        deleteFolder.mutate(itemId.replace('folder-', ''))
      } else if (itemId.startsWith('file-')) {
        deleteFile.mutate({ fileId: itemId.replace('file-', '') })
      }
    })
    setSelectedItems(new Set())
    setShowBulkActions(false)
  }, [selectedItems, deleteFolder, deleteFile])

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a' && activeTab === 'myfiles') {
          e.preventDefault()
          const allIds = new Set([
            ...childFolders.map((f: FolderItem) => `folder-${f._id}`),
            ...(currentFolderId ? folderFiles : myAccessibleFiles).map((f: any) => `file-${f.fileId}`)
          ])
          setSelectedItems(allIds)
          if (allIds.size > 0) setShowBulkActions(true)
        } else if (e.key === 'c' && selectedItems.size > 0) {
          e.preventDefault()
          const items = Array.from(selectedItems)
          const type = selectedItemType
          setClipboard({ items, type: type || 'file', action: 'copy' })
          addNotification('success', 'Copied', `${items.length} item(s) copied`)
        } else if (e.key === 'x' && selectedItems.size > 0) {
          e.preventDefault()
          const items = Array.from(selectedItems)
          setClipboard({ items, type: selectedItemType || 'file', action: 'cut' })
          addNotification('success', 'Cut', `${items.length} item(s) cut`)
        } else if (e.key === 'v' && clipboard) {
          e.preventDefault()
          handlePaste()
        }
      } else if (e.key === 'Escape') {
        setSelectedItems(new Set())
        setShowBulkActions(false)
        setSelectedItemType(null)
      } else if (e.key === 'Delete' && selectedItems.size > 0) {
        e.preventDefault()
        handleBulkDelete()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItems, clipboard, selectedItemType, activeTab, childFolders, currentFolderId, folderFiles, myAccessibleFiles, handlePaste, handleBulkDelete])

  const resetPage = useCallback(() => setPage(1), [])

  const handleClearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setConfidentialityFilter('all')
    setArchiveSearch('')
    setArchiveDepartment('')
    setArchiveUploadedBy('')
    setArchiveConfidentiality('')
    setArchiveRestrictedOnly(false)
    setPage(1)
  }

  const renderPagination = (currentPage: number, totalPages: number, onChange: (page: number) => void) => {
    const safeTotalPages = Math.max(1, totalPages || 1)
    return (
      <div className="border-t px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {currentPage} of {safeTotalPages}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onChange(currentPage - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={currentPage >= safeTotalPages} onClick={() => onChange(currentPage + 1)}>Next</Button>
        </div>
      </div>
    )
  }

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
    setShareSearch('')
    setAccessLevel('view')
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) return prev.filter(id => id !== userId)
      if (prev.length >= MAX_SHARE_USERS) {
        addNotification('warning', 'Limit Reached', `You can share with up to ${MAX_SHARE_USERS} users at a time.`)
        return prev
      }
      return [...prev, userId]
    })
  }

  const handleShare = () => {
    if (!selectedFile || selectedUsers.length === 0) return
    selectedUsers.forEach(userId => grantPermission.mutate({ fileId: selectedFile.fileId, userId, access: accessLevel }))
    addNotification('success', 'File Shared', `Shared with ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}.`)
    setShareDialogOpen(false)
    setSelectedUsers([])
    setSelectedFile(null)
    setShareSearch('')
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
                {currentFolderId ? (
                  <Breadcrumb currentFolderId={currentFolderId} onNavigate={handleFolderSelect} />
                ) : (
                  <h1 className="text-2xl font-bold tracking-tight">Files</h1>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {currentFolderId ? 'Folder contents' : 'Manage and organize all your documents'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isUploading && uploadProgress !== null && (
                  <div className="flex items-center gap-3 text-sm">
                    <span>Uploading...</span>
                    <Progress value={uploadProgress} className="w-24 h-2" />
                    <span>{uploadProgress}%</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleCreateFolder()}
                >
                  <FolderPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Folder</span>
                </Button>
                <Button className="gap-2" onClick={() => document.getElementById('file-input')?.click()} disabled={isUploading}>
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
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
                  onChange={(e) => {
                    setSearch(e.target.value)
                    resetPage()
                  }}
                  className="pl-9 pr-10"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSearch('')
                      resetPage()
                    }}
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); resetPage() }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="File Type" />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={confidentialityFilter} onValueChange={(value) => { setConfidentialityFilter(value); resetPage() }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Confidentiality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All My Levels</SelectItem>
                  {(allowedLevelsForFilter as string[]).map((level) => (
                    <SelectItem key={level} value={level}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: confidentialityColorMap[level] || '#6b7280' }}
                        />
                        {confidentialityLabelMap[level] || level.replace(/_/g, ' ')}
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

              {(search || typeFilter !== 'all' || confidentialityFilter !== 'all') && (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Folder Tree Panel */}
        <FolderTreePanel
          selectedFolderId={currentFolderId}
          onFolderSelect={handleFolderSelect}
          onCreateFolder={handleCreateFolder}
          isExpanded={folderTreeExpanded}
          onToggleExpanded={() => setFolderTreeExpanded(!folderTreeExpanded)}
          favoriteFolders={favoriteFolders}
          onToggleFavorite={toggleFavorite}
          recentFolders={recentFolders}
        />

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

        {/* Bulk Actions Toolbar */}
        {showBulkActions && selectedItems.size > 0 && (
          <div className="px-6 py-3 bg-primary/5 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{selectedItems.size} selected</span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleMoveFile()}>
                <FolderInput className="h-4 w-4 mr-2" />
                Move
              </Button>
              <Button variant="outline" size="sm" onClick={() => setClipboard({ items: Array.from(selectedItems), type: selectedItemType || 'file', action: 'copy' })}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Folder Stats */}
        {currentFolderId && (
          <div className="px-6 py-3 bg-muted/30 border-b flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Folder className="w-4 h-4" />
              <span>{folderStats.folderCount} folders</span>
            </div>
            <div className="flex items-center gap-1.5">
              <File className="w-4 h-4" />
              <span>{folderStats.fileCount} files</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{formatBytes(folderStats.totalSize)}</span>
            </div>
            {folderStats.lastModified && (
              <div className="flex items-center gap-1.5">
                <span>Modified {formatDistanceToNow(new Date(folderStats.lastModified))} ago</span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pb-6 flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FileTab)} className="flex-1 flex flex-col">
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
                {ownedLoading || folderContentsLoading ? (
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
                ) : (childFolders.length === 0 && myAccessibleFiles.length === 0 && folderFiles.length === 0) ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center p-6">
                      <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No items found</p>
                      <p className="text-sm">Upload files or create a folder to get started</p>
                      <div className="flex gap-2 justify-center mt-4">
                        <Button variant="outline" size="sm" onClick={() => handleCreateFolder()}>
                          <FolderPlus className="h-4 w-4 mr-2" />
                          New Folder
                        </Button>
                        <Button size="sm" onClick={() => document.getElementById('file-input')?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="divide-y">
                    {/* Folders first */}
                    {childFolders.map((folder: FolderItem, index: number) => (
                      <FolderCard
                        key={folder._id}
                        folder={folder}
                        viewMode="list"
                        isSelected={isItemSelected(folder._id, 'folder')}
                        isFavorite={favoriteFolders.has(folder._id)}
                        onSelect={(e) => toggleItemSelection(folder._id, 'folder', index, e?.shiftKey || false)}
                        onOpen={() => handleFolderSelect(folder._id)}
                        onRename={() => handleRenameFolder(folder._id)}
                        onDelete={() => handleDeleteFolder(folder._id)}
                        onMove={() => handleMoveFolder(folder._id, folder.name)}
                        onToggleFavorite={() => toggleFavorite(folder._id)}
                      />
                    ))}
                    {/* Then files */}
                    {(currentFolderId ? folderFiles : myAccessibleFiles).map((f: any, index: number) => (
                      <div
                        key={f.fileId}
                        data-file-id={f.fileId}
                        className={cn(
                          "flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors group",
                          isItemSelected(f.fileId, 'file') && "bg-primary/5 ring-1 ring-primary"
                        )}
                      >
                        {/* Selection checkbox */}
                        <button
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                            isItemSelected(f.fileId, 'file')
                              ? 'bg-primary border-primary text-white'
                              : 'border-gray-300 hover:border-primary'
                          )}
                          onClick={(e) => toggleItemSelection(f.fileId, 'file', childFolders.length + index, e?.shiftKey || false)}
                        >
                          {isItemSelected(f.fileId, 'file') && <Check className="w-3 h-3" />}
                        </button>
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
                              <DropdownMenuItem onClick={() => handleMoveFile(f.fileId, f.alias || f.name)}>Move</DropdownMenuItem>
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
                  <div className="p-6">
                    {/* Folders section */}
                    {childFolders.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <Folder className="w-5 h-5 text-amber-500" />
                          <h3 className="text-sm font-semibold text-foreground">Folders ({childFolders.length})</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                          {childFolders.map((folder: FolderItem, index: number) => (
                            <FolderCard
                              key={folder._id}
                              folder={folder}
                              viewMode="grid"
                              isSelected={isItemSelected(folder._id, 'folder')}
                              isFavorite={favoriteFolders.has(folder._id)}
                              onSelect={(e) => toggleItemSelection(folder._id, 'folder', index, e?.shiftKey || false)}
                              onOpen={() => handleFolderSelect(folder._id)}
                              onRename={() => handleRenameFolder(folder._id)}
                              onDelete={() => handleDeleteFolder(folder._id)}
                              onMove={() => handleMoveFolder(folder._id, folder.name)}
                              onToggleFavorite={() => toggleFavorite(folder._id)}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Files section */}
                    {(currentFolderId ? folderFiles : myAccessibleFiles).length > 0 && (
                      <>
                        {childFolders.length > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            <File className="w-5 h-5 text-muted-foreground" />
                            <h3 className="text-sm font-semibold text-foreground">Files ({currentFolderId ? folderFiles.length : myAccessibleFiles.length})</h3>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {(currentFolderId ? folderFiles : myAccessibleFiles).map((f: any, index: number) => (
                            <Card
                              key={f.fileId}
                              data-file-id={f.fileId}
                              className={cn(
                                "group overflow-hidden border-0 bg-card hover:shadow-xl transition-all duration-300 cursor-pointer",
                                isItemSelected(f.fileId, 'file') && "ring-2 ring-primary bg-primary/5"
                              )}
                              onClick={(e) => toggleItemSelection(f.fileId, 'file', childFolders.length + index, e?.shiftKey || false)}
                            >
                              <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center relative">
                                {/* Selection checkbox */}
                                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    className={cn(
                                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                                      isItemSelected(f.fileId, 'file')
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-white/80 border-gray-300 hover:border-primary'
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleItemSelection(f.fileId, 'file', childFolders.length + index, e?.shiftKey || false)
                                    }}
                                  >
                                    {isItemSelected(f.fileId, 'file') && <Check className="w-3 h-3" />}
                                  </button>
                                </div>
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
                                      <DropdownMenuItem onClick={() => handleMoveFile(f.fileId, f.alias || f.name)}>
                                        Move
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
                      </>
                    )}
                  </div>
                )}
                {myAccessibleFiles.length > 0 && !currentFolderId && renderPagination(
                  page,
                  Math.ceil((ownedFilesData?.total || myAccessibleFiles.length) / 50),
                  (nextPage) => setPage(Math.max(1, nextPage))
                )}
              </TabsContent>
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
                      <Card key={f.permissionId} data-file-id={f.fileId} className="p-4">
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
                      <Card key={f.permissionId} data-file-id={f.fileId} className="group overflow-hidden">
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
                      <Card key={f.permissionId} data-file-id={f.fileId} className="p-4">
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
                      <Card key={f.permissionId} data-file-id={f.fileId} className="group overflow-hidden">
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
                      <div key={f.fileId} data-file-id={f.fileId} className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors group">
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
                      <Card key={f.fileId} data-file-id={f.fileId} className="group overflow-hidden border-0 bg-card hover:shadow-xl transition-all duration-300">
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
                {scannedOnlyFiles.length > 0 && renderPagination(
                  page,
                  Math.ceil((scannedFilesData?.total || scannedOnlyFiles.length) / 50),
                  (nextPage) => setPage(Math.max(1, nextPage))
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
                            {(allowedLevelsForFilter as string[]).map((lvl) => (
                              <SelectItem key={lvl} value={lvl}>
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: confidentialityColorMap[lvl] || '#6b7280' }} />
                                  {confidentialityLabelMap[lvl] || lvl}
                                </div>
                              </SelectItem>
                            ))}
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
                      <div key={f.fileId} data-file-id={f.fileId} className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors group">
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
                      <Card key={f.fileId} data-file-id={f.fileId} className="group overflow-hidden border-0 bg-card hover:shadow-xl transition-all duration-300">
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

                      {(search || typeFilter !== 'all' || confidentialityFilter !== 'all') && (
                        <Button variant="outline" size="sm" onClick={handleClearFilters}>
                          Clear filters
                        </Button>
                      )}
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
        <Dialog open={shareDialogOpen} onOpenChange={(open) => {
          setShareDialogOpen(open)
          if (!open) { setSelectedUsers([]); setSelectedFile(null); setShareSearch('') }
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                Share File
              </DialogTitle>
              <DialogDescription>
                {selectedFile?.name} — Select up to {MAX_SHARE_USERS} users to share with
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Selected users chips */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  {selectedUsersList.map((u: any) => (
                    <span key={u._id} className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                      {u.name}
                      <button
                        onClick={() => toggleUserSelection(u._id)}
                        className="hover:text-blue-600 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <span className="text-xs text-blue-600 self-center ml-1">
                    {selectedUsers.length}/{MAX_SHARE_USERS} selected
                  </span>
                </div>
              )}

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={shareSearch}
                  onChange={(e) => setShareSearch(e.target.value)}
                  className="pl-9 !outline-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus:!border-gray-300 !shadow-none focus:!shadow-none"
                />
              </div>

              {/* User list */}
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {availableUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{shareSearch ? 'No users match your search' : 'No users available'}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {availableUsers.map((u: any) => {
                      const isSelected = selectedUsers.includes(u._id)
                      const isMaxed = !isSelected && selectedUsers.length >= MAX_SHARE_USERS
                      return (
                        <label
                          key={u._id}
                          className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                            isSelected ? "bg-blue-50/70" : "hover:bg-accent/50",
                            isMaxed && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isMaxed && toggleUserSelection(u._id)}
                            disabled={isMaxed}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                          {u.department && (
                            <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">
                              {typeof u.department === 'object' ? u.department.name || u.department._id : u.department}
                            </Badge>
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Access level */}
              <div>
                <label className="text-sm font-medium text-gray-700">Access Level</label>
                <Select value={accessLevel} onValueChange={(v: any) => setAccessLevel(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>View Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="download">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span>Can Download</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Can Edit</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { setShareDialogOpen(false); setSelectedUsers([]); setSelectedFile(null); setShareSearch('') }}>
                Cancel
              </Button>
              <Button onClick={handleShare} disabled={selectedUsers.length === 0} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share with {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
              </Button>
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

        {/* Create Folder Dialog */}
        <CreateFolderDialog
          open={createFolderDialogOpen}
          onOpenChange={setCreateFolderDialogOpen}
          parentFolderId={createFolderParentId}
        />

        {/* Rename Folder Dialog */}
        <RenameFolderDialog
          open={!!renameFolderId}
          onOpenChange={(o) => !o && setRenameFolderId(null)}
          folderId={renameFolderId || ''}
        />

        {/* Move Dialog */}
        <MoveDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          type={moveDialogType}
          itemIds={moveDialogItemIds}
          itemName={moveDialogItemName}
        />
      </div>
    </ResponsiveContainer>
  )
}
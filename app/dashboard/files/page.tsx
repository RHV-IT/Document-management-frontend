'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

import {
  useFilesQuery,
  useArchiveFilesQuery,
  useDeletedFilesQuery,
  useDeleteFileMutation,
  useRestoreFileMutation,
  usePermanentDeleteFileMutation,
  useDownloadFileMutation,
  useUploadFileMutation,
} from '@/hooks/useFiles'

import { useMyPermissionsQuery, useMySentPermissionsQuery } from '@/hooks/usePermissions'
import { usePendingScans, useScannerPendingStatsQuery, PendingScan } from '@/hooks/useScanner'
import { useConfirmScan, useCancelScan } from '@/hooks/useScannerActions'
import { ScannerModal } from '@/components/ScannerModal'
import {
  useFolderTreeQuery,
  useFolderContentsQuery,
  useDeleteFolderMutation,
  useMoveFileToFolderMutation,
  useBulkMoveFilesToFolderMutation,
} from '@/hooks/useFolders'
import { useAuth } from '@/hooks/useAuth'
import { useAccessControl } from '@/hooks/useAccessControl'
import { addNotification } from '@/components/notifications/NotificationCenter'

import { Toolbar, ViewMode } from '@/components/files/Toolbar'
import { TabBar } from '@/components/files/TabBar'
import { Breadcrumb } from '@/components/files/Breadcrumb'
import { ExplorerPanel, FilterView } from '@/components/files/ExplorerPanel'
import { StatusBar } from '@/components/files/StatusBar'
import { FileCard } from '@/components/files/FileCard'
import { FolderCard } from '@/components/folders/FolderCard'
import { DetailsView, SortKey, SortDir, sortItems } from '@/components/files/DetailsView'
import { EmptyState, DragOverlay, FileGridSkeleton, FileRowSkeleton } from '@/components/files/EmptyState'
import { EmptyAreaContextMenu } from '@/components/files/ContextMenus'
import { PropertiesDialog } from '@/components/files/PropertiesDialog'
import { RenameFileDialog } from '@/components/files/RenameFileDialog'
import { DeleteConfirmDialog } from '@/components/files/DeleteConfirmDialog'
import { PreviewDialog } from '@/components/files/PreviewDialog'
import { ShareDialog } from '@/components/files/ShareDialog'
import { VersionHistoryDialog } from '@/components/files/VersionHistoryDialog'
import { RecycleBinView } from '@/components/files/RecycleBinView'
import { PendingScansView } from '@/components/files/PendingScansView'
import { CreateFolderDialog } from '@/components/folders/CreateFolderDialog'
import { RenameFolderDialog } from '@/components/folders/RenameFolderDialog'
import { MoveDialog } from '@/components/folders/MoveDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useSelectionManager } from '@/hooks/useSelectionManager'
import {
  fileMatchesSearch,
  fileMatchesTypeSet,
  fileMatchesConfidentialitySet,
  fileMatchesModifiedSet,
  getDepartmentName,
  getFileCategory,
  unwrapFilesList,
  DateBucket,
  GridIconSize,
} from '@/lib/file-utils'

import { FileItem } from '@/services/api/files'
import { FolderItem } from '@/services/api/folders'

const FAVORITES_KEY = 'rhv-dms:favorite-folders'
const RECENT_KEY = 'rhv-dms:recent-folders'
const VIEWMODE_KEY = 'rhv-dms:files-view-mode'
const GRID_SIZE_KEY = 'rhv-dms:grid-icon-size'

type PendingDelete =
  | { kind: 'file'; file: FileItem }
  | { kind: 'folder'; folder: FolderItem }
  | { kind: 'bulk'; fileIds: string[]; folderIds: string[] }
  | { kind: 'recycle-permanent'; fileId: string; name: string }

type MoveTarget = { type: 'file' | 'folder'; itemIds: string[]; itemName: string }

function loadSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>()
  } catch {
    return new Set()
  }
}

function saveSet(key: string, set: Set<string>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(Array.from(set)))
}

const VIEW_LABELS: Record<FilterView, string> = {
  myfiles: 'My Drive',
  received: 'Shared With Me',
  sent: 'Shared By Me',
  scanned: 'Scanned Files',
  scanner: 'Pending Scans',
  archive: 'Archive',
  recycle: 'Recycle Bin',
  recent: 'Recent',
  starred: 'Starred',
}

interface ExplorerTab {
  id: string
  activeView: FilterView
  selectedFolderId: string | null
}

function FileExplorer() {
  const { user } = useAuth()
  const { canView, filterFiles, allowedLevels } = useAccessControl()

  // ---- Tabs (each remembers its own location, like Explorer tabs) ----
  const tabIdRef = useRef(2)
  const [tabs, setTabs] = useState<ExplorerTab[]>([{ id: 'tab-1', activeView: 'myfiles', selectedFolderId: null }])
  const [activeTabId, setActiveTabId] = useState('tab-1')
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]
  const activeView = activeTab.activeView
  const selectedFolderId = activeTab.selectedFolderId

  const setActiveView = useCallback(
    (view: FilterView) => setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, activeView: view } : t))),
    [activeTabId]
  )
  const setSelectedFolderId = useCallback(
    (folderId: string | null) =>
      setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, selectedFolderId: folderId } : t))),
    [activeTabId]
  )

  const newTab = useCallback((initial?: Partial<Omit<ExplorerTab, 'id'>>) => {
    const id = `tab-${tabIdRef.current++}`
    setTabs((prev) => [...prev, { id, activeView: 'myfiles', selectedFolderId: null, ...initial }])
    setActiveTabId(id)
  }, [])

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev
        const idx = prev.findIndex((t) => t.id === id)
        const next = prev.filter((t) => t.id !== id)
        if (id === activeTabId) {
          const fallback = next[Math.max(0, idx - 1)] || next[0]
          setActiveTabId(fallback.id)
        }
        return next
      })
    },
    [activeTabId]
  )

  const [viewMode, setViewMode] = useState<ViewMode>('details')
  const [gridIconSize, setGridIconSize] = useState<GridIconSize>('large')
  const [explorerOpen, setExplorerOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  // Windows-11-style multi-select column filters (empty set = no filter on that facet)
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set())
  const [confidentialityFilters, setConfidentialityFilters] = useState<Set<string>>(new Set())
  const [modifiedFilters, setModifiedFilters] = useState<Set<DateBucket>>(new Set())

  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [propertiesItem, setPropertiesItem] = useState<
    ({ _type: 'file' } & FileItem) | ({ _type: 'folder' } & FolderItem) | null
  >(null)
  const [propertiesOpen, setPropertiesOpen] = useState(false)

  // ---- Dialog state ----
  const [createFolderState, setCreateFolderState] = useState<{ open: boolean; parentFolderId: string | null }>({
    open: false,
    parentFolderId: null,
  })
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null)
  const [renameFileTarget, setRenameFileTarget] = useState<{ fileId: string; name: string } | null>(null)
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [shareFile, setShareFile] = useState<FileItem | null>(null)
  const [versionsFile, setVersionsFile] = useState<FileItem | null>(null)
  const [reviewScan, setReviewScan] = useState<PendingScan | null>(null)

  const [favoriteFolders, setFavoriteFolders] = useState<Set<string>>(new Set())
  const [favoriteFiles, setFavoriteFiles] = useState<Set<string>>(new Set())
  const [recentFolders, setRecentFolders] = useState<string[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFavoriteFolders(loadSet(FAVORITES_KEY))
    const stored = window.localStorage.getItem(RECENT_KEY)
    if (stored) {
      try {
        setRecentFolders(JSON.parse(stored))
      } catch { }
    }
    const storedView = window.localStorage.getItem(VIEWMODE_KEY) as ViewMode | null
    if (storedView) setViewMode(storedView)
    const storedGridSize = window.localStorage.getItem(GRID_SIZE_KEY) as GridIconSize | null
    if (storedGridSize) setGridIconSize(storedGridSize)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(VIEWMODE_KEY, viewMode)
  }, [viewMode])

  useEffect(() => {
    window.localStorage.setItem(GRID_SIZE_KEY, gridIconSize)
  }, [gridIconSize])

  const toggleFavoriteFolder = useCallback((id: string) => {
    setFavoriteFolders((prev) => {
      const next = new Set<string>(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveSet(FAVORITES_KEY, next)
      return next
    })
  }, [])

  const toggleFavoriteFile = useCallback((id: string) => {
    setFavoriteFiles((prev) => {
      const next = new Set<string>(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const pushRecentFolder = useCallback((id: string) => {
    setRecentFolders((prev) => {
      const next = [id, ...prev.filter((f) => f !== id)].slice(0, 10)
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // ---- Debounced search ----
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  // ---- Selection ----
  const selection = useSelectionManager()

  useEffect(() => {
    selection.clearSelection()
  }, [activeView, selectedFolderId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Data fetching per active view ----
  const {
    data: folderContents,
    isLoading: folderContentsLoading,
    isError: folderContentsError,
  } = useFolderContentsQuery(selectedFolderId)

  const { data: ownedFilesData, isLoading: ownedLoading } = useFilesQuery(
    {
      owner: user?._id,
      page: 1,
      limit: 200,
      search: debouncedSearch || undefined,
      // Root view must only show unassigned files; explicitly ask for folderId=null
      // instead of omitting the param (which the backend treats as "no filter").
      folderId: selectedFolderId || 'null',
    },
    { enabled: !selectedFolderId }
  )

  const { data: myPermissionsData, isLoading: receivedLoading } = useMyPermissionsQuery()
  const { data: sentPermissionsData, isLoading: sentLoading } = useMySentPermissionsQuery()

  const { data: scannedFilesData, isLoading: scannedLoading } = useFilesQuery({
    isScanned: true,
    page: 1,
    limit: 200,
    search: debouncedSearch || undefined,
  })

  const { data: scannerFilesData = [], isLoading: scannerLoading } = usePendingScans()
  const { data: scannerStatsData } = useScannerPendingStatsQuery()

  const { data: archiveFilesData, isLoading: archiveLoading } = useArchiveFilesQuery({
    page: 1,
    limit: 200,
    search: debouncedSearch || undefined,
    sortBy: 'createdAt',
    sortOrder: sortDir === 'asc' ? 'asc' : 'desc',
  })

  const isRecycleView = activeView === 'recycle'
  const { data: deletedFilesData, isLoading: deletedLoading } = useDeletedFilesQuery({ page: 1, limit: 200 })

  const isScannerView = activeView === 'scanner'

  const { data: folderTree } = useFolderTreeQuery()

  // ---- Mutations ----
  const { mutate: uploadFile } = useUploadFileMutation()
  const deleteFileMutation = useDeleteFileMutation()
  const { mutate: downloadFile } = useDownloadFileMutation()
  const deleteFolderMutation = useDeleteFolderMutation()
  const { mutate: moveFileToFolder } = useMoveFileToFolderMutation()
  const { mutate: bulkMoveFiles } = useBulkMoveFilesToFolderMutation()
  const restoreFileMutation = useRestoreFileMutation()
  const permanentDeleteMutation = usePermanentDeleteFileMutation()
  const confirmScanMutation = useConfirmScan()
  const cancelScanMutation = useCancelScan()

  // ---- Derive current dataset based on active view ----
  const { folders, files, isLoading } = useMemo(() => {
    switch (activeView) {
      case 'myfiles': {
        const rawFolders: FolderItem[] = selectedFolderId
          ? folderContents?.folders || []
          : (folderTree || []).filter((f: FolderItem) => !f.parentFolderId)
        const rawFiles: FileItem[] = selectedFolderId ? folderContents?.files || [] : unwrapFilesList(ownedFilesData)
        return { folders: rawFolders, files: rawFiles, isLoading: folderContentsLoading || ownedLoading, isSystemView: false }
      }
      case 'received': {
        const rawFiles: FileItem[] = (myPermissionsData || []).map((p: any) => p.file).filter(Boolean)
        return { folders: [], files: rawFiles, isLoading: receivedLoading, isSystemView: true }
      }
      case 'sent': {
        const rawFiles: FileItem[] = (sentPermissionsData || []).map((p: any) => p.file).filter(Boolean)
        return { folders: [], files: rawFiles, isLoading: sentLoading, isSystemView: true }
      }
      case 'scanned': {
        const rawFiles: FileItem[] = unwrapFilesList(scannedFilesData)
        return { folders: [], files: rawFiles, isLoading: scannedLoading, isSystemView: true }
      }
      case 'scanner': {
        // PendingScan items are a different shape than FileItem and render via PendingScansView instead.
        return { folders: [], files: [], isLoading: scannerLoading, isSystemView: true }
      }
      case 'archive': {
        const rawFiles: FileItem[] = unwrapFilesList(archiveFilesData)
        return { folders: [], files: rawFiles, isLoading: archiveLoading, isSystemView: true }
      }
      case 'starred': {
        const rawFiles: FileItem[] = unwrapFilesList(ownedFilesData).filter((f: FileItem) =>
          favoriteFiles.has(f.fileId)
        )
        const rawFolders: FolderItem[] = (folderTree || []).filter((f: FolderItem) => favoriteFolders.has(f._id))
        return { folders: rawFolders, files: rawFiles, isLoading: ownedLoading, isSystemView: true }
      }
      case 'recent': {
        const rawFolders: FolderItem[] = (folderTree || []).filter((f: FolderItem) => recentFolders.includes(f._id))
        return { folders: rawFolders, files: [], isLoading: false, isSystemView: true }
      }
      case 'recycle':
      default:
        return { folders: [], files: [], isLoading: false, isSystemView: true }
    }
  }, [
    activeView,
    selectedFolderId,
    folderContents,
    ownedFilesData,
    folderContentsLoading,
    ownedLoading,
    myPermissionsData,
    receivedLoading,
    sentPermissionsData,
    sentLoading,
    scannedFilesData,
    scannedLoading,
    scannerLoading,
    archiveFilesData,
    archiveLoading,
    favoriteFiles,
    favoriteFolders,
    folderTree,
    recentFolders,
  ])

  // ---- Client-side search + column filters, applied uniformly across every view ----
  const visibleFiles = useMemo(() => {
    const result = filterFiles ? filterFiles(files) : files
    return result.filter(
      (f: FileItem) =>
        fileMatchesSearch(f, debouncedSearch) &&
        fileMatchesTypeSet(f, typeFilters) &&
        fileMatchesConfidentialitySet(f, confidentialityFilters) &&
        fileMatchesModifiedSet(f, modifiedFilters)
    )
  }, [files, filterFiles, debouncedSearch, typeFilters, confidentialityFilters, modifiedFilters])

  const visibleFolders = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return folders.filter(
      (f: FolderItem) =>
        (!query || f.name?.toLowerCase().includes(query)) &&
        fileMatchesConfidentialitySet(f, confidentialityFilters) &&
        fileMatchesModifiedSet(f, modifiedFilters)
    )
  }, [folders, debouncedSearch, confidentialityFilters, modifiedFilters])

  // ---- Sorting ----
  const sortedFolders = useMemo(
    () =>
      sortItems(visibleFolders, sortKey, sortDir, {
        name: (f: FolderItem) => f.name?.toLowerCase() || '',
        type: () => 'folder',
        owner: (f: any) => f.owner?.name?.toLowerCase() || '',
        department: (f: any) => getDepartmentName(f.department).toLowerCase(),
        confidentiality: (f: any) => f.confidentialityLevel || '',
        size: () => 0,
        modified: (f: FolderItem) => (f.updatedAt ? new Date(f.updatedAt).getTime() : 0),
      }),
    [visibleFolders, sortKey, sortDir]
  )

  const sortedFiles = useMemo(
    () =>
      sortItems(visibleFiles, sortKey, sortDir, {
        name: (f: FileItem) => (f.alias || f.name || '').toLowerCase(),
        type: (f: FileItem) => f.type?.toLowerCase() || '',
        owner: (f: FileItem) => (f.owner?.name || f.uploadedBy?.name || '').toLowerCase(),
        department: (f: FileItem) => getDepartmentName(f.department).toLowerCase(),
        confidentiality: (f: FileItem) => f.confidentialityLevel || '',
        size: (f: FileItem) => f.size || 0,
        modified: (f: FileItem) => (f.updatedAt ? new Date(f.updatedAt).getTime() : 0),
      }),
    [visibleFiles, sortKey, sortDir]
  )

  const recycleFiles = deletedFilesData?.files || []
  const pendingScans = scannerFilesData || []

  const stats = useMemo(() => {
    if (isRecycleView) {
      return { folderCount: 0, fileCount: recycleFiles.length, totalSize: 0 }
    }
    if (isScannerView) {
      return { folderCount: 0, fileCount: pendingScans.length, totalSize: 0 }
    }
    const totalSize = sortedFiles.reduce((sum: number, f: FileItem) => sum + (f.size || 0), 0)
    return { folderCount: sortedFolders.length, fileCount: sortedFiles.length, totalSize }
  }, [isRecycleView, recycleFiles, isScannerView, pendingScans, sortedFolders, sortedFiles])

  const isEmpty = isRecycleView
    ? !deletedLoading && recycleFiles.length === 0
    : isScannerView
      ? !scannerLoading && pendingScans.length === 0
      : !isLoading && sortedFolders.length === 0 && sortedFiles.length === 0
  const hasActiveFilters =
    !!debouncedSearch || typeFilters.size > 0 || confidentialityFilters.size > 0 || modifiedFilters.size > 0

  // ---- Handlers ----
  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
    },
    [sortKey]
  )

  const handleFolderOpen = useCallback(
    (folder: FolderItem) => {
      setSelectedFolderId(folder._id)
      setActiveView('myfiles')
      pushRecentFolder(folder._id)
    },
    [pushRecentFolder, setSelectedFolderId, setActiveView]
  )

  const openFolderInNewTab = useCallback(
    (folder: FolderItem) => {
      newTab({ activeView: 'myfiles', selectedFolderId: folder._id })
      pushRecentFolder(folder._id)
    },
    [newTab, pushRecentFolder]
  )

  const handleBreadcrumbNavigate = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId)
    setActiveView('myfiles')
  }, [])

  const handleCreateFolder = useCallback(
    (parentFolderId?: string | null) => {
      setCreateFolderState({ open: true, parentFolderId: parentFolderId ?? selectedFolderId })
    },
    [selectedFolderId]
  )

  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), [])

  const handleFilesSelected = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      Array.from(fileList).forEach((file) => {
        const formData = new FormData()
        formData.append('file', file)
        if (selectedFolderId) formData.append('folderId', selectedFolderId)
        uploadFile(
          formData,
          {
            onSuccess: () => addNotification('success', 'Upload complete', `"${file.name}" uploaded successfully.`),
            onError: () => addNotification('error', 'Upload failed', `Could not upload "${file.name}".`),
          }
        )
      })
    },
    [uploadFile, selectedFolderId]
  )

  const handleDeleteFile = useCallback((file: FileItem) => setPendingDelete({ kind: 'file', file }), [])

  const handleDeleteFolder = useCallback((folder: FolderItem) => {
    if (folder.isSystemFolder) return
    setPendingDelete({ kind: 'folder', folder })
  }, [])

  const handleBulkDelete = useCallback(() => {
    const fileIds = selection.getSelectedIds('file')
    const folderIds = selection.getSelectedIds('folder')
    if (fileIds.length === 0 && folderIds.length === 0) return
    setPendingDelete({ kind: 'bulk', fileIds, folderIds })
  }, [selection])

  const handlePermanentDeleteRequest = useCallback(
    (fileId: string, name: string) => setPendingDelete({ kind: 'recycle-permanent', fileId, name }),
    []
  )

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return
    if (pendingDelete.kind === 'file') {
      deleteFileMutation.mutate({ fileId: pendingDelete.file.fileId })
    } else if (pendingDelete.kind === 'folder') {
      deleteFolderMutation.mutate(pendingDelete.folder._id)
    } else if (pendingDelete.kind === 'bulk') {
      pendingDelete.fileIds.forEach((id) => deleteFileMutation.mutate({ fileId: id }))
      pendingDelete.folderIds.forEach((id) => deleteFolderMutation.mutate(id))
      selection.clearSelection()
    } else if (pendingDelete.kind === 'recycle-permanent') {
      permanentDeleteMutation.mutate(pendingDelete.fileId)
    }
    setPendingDelete(null)
  }, [pendingDelete, deleteFileMutation, deleteFolderMutation, permanentDeleteMutation, selection])

  const handleDownloadFile = useCallback(
    (file: FileItem) => {
      downloadFile(
        file.fileId,
        { onError: () => addNotification('error', 'Download failed', `Could not download "${file.name}".`) }
      )
    },
    [downloadFile]
  )

  const handleBulkDownload = useCallback(() => {
    const fileIds = selection.getSelectedIds('file')
    fileIds.forEach((id) => downloadFile(id))
  }, [selection, downloadFile])

  const handleMoveFile = useCallback(
    (file: FileItem) => setMoveTarget({ type: 'file', itemIds: [file.fileId], itemName: file.alias || file.name }),
    []
  )

  const handleMoveFolder = useCallback(
    (folder: FolderItem) => {
      if (folder.isSystemFolder) return
      setMoveTarget({ type: 'folder', itemIds: [folder._id], itemName: folder.name })
    },
    []
  )

  const handleMoveSelected = useCallback(() => {
    const fileIds = selection.getSelectedIds('file')
    const folderIds = selection.getSelectedIds('folder')
    if (fileIds.length > 0) {
      const first = sortedFiles.find((f) => f.fileId === fileIds[0])
      const itemName = fileIds.length > 1 ? `${fileIds.length} files` : first?.alias || first?.name || 'file'
      setMoveTarget({ type: 'file', itemIds: fileIds, itemName })
    } else if (folderIds.length === 1) {
      const folder = sortedFolders.find((f) => f._id === folderIds[0])
      if (folder) setMoveTarget({ type: 'folder', itemIds: [folder._id], itemName: folder.name })
    }
  }, [selection, sortedFiles, sortedFolders])

  const handleRenameFile = useCallback(
    (file: FileItem) => setRenameFileTarget({ fileId: file.fileId, name: file.alias || file.name }),
    []
  )

  const handleRenameFolder = useCallback((folder: FolderItem) => {
    if (folder.isSystemFolder) return
    setRenameFolderId(folder._id)
  }, [])

  const handleRenameSelected = useCallback(() => {
    if (selection.selectionCount !== 1) return
    const fileId = selection.getSelectedIds('file')[0]
    const folderId = selection.getSelectedIds('folder')[0]
    const file = sortedFiles.find((f) => f.fileId === fileId)
    const folder = sortedFolders.find((f) => f._id === folderId)
    if (file) handleRenameFile(file)
    else if (folder) handleRenameFolder(folder)
  }, [selection, sortedFiles, sortedFolders, handleRenameFile, handleRenameFolder])

  const openPreview = useCallback((file: FileItem) => {
    if (file.restricted) return
    setPreviewFile(file)
  }, [])

  const openShare = useCallback((file: FileItem) => setShareFile(file), [])
  const openVersions = useCallback((file: FileItem) => setVersionsFile(file), [])

  const handleFileOpen = useCallback(
    (file: FileItem) => {
      const category = getFileCategory(file)
      if (!file.restricted && (category === 'image' || category === 'pdf')) {
        openPreview(file)
      } else {
        handleDownloadFile(file)
      }
    },
    [openPreview, handleDownloadFile]
  )

  const handleOpenSelected = useCallback(() => {
    if (selection.selectionCount !== 1) return
    const fileId = selection.getSelectedIds('file')[0]
    const folderId = selection.getSelectedIds('folder')[0]
    const file = sortedFiles.find((f) => f.fileId === fileId)
    const folder = sortedFolders.find((f) => f._id === folderId)
    if (folder) handleFolderOpen(folder)
    else if (file) handleFileOpen(file)
  }, [selection, sortedFiles, sortedFolders, handleFolderOpen, handleFileOpen])

  const handlePreviewSelected = useCallback(() => {
    if (selection.selectionCount !== 1) return
    const fileId = selection.getSelectedIds('file')[0]
    const file = sortedFiles.find((f) => f.fileId === fileId)
    if (file) openPreview(file)
  }, [selection, sortedFiles, openPreview])

  const handleShareSelected = useCallback(() => {
    const fileId = selection.getSelectedIds('file')[0]
    const file = sortedFiles.find((f) => f.fileId === fileId)
    if (file && selection.selectionCount === 1) openShare(file)
    else addNotification('info', 'Share', 'Select a single file to share.')
  }, [selection, sortedFiles, openShare])

  const handlePaste = useCallback(() => {
    if (!selection.clipboard) return
    if (selection.clipboard.type === 'file') {
      bulkMoveFiles({ fileIds: selection.clipboard.ids, targetFolderId: selectedFolderId })
    }
    selection.clearClipboard()
  }, [selection, selectedFolderId, bulkMoveFiles])

  const handleDragStartFile = useCallback((file: FileItem) => (e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-file-id', file.fileId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDropOnFolder = useCallback(
    (folder: FolderItem) => (e: React.DragEvent) => {
      e.preventDefault()
      const fileId = e.dataTransfer.getData('application/x-file-id')
      if (fileId) {
        moveFileToFolder(
          { fileId, targetFolderId: folder._id },
          { onSuccess: () => addNotification('success', 'File moved', `Moved into "${folder.name}".`) }
        )
      }
    },
    [moveFileToFolder]
  )

  const parentFolderId = useMemo(() => {
    if (!selectedFolderId || !folderTree) return null
    const current = folderTree.find((f) => f._id === selectedFolderId)
    return current?.parentFolderId || null
  }, [selectedFolderId, folderTree])

  const handleReviewScan = useCallback((scan: PendingScan) => setReviewScan(scan), [])

  const handleCancelScan = useCallback(
    (scan: PendingScan) => cancelScanMutation.mutate(scan.id),
    [cancelScanMutation]
  )

  const handleConfirmScan = useCallback(
    (data: { id: string; alias: string; confidentialityLevel: string; description: string; format: string }) => {
      confirmScanMutation.mutate(data, { onSuccess: () => setReviewScan(null) })
    },
    [confirmScanMutation]
  )

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'c') {
          e.preventDefault()
          selection.setClipboardCopy(selection.selectedItemType || 'file')
        } else if (e.key.toLowerCase() === 'x') {
          e.preventDefault()
          selection.setClipboardCut(selection.selectedItemType || 'file')
        } else if (e.key.toLowerCase() === 'v') {
          e.preventDefault()
          handlePaste()
        } else if (e.key.toLowerCase() === 'a') {
          e.preventDefault()
          const items = [
            ...sortedFolders.map((f, i) => ({ id: f._id, type: 'folder' as const, index: i })),
            ...sortedFiles.map((f, i) => ({ id: f.fileId, type: 'file' as const, index: i + sortedFolders.length })),
          ]
          selection.selectAll(items)
        }
      } else if (e.key === 'Escape') {
        selection.clearSelection()
      } else if (e.key === 'Delete' && selection.hasSelection) {
        handleBulkDelete()
      } else if (e.key === 'F2') {
        e.preventDefault()
        handleRenameSelected()
      } else if (e.key === 'Enter') {
        handleOpenSelected()
      } else if (e.key === ' ') {
        if (selection.selectionCount === 1) {
          e.preventDefault()
          handlePreviewSelected()
        }
      } else if (e.key === 'Backspace') {
        if (selectedFolderId) {
          e.preventDefault()
          setSelectedFolderId(parentFolderId)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    selection,
    sortedFolders,
    sortedFiles,
    handleBulkDelete,
    handleRenameSelected,
    handleOpenSelected,
    handlePreviewSelected,
    handlePaste,
    selectedFolderId,
    parentFolderId,
  ])

  // ---- Drag & drop upload ----
  useEffect(() => {
    let dragCounter = 0
    const onDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        dragCounter++
        setIsDragActive(true)
      }
    }
    const onDragLeave = () => {
      dragCounter--
      if (dragCounter <= 0) setIsDragActive(false)
    }
    const onDrop = () => {
      dragCounter = 0
      setIsDragActive(false)
    }
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  const canPaste = !!selection.clipboard

  const openProperties = useCallback((item: FileItem | FolderItem, type: 'file' | 'folder') => {
    setPropertiesItem({ ...(item as any), _type: type })
    setPropertiesOpen(true)
  }, [])

  const emptyStateType = useMemo(() => {
    if (hasActiveFilters) return 'no-results' as const
    switch (activeView) {
      case 'received':
      case 'sent':
        return 'no-shared' as const
      case 'scanned':
        return 'no-scanned' as const
      case 'scanner':
        return 'no-pending' as const
      case 'archive':
        return 'no-archive' as const
      case 'recycle':
        return 'recycle-bin' as const
      default:
        return selectedFolderId ? ('folder-empty' as const) : ('no-files' as const)
    }
  }, [hasActiveFilters, activeView, selectedFolderId])

  const isDeleteMutating = deleteFileMutation.isPending || deleteFolderMutation.isPending || permanentDeleteMutation.isPending

  const tabInfos = tabs.map((tab) => {
    if (tab.selectedFolderId) {
      const folder = folderTree?.find((f) => f._id === tab.selectedFolderId)
      return { id: tab.id, label: folder?.name || 'Folder', isFolder: true }
    }
    return { id: tab.id, label: VIEW_LABELS[tab.activeView], isFolder: false }
  })

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-background rounded-xl border overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      <TabBar tabs={tabInfos} activeTabId={activeTabId} onSelect={setActiveTabId} onClose={closeTab} onNewTab={() => newTab()} />

      <DragOverlay isActive={isDragActive} onDrop={(fl) => handleFilesSelected(fl)} />

      <ExplorerPanel
        isOpen={explorerOpen}
        onClose={() => setExplorerOpen(false)}
        activeView={activeView}
        onViewChange={setActiveView}
        selectedFolderId={selectedFolderId}
        onFolderSelect={setSelectedFolderId}
        favoriteFolders={favoriteFolders}
        counts={{ scanner: scannerStatsData?.pending }}
      />

      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        gridIconSize={gridIconSize}
        onGridIconSizeChange={setGridIconSize}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortKeyChange={setSortKey}
        onSortDirChange={setSortDir}
        typeFilters={typeFilters}
        onTypeFiltersChange={setTypeFilters}
        confidentialityFilters={confidentialityFilters}
        onConfidentialityFiltersChange={setConfidentialityFilters}
        modifiedFilters={modifiedFilters}
        onModifiedFiltersChange={setModifiedFilters}
        onNewFolder={() => handleCreateFolder()}
        onUpload={handleUploadClick}
        onBulkUpload={handleUploadClick}
        onToggleExplorer={() => setExplorerOpen((v) => !v)}
        onPaste={handlePaste}
        canPaste={canPaste}
        onMove={handleMoveSelected}
        onCopy={() => selection.setClipboardCopy(selection.selectedItemType || 'file')}
        onCut={() => selection.setClipboardCut(selection.selectedItemType || 'file')}
        onRename={handleRenameSelected}
        onDelete={handleBulkDelete}
        onDownload={handleBulkDownload}
        onShare={handleShareSelected}
        onProperties={() => {
          const fileId = selection.getSelectedIds('file')[0]
          const folderId = selection.getSelectedIds('folder')[0]
          const file = sortedFiles.find((f) => f.fileId === fileId)
          const folder = sortedFolders.find((f) => f._id === folderId)
          if (file) openProperties(file, 'file')
          else if (folder) openProperties(folder, 'folder')
        }}
        searchQuery={search}
        onSearch={setSearch}
        selectedCount={selection.selectionCount}
      />

      <Breadcrumb currentFolderId={selectedFolderId} onNavigate={handleBreadcrumbNavigate} onCreateFolder={handleCreateFolder} />

      <EmptyAreaContextMenu
        onPaste={handlePaste}
        onCreateFolder={() => handleCreateFolder()}
        onUpload={handleUploadClick}
        onBulkUpload={handleUploadClick}
        hasClipboard={!!selection.clipboard}
        canPaste={canPaste}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortKey}
        onSortChange={(s) => handleSort(s as SortKey)}
      >
        <div className="flex-1 overflow-auto min-h-0" onClick={() => selection.clearSelection()}>
          {isScannerView ? (
            scannerLoading ? (
              <FileRowSkeleton />
            ) : isEmpty ? (
              <EmptyState type="no-pending" />
            ) : (
              <PendingScansView
                scans={pendingScans}
                onReview={handleReviewScan}
                onCancel={handleCancelScan}
                isMutating={cancelScanMutation.isPending}
              />
            )
          ) : isRecycleView ? (
            deletedLoading ? (
              <FileRowSkeleton />
            ) : isEmpty ? (
              <EmptyState type="recycle-bin" />
            ) : (
              <RecycleBinView
                files={recycleFiles}
                onRestore={(fileId) => restoreFileMutation.mutate(fileId)}
                onPermanentDelete={handlePermanentDeleteRequest}
                isMutating={restoreFileMutation.isPending || permanentDeleteMutation.isPending}
              />
            )
          ) : isLoading ? (
            viewMode === 'grid' ? (
              <div className="p-4">
                <FileGridSkeleton />
              </div>
            ) : (
              <FileRowSkeleton />
            )
          ) : isEmpty ? (
            <EmptyState
              type={emptyStateType}
              onAction={
                emptyStateType === 'no-files' || emptyStateType === 'folder-empty'
                  ? handleUploadClick
                  : emptyStateType === 'no-results'
                    ? () => {
                      setSearch('')
                      setTypeFilters(new Set())
                      setConfidentialityFilters(new Set())
                      setModifiedFilters(new Set())
                    }
                    : undefined
              }
            />
          ) : viewMode === 'details' ? (
            <DetailsView
              folders={sortedFolders}
              files={sortedFiles}
              isSelected={(id, type) => selection.isSelected(id, type)}
              isFavorite={(id) => favoriteFolders.has(id) || favoriteFiles.has(id)}
              canPaste={canPaste}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              typeFilters={typeFilters}
              onTypeFiltersChange={setTypeFilters}
              confidentialityFilters={confidentialityFilters}
              onConfidentialityFiltersChange={setConfidentialityFilters}
              modifiedFilters={modifiedFilters}
              onModifiedFiltersChange={setModifiedFilters}
              onOpenFolderNewTab={openFolderInNewTab}
              onSelectFile={(file, e) => {
                e.stopPropagation()
                selection.selectItem(file.fileId, 'file', sortedFolders.length + sortedFiles.indexOf(file), {
                  shiftKey: e.shiftKey,
                  ctrlKey: e.ctrlKey || e.metaKey,
                })
              }}
              onSelectFolder={(folder, e) => {
                e.stopPropagation()
                selection.selectItem(folder._id, 'folder', sortedFolders.indexOf(folder), {
                  shiftKey: e.shiftKey,
                  ctrlKey: e.ctrlKey || e.metaKey,
                })
              }}
              onOpenFile={handleFileOpen}
              onOpenFolder={handleFolderOpen}
              onPreviewFile={openPreview}
              onDownloadFile={handleDownloadFile}
              onShareFile={openShare}
              onRenameFile={handleRenameFile}
              onRenameFolder={handleRenameFolder}
              onMoveFile={handleMoveFile}
              onMoveFolder={handleMoveFolder}
              onCopyFile={(file) => selection.setClipboardCopy('file')}
              onCopyFolder={(folder) => selection.setClipboardCopy('folder')}
              onCutFile={(file) => selection.setClipboardCut('file')}
              onCutFolder={(folder) => selection.setClipboardCut('folder')}
              onPaste={handlePaste}
              onDeleteFile={handleDeleteFile}
              onDeleteFolder={handleDeleteFolder}
              onVersions={openVersions}
              onToggleFavoriteFile={(file) => toggleFavoriteFile(file.fileId)}
              onToggleFavoriteFolder={(folder) => toggleFavoriteFolder(folder._id)}
              onProperties={openProperties}
            />
          ) : (
            <div className="p-4">
              <div
                className={cn(
                  'gap-3',
                  viewMode === 'grid'
                    ? gridIconSize === 'small'
                      ? 'grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10'
                      : gridIconSize === 'medium'
                        ? 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                        : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                    : 'flex flex-col'
                )}
              >
                {sortedFolders.map((folder, index) => (
                  <FolderCard
                    key={folder._id}
                    folder={folder}
                    viewMode={viewMode as 'grid' | 'list'}
                    size={gridIconSize}
                    isSelected={selection.isSelected(folder._id, 'folder')}
                    isFavorite={favoriteFolders.has(folder._id)}
                    canPaste={canPaste}
                    onSelect={(e) =>
                      selection.selectItem(folder._id, 'folder', index, { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey || e.metaKey })
                    }
                    onOpen={() => handleFolderOpen(folder)}
                    onOpenNewTab={() => openFolderInNewTab(folder)}
                    onRename={() => handleRenameFolder(folder)}
                    onDelete={() => handleDeleteFolder(folder)}
                    onMove={() => handleMoveFolder(folder)}
                    onCopy={() => selection.setClipboardCopy('folder')}
                    onCut={() => selection.setClipboardCut('folder')}
                    onPaste={handlePaste}
                    onToggleFavorite={() => toggleFavoriteFolder(folder._id)}
                    onProperties={() => openProperties(folder, 'folder')}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropOnFolder(folder)}
                  />
                ))}
                {sortedFiles.map((file, index) => (
                  <FileCard
                    key={file.fileId}
                    file={file}
                    viewMode={viewMode as 'grid' | 'list'}
                    size={gridIconSize}
                    isSelected={selection.isSelected(file.fileId, 'file')}
                    isFavorite={favoriteFiles.has(file.fileId)}
                    canPaste={canPaste}
                    onSelect={(e) =>
                      selection.selectItem(file.fileId, 'file', sortedFolders.length + index, {
                        shiftKey: e.shiftKey,
                        ctrlKey: e.ctrlKey || e.metaKey,
                      })
                    }
                    onOpen={() => handleFileOpen(file)}
                    onPreview={() => openPreview(file)}
                    onDownload={() => handleDownloadFile(file)}
                    onShare={() => openShare(file)}
                    onMove={() => handleMoveFile(file)}
                    onCopy={() => selection.setClipboardCopy('file')}
                    onCut={() => selection.setClipboardCut('file')}
                    onPaste={handlePaste}
                    onDelete={() => handleDeleteFile(file)}
                    onRename={() => handleRenameFile(file)}
                    onVersions={() => openVersions(file)}
                    onToggleFavorite={() => toggleFavoriteFile(file.fileId)}
                    onProperties={() => openProperties(file, 'file')}
                    draggable
                    onDragStart={handleDragStartFile(file)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </EmptyAreaContextMenu>

      <StatusBar
        folderCount={stats.folderCount}
        fileCount={stats.fileCount}
        totalSize={stats.totalSize}
        selectedCount={selection.selectionCount}
        viewMode={viewMode}
      />

      <PropertiesDialog
        open={propertiesOpen}
        onOpenChange={setPropertiesOpen}
        item={propertiesItem}
        onPreview={() => propertiesItem?._type === 'file' && openPreview(propertiesItem as FileItem)}
        onDownload={() => propertiesItem?._type === 'file' && handleDownloadFile(propertiesItem as FileItem)}
        onShare={() => propertiesItem?._type === 'file' && openShare(propertiesItem as FileItem)}
        onCopy={() => propertiesItem && selection.setClipboardCopy(propertiesItem._type)}
        onMove={() => {
          if (propertiesItem?._type === 'file') handleMoveFile(propertiesItem as FileItem)
          else if (propertiesItem?._type === 'folder') handleMoveFolder(propertiesItem as FolderItem)
        }}
        onDelete={() => {
          if (!propertiesItem) return
          if (propertiesItem._type === 'file') handleDeleteFile(propertiesItem as FileItem)
          else handleDeleteFolder(propertiesItem as FolderItem)
          setPropertiesOpen(false)
        }}
      />

      <CreateFolderDialog
        open={createFolderState.open}
        onOpenChange={(open) => setCreateFolderState((s) => ({ ...s, open }))}
        parentFolderId={createFolderState.parentFolderId}
      />

      {renameFolderId && (
        <RenameFolderDialog
          open={!!renameFolderId}
          onOpenChange={(open) => !open && setRenameFolderId(null)}
          folderId={renameFolderId}
        />
      )}

      {renameFileTarget && (
        <RenameFileDialog
          open={!!renameFileTarget}
          onOpenChange={(open) => !open && setRenameFileTarget(null)}
          fileId={renameFileTarget.fileId}
          currentName={renameFileTarget.name}
        />
      )}

      {moveTarget && (
        <MoveDialog
          open={!!moveTarget}
          onOpenChange={(open) => !open && setMoveTarget(null)}
          type={moveTarget.type}
          itemIds={moveTarget.itemIds}
          itemName={moveTarget.itemName}
        />
      )}

      <DeleteConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={confirmDelete}
        isPending={isDeleteMutating}
        permanent={pendingDelete?.kind === 'recycle-permanent'}
        itemCount={pendingDelete?.kind === 'bulk' ? pendingDelete.fileIds.length + pendingDelete.folderIds.length : 1}
        itemName={
          pendingDelete?.kind === 'file'
            ? pendingDelete.file.alias || pendingDelete.file.name
            : pendingDelete?.kind === 'folder'
              ? pendingDelete.folder.name
              : pendingDelete?.kind === 'recycle-permanent'
                ? pendingDelete.name
                : undefined
        }
      />

      <PreviewDialog
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
        onDownload={() => previewFile && handleDownloadFile(previewFile)}
        onShare={() => {
          if (previewFile) {
            openShare(previewFile)
            setPreviewFile(null)
          }
        }}
      />

      <ShareDialog open={!!shareFile} onOpenChange={(open) => !open && setShareFile(null)} file={shareFile} />

      <VersionHistoryDialog
        open={!!versionsFile}
        onOpenChange={(open) => !open && setVersionsFile(null)}
        file={versionsFile}
      />

      <ScannerModal
        open={!!reviewScan}
        onOpenChange={(open) => !open && setReviewScan(null)}
        scan={reviewScan}
        onConfirm={handleConfirmScan}
        onCancel={(id) => {
          cancelScanMutation.mutate(id, { onSuccess: () => setReviewScan(null) })
        }}
        isConfirming={confirmScanMutation.isPending}
        isCancelling={cancelScanMutation.isPending}
      />

      <AlertDialog
        open={folderContentsError && !!selectedFolderId}
        onOpenChange={(open) => !open && setSelectedFolderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Folder not found</AlertDialogTitle>
            <AlertDialogDescription>
              This folder could not be found — it may have been deleted or moved. You'll be returned to My Drive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSelectedFolderId(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function FilesPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden p-2">
      <FileExplorer />
    </div>
  )
}

import apiClient from './axios'
import { FileItem } from './files'

export interface FolderStats {
  totalFiles: number
  totalFolders: number
  totalSize: number
}

export interface FolderItem {
  _id: string
  name: string
  description?: string
  parentFolderId: string | null
  createdBy: string | {
    _id: string
    name: string
    email: string
  }
  department: string | {
    _id: string
    name: string
  }
  confidentialityLevel: string
  isSystemFolder: boolean
  path: string
  level?: number
  isDeleted?: boolean
  deletedAt?: string | null
  deletedBy?: string | null
  createdAt: string
  updatedAt?: string
  sharedCount?: number
  /** Present on `/api/v1/folders/tree` nodes — nested child folders. Not present on `childFolders` returned by the folder-details endpoint. */
  children?: FolderItem[]
  /** Backend-computed aggregate stats for this folder. Present on tree nodes and on the folder-details endpoint's own `folder`/root `stats`; not present on `childFolders` entries. */
  stats?: FolderStats
}

export interface FoldersResponse {
  success: boolean
  data: {
    folders: FolderItem[]
    totalPages: number
    currentPage: number
    total: number
  }
}

export interface FolderTreeResponse {
  success: boolean
  data: FolderItem[]
}

export interface FolderContentsResponse {
  success: boolean
  data: {
    folder: FolderItem
    childFolders: FolderItem[]
    files: FileItem[]
    stats: FolderStats
  }
}

export interface CreateFolderPayload {
  name: string
  description?: string
  parentFolderId?: string | null
  confidentialityLevel?: string
}

export interface UpdateFolderPayload {
  name?: string
  description?: string
  parentFolderId?: string | null
}

export const foldersAPI = {
  getFolders: async (params?: {
    parentFolderId?: string | null
    search?: string
    confidentiality?: string
  }): Promise<FoldersResponse> => {
    const response = await apiClient.get('/api/v1/folders', { params })
    return response.data
  },

  getFolderTree: async (): Promise<FolderTreeResponse> => {
    const response = await apiClient.get('/api/v1/folders/tree')
    return response.data
  },

  /** Folder details/contents endpoint — returns the folder itself, its immediate child folders, its files, and stats. */
  getFolderContents: async (folderId: string): Promise<FolderContentsResponse> => {
    const response = await apiClient.get(`/api/v1/folders/${folderId}`)
    return response.data
  },

  createFolder: async (payload: CreateFolderPayload): Promise<{ success: boolean; data: FolderItem }> => {
    const response = await apiClient.post('/api/v1/folders', payload)
    return response.data
  },

  updateFolder: async (folderId: string, payload: UpdateFolderPayload): Promise<{ success: boolean; data: FolderItem }> => {
    const response = await apiClient.put(`/api/v1/folders/${folderId}`, payload)
    return response.data
  },

  deleteFolder: async (folderId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/folders/${folderId}`)
    return response.data
  },

  moveFileToFolder: async (payload: { fileId: string; targetFolderId: string | null }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/v1/folders/move-file', payload)
    return response.data
  },

  bulkMoveFilesToFolder: async (payload: { fileIds: string[]; targetFolderId: string | null }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/v1/folders/bulk-move-files', payload)
    return response.data
  },

  copyFileToFolder: async (payload: { fileId: string; folderId: string | null }): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.post('/api/v1/folders/copy-file', payload)
    return response.data
  },

  moveFolder: async (payload: { folderId: string; targetFolderId: string | null }): Promise<{ success: boolean; data: FolderItem }> => {
    const response = await apiClient.post('/api/v1/folders/move-folder', payload)
    return response.data
  },

  copyFolder: async (payload: { folderId: string; targetFolderId: string | null }): Promise<{ success: boolean; data: FolderItem }> => {
    const response = await apiClient.post('/api/v1/folders/copy-folder', payload)
    return response.data
  },
}

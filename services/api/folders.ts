import apiClient from './axios'

export interface FolderItem {
  _id: string
  name: string
  description?: string
  parentFolderId: string | null
  owner: {
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
  createdAt: string
  updatedAt?: string
}

export interface FolderResponse {
  success: boolean
  data: FolderItem
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

export interface FolderContentsResponse {
  success: boolean
  data: {
    folders: FolderItem[]
    files: any[]
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

  getFolder: async (folderId: string): Promise<FolderResponse> => {
    const response = await apiClient.get(`/api/v1/folders/${folderId}`)
    return response.data
  },

  getFolderTree: async (): Promise<{ success: boolean; data: FolderItem[] }> => {
    const response = await apiClient.get('/api/v1/folders/tree')
    return response.data
  },

  getFolderContents: async (folderId: string): Promise<FolderContentsResponse> => {
    const response = await apiClient.get(`/api/v1/folders/${folderId}`)
    return response.data
  },

  createFolder: async (payload: CreateFolderPayload): Promise<FolderResponse> => {
    const response = await apiClient.post('/api/v1/folders', payload)
    return response.data
  },

  updateFolder: async (folderId: string, payload: UpdateFolderPayload): Promise<FolderResponse> => {
    const response = await apiClient.put(`/api/v1/folders/${folderId}`, payload)
    return response.data
  },

  deleteFolder: async (folderId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/folders/${folderId}`)
    return response.data
  },

  moveFileToFolder: async (fileId: string, folderId: string | null): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/v1/folders/move-file', { fileId, folderId })
    return response.data
  },

  copyFileToFolder: async (fileId: string, folderId: string | null): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.post('/api/v1/folders/copy-file', { fileId, folderId })
    return response.data
  },

  moveFolder: async (folderId: string, targetFolderId: string | null): Promise<FolderResponse> => {
    const response = await apiClient.post('/api/v1/folders/move-folder', { folderId, targetFolderId })
    return response.data
  },

  copyFolder: async (folderId: string, targetFolderId: string | null): Promise<FolderResponse> => {
    const response = await apiClient.post('/api/v1/folders/copy-folder', { folderId, targetFolderId })
    return response.data
  },
}

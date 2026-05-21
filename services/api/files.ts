import apiClient from './axios'
import { API_BASE_URL } from './axios'
import { getMachineInfo } from '@/lib/machine'

export interface FileItem {
  fileId: string
  name: string
  alias?: string
  type: string
  size: number
  owner?: {
    _id: string
    name: string
    email: string
  }
  uploadedBy?: {
    _id: string
    name: string
    email: string
  }
  department: string | {
    _id: string
    name: string
  }
  tags: string[]
  confidentialityLevel: string
  isScanned: boolean
  currentVersion: number
  createdAt: string
  updatedAt?: string
  restricted?: boolean // For HOD users accessing highly confidential files
  restrictionReason?: string // Reason for restriction
}

export interface FilesResponse {
  success: boolean
  data: {
    files: FileItem[]
    totalPages: number
    currentPage: number
    total: number
  }
}

export interface Permission {
  _id: string
  fileId: string
  userId: {
    _id: string
    name: string
    email: string
  }
  access: 'view' | 'download' | 'edit'
  isRevoked: boolean
  createdAt: string
  grantedBy?: {
    _id: string
    name: string
    email: string
  }
}

export interface ShareResponse {
  success: boolean
  message: string
  data?: Permission
}

export const filesAPI = {
  // Get all files
  getFiles: async (params?: {
    page?: number
    limit?: number
    type?: string
    owner?: string
    department?: string
    fromDate?: string
    toDate?: string
    confidentiality?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    isScanned?: boolean
  }): Promise<FilesResponse> => {
    const response = await apiClient.get('/api/v1/files', { params })
    return response.data
  },

  // Get archive files
  getArchiveFiles: async (params?: {
    page?: number
    limit?: number
    search?: string
    confidentialityLevel?: string
    uploadedBy?: string
    department?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    type?: string
    restrictedOnly?: boolean
  }): Promise<FilesResponse> => {
    const response = await apiClient.get('/api/v1/files/archive', { params })
    return response.data
  },

  // Get single file
  getFile: async (fileId: string): Promise<{ success: boolean; data: FileItem }> => {
    const response = await apiClient.get(`/api/v1/files/${fileId}`)
    return response.data
  },

  // Upload file
  uploadFile: async (formData: FormData): Promise<{ success: boolean; data: FileItem }> => {
    const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://rhv-dms-backend.vercel.app')
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null

    const response = await fetch(`${baseUrl}/api/v1/files`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(errorData.message || 'Upload failed')
    }

    return response.json()
  },

  // Bulk upload
  bulkUpload: async (files: File[], onProgress?: (progress: number) => void): Promise<{ success: boolean; data: FileItem[]; message: string }> => {
    if (!files || files.length === 0) {
      throw new Error('No files provided for bulk upload')
    }

    const formData = new FormData()

    // Append files with 'files' key for bulk upload
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await apiClient.post('/api/v1/files/bulk', formData, {
      onUploadProgress: (event) => {
        if (event.lengthComputable && onProgress && event.total) {
          const percent = Math.round((event.loaded * 100) / event.total)
          onProgress(percent)
        }
      }
    })
    return response.data
  },

  // Upload scanned document (with progress support)
    uploadScan: async (formData: FormData, onProgress?: (progress: number) => void): Promise<{ success: boolean; data: FileItem; message: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://rhv-dms-backend.vercel.app')
      xhr.open('POST', `${baseUrl}/api/v1/files/scan`)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject({ response: { data: { message: 'Upload failed' } } })
        }
      }
      xhr.onerror = () => reject({ response: { data: { message: 'Network error' } } })
      xhr.send(formData)
    })
  },

  // Bulk scan upload
  bulkScanUpload: async (files: File[]): Promise<{ success: boolean; data: FileItem[]; message: string }> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })
    const response = await apiClient.post('/api/v1/files/scan/bulk', formData)
    return response.data
  },

  // Download file
  downloadFile: async (fileId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/v1/files/${fileId}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  // Preview file - returns blob
  previewFile: async (fileId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/v1/files/${fileId}/preview`, {
      responseType: 'blob',
    })
    return response.data
  },

  // Get preview URL
  getPreviewUrl: (fileId: string): string => {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rhv-dms-backend.vercel.app'}/api/v1/files/${fileId}/preview`
  },

  // Get Google Docs preview URL - embeddable iframe for document viewing
  getGoogleDocsPreviewUrl: (fileId: string): string => {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rhv-dms-backend.vercel.app'}/api/v1/files/${fileId}/preview/google`
  },

  // Update file
  updateFile: async (fileId: string, formData: FormData): Promise<{ success: boolean; data: FileItem }> => {
    const response = await apiClient.put(`/api/v1/files/${fileId}`, formData)
    return response.data
  },

  // Delete file (soft delete)
  deleteFile: async (fileId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/files/${fileId}`)
    return response.data
  },

  // Permanently delete file
  permanentDelete: async (fileId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/files/${fileId}/permanent-delete`)
    return response.data
  },

  // Restore file
  restoreFile: async (fileId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/files/${fileId}/restore`)
    return response.data
  },

  // Get deleted files
  getDeletedFiles: async (params?: {
    page?: number
    limit?: number
    showAll?: boolean
  }): Promise<{ success: boolean; data: { files: Array<{ fileId: string; name: string; deletedAt: string; permanentDeleteAt: string; deletedBy: { name: string; email: string } }>; totalPages: number; currentPage: number; total: number } }> => {
    const response = await apiClient.get('/api/v1/files/deleted', { params })
    return response.data
  },

  // Clean expired files
  cleanExpired: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/v1/files/clean-expired')
    return response.data
  },

  // Get version history
  getVersions: async (fileId: string): Promise<{ success: boolean; data: Array<{ versionNumber: number; filePath: string; size: number; uploadedBy: { name: string; email: string }; createdAt: string }> }> => {
    const response = await apiClient.get(`/api/v1/files/${fileId}/versions`)
    return response.data
  },

  // Rollback version
  rollback: async (fileId: string, versionNumber: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/files/${fileId}/rollback`, { versionNumber })
    return response.data
  },

  // Permissions
  getFilePermissions: async (fileId: string): Promise<{ success: boolean; data: Permission[] }> => {
    const response = await apiClient.get(`/api/v1/permissions/file/${fileId}`)
    return response.data
  },

  grantPermission: async (fileId: string, userId: string, access: 'view' | 'download' | 'edit'): Promise<ShareResponse> => {
    const response = await apiClient.post(`/api/v1/permissions/file/${fileId}`, { userId, access })
    return response.data
  },

  revokePermission: async (permissionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/permissions/${permissionId}/revoke`)
    return response.data
  },

  getMyPermissions: async (): Promise<{ success: boolean; data: Permission[] }> => {
    const response = await apiClient.get('/api/v1/permissions/my')
    return response.data
  },

  hodOverride: async (fileId: string, userId: string, access: 'view' | 'download' | 'edit'): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/v1/permissions/hod-override', { fileId, userId, access })
    return response.data
  },

  // ============ Scanner Pending APIs ============
  uploadToPending: async (formData: FormData, onProgress?: (progress: number) => void): Promise<{ success: boolean; data: ScannerPendingItem; message: string }> => {
    // Add machine information
    const machineInfo = getMachineInfo()
    formData.append('machineId', machineInfo.machineId)
    formData.append('machineName', machineInfo.machineName)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/v1/scanner/pending')
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject({ response: { data: { message: 'Upload to pending failed' } } })
        }
      }
      xhr.onerror = () => reject({ response: { data: { message: 'Network error' } } })
      xhr.send(formData)
    })
  },

  listPending: async (params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: { pendingScans: ScannerPendingItem[]; totalPages: number; currentPage: number; total: number } }> => {
    const response = await apiClient.get('/api/v1/scanner/pending', { params })
    return response.data
  },

  getPendingDetails: async (id: string): Promise<{ success: boolean; data: ScannerPendingItem }> => {
    const response = await apiClient.get(`/api/v1/scanner/pending/${id}`)
    return response.data
  },

  confirmPending: async (payload: {
    id: string
    alias: string
    confidentiality: string
    description: string
    format: string
  }): Promise<{ success: boolean; data: FileItem; message: string }> => {
    const response = await apiClient.post('/api/v1/scanner/confirm', payload)
    return response.data
  },

  cancelPending: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/v1/scanner/cancel', { id })
    return response.data
  },

  rejectPending: async (id: string): Promise<{ success: boolean; message: string }> => {
    const machineInfo = getMachineInfo()
    const response = await apiClient.patch(`/api/v1/scanner/pending/${id}/reject`, {
      machineId: machineInfo.machineId,
      machineName: machineInfo.machineName,
    })
    return response.data
  },

  deletePending: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/scanner/pending/${id}`)
    return response.data
  },

    getPendingStats: async (): Promise<{ success: boolean; data: ScannerStats }> => {
      const response = await apiClient.get('/api/v1/scanner/pending/stats')
      return response.data
    },
}

export interface ScannerPendingItem {
  _id: string
  id: string
  fileName: string
  originalName: string
  filePath: string
  fileSize: number
  mimeType: string
  previewUrl?: string
  isImage: boolean
  status: 'pending' | 'confirming' | 'confirmed' | 'cancelled' | 'failed'
  assignedTo: {
    _id: string
    name: string
    email: string
  }
  department: string
  scannerMetadata?: {
    scannerId: string
    scannedAt: string
  }
  createdAt: string
}

export interface ScannerStats {
  total: number
  pending: number
  confirmed: number
  cancelled: number
}




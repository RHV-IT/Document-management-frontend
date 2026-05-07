import apiClient from './axios'
import { User } from './auth'

export interface Permission {
  _id: string
  fileId: string
  userId: User
  access: 'view' | 'download' | 'edit'
  isRevoked: boolean
  createdAt: string
  grantedBy?: User  // Who granted this permission (populated)
}

export interface SentPermission {
  _id: string
  fileId: string | { _id: string; name: string; alias?: string; type: string; size: number }
  userId: User
  access: 'view' | 'download' | 'edit'
  createdAt: string
  file: {
    fileId: string
    name: string
    alias?: string
    type: string
    size: number
  }
}

export interface PermissionsResponse {
  success: boolean
  data: Permission[]
}

export interface SentPermissionsResponse {
  success: boolean
  data: SentPermission[]
  totalPages?: number
  currentPage?: number
  total?: number
}

export const permissionsAPI = {
  // Get file permissions (includes grantedBy)
  getFilePermissions: async (fileId: string): Promise<PermissionsResponse> => {
    const response = await apiClient.get(`/api/v1/permissions/file/${fileId}`)
    return response.data
  },

  // Grant permission
  grantPermission: async (
    fileId: string,
    userId: string,
    access: 'view' | 'download' | 'edit'
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/permissions/file/${fileId}`, {
      userId,
      access,
    })
    return response.data
  },

  // Revoke permission
  revokePermission: async (permissionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/permissions/${permissionId}/revoke`)
    return response.data
  },

  // Get my permissions (files shared with me) - includes grantedBy
  getMyPermissions: async (): Promise<PermissionsResponse> => {
    const response = await apiClient.get('/api/v1/permissions/my')
    return response.data
  },

  // Get my sent permissions (files I've shared) - NEW ENDPOINT
  getMySentPermissions: async (): Promise<SentPermissionsResponse> => {
    const response = await apiClient.get('/api/v1/permissions/my-sent')
    return response.data
  },

  // HOD override
  hodOverride: async (
    fileId: string,
    userId: string,
    access: 'view' | 'download' | 'edit'
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/v1/permissions/hod-override', {
      fileId,
      userId,
      access,
    })
    return response.data
  },
}

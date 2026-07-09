import apiClient from './axios'
import { User } from './auth'

export interface UsersListResponse {
  success: boolean
  data: {
    users: User[]
    totalPages: number
    currentPage: number
    total: number
  }
}

export interface UserResponse {
  success: boolean
  message?: string
  emailSent?: boolean
  emailQueued?: boolean
  data: User
}

export const usersAPI = {
  // Get all users
  getUsers: async (params?: {
    page?: number
    limit?: number
    role?: string
    status?: string
    department?: string
    search?: string
    includeDeleted?: boolean
  }): Promise<UsersListResponse> => {
    const response = await apiClient.get('/api/v1/users', { params })
    return response.data
  },

  // Get user by ID
  getUser: async (id: string): Promise<UserResponse> => {
    const response = await apiClient.get(`/api/v1/users/${id}`)
    return response.data
  },

  // Create user
  createUser: async (data: {
    name: string
    email: string
    password: string
    department: string
    departments?: string[]
    role?: string
    confidentialityLevel?: string
    confidentialityLevels?: string[]
    profiles?: { department: string; isPrimary: boolean; confidentialityLevels?: string[] }[]
  }): Promise<UserResponse> => {
    const response = await apiClient.post('/api/v1/users', data)
    return response.data
  },

  // Update user
  updateUser: async (
    id: string,
    data: Partial<{
      name: string
      email: string
      department: string
      departments: string[]
      role: string
      status: string
      confidentialityLevel: string
      confidentialityLevels: string[]
      profiles: { department: string; isPrimary: boolean; confidentialityLevels?: string[] }[]
    }>
  ): Promise<UserResponse> => {
    const response = await apiClient.put(`/api/v1/users/${id}`, data)
    return response.data
  },

  // Reset user password
  resetPassword: async ({ id, newPassword }: { id: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/users/${id}/reset`, {
      newPassword,
    })
    return response.data
  },

  // HOD request endpoints — these notify admins instead of performing actions directly
  requestSuspend: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/users/${userId}/request-suspend`)
    return response.data
  },

  // Only name/email are requestable — role, status, confidentialityLevels/confidentialityLevel,
  // and department/departments are rejected by the backend with a 400 if present in the body.
  requestEdit: async (userId: string, data: { name?: string; email?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/users/${userId}/request-edit`, data)
    return response.data
  },

  requestPasswordReset: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/users/${userId}/request-password-reset`)
    return response.data
  },

  // Suspend user
  suspendUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/users/${id}/suspend`)
    return response.data
  },

  // Restore suspended user
  restoreUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/users/${id}/restore`)
    return response.data
  },

  // Delete user
  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/users/${id}/delete`)
    return response.data
  },

  // Activate user
  activateUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/api/v1/users/${id}/activate`)
    return response.data
  },

  // Resend welcome/onboarding email
  resendWelcomeEmail: async (id: string): Promise<{ success: boolean; message: string; emailSent?: boolean }> => {
    const response = await apiClient.post(`/api/v1/users/${id}/resend-welcome-email`)
    return response.data
  },
}

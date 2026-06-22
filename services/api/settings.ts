import apiClient from './axios'

export interface Department {
  _id: string
  name: string
  code: string
  description?: string
  isActive: boolean
  createdBy?: { _id: string; name: string; email: string }
  updatedBy?: { _id: string; name: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface ConfidentialityLevel {
  _id: string
  name: string
  description?: string
  level: number
  createdAt: string
  updatedAt: string
}

export interface ConfidentialityLevelConfig {
  levels: string[]
  descriptions: Record<string, string>
}

export const settingsAPI = {
  // ============ Departments ============

  // Get all departments
  getDepartments: async (params?: {
    includeInactive?: boolean
  }): Promise<{ success: boolean; data: { departments: Department[]; totalPages: number; currentPage: number; total: number } }> => {
    const response = await apiClient.get('/api/v1/departments', { params })
    return response.data
  },

  // Get single department
  getDepartment: async (id: string): Promise<{ success: boolean; data: Department }> => {
    const response = await apiClient.get(`/api/v1/departments/${id}`)
    return response.data
  },

  // Create department
  createDepartment: async (data: { name: string; code: string; description?: string }): Promise<{ success: boolean; data: Department }> => {
    const response = await apiClient.post('/api/v1/departments', data)
    return response.data
  },

  // Update department (all fields optional)
  updateDepartment: async (id: string, data: { name?: string; code?: string; description?: string; isActive?: boolean }): Promise<{ success: boolean; data: Department }> => {
    const response = await apiClient.put(`/api/v1/departments/${id}`, data)
    return response.data
  },

  // Delete department (soft delete — sets isActive to false)
  deleteDepartment: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/departments/${id}`)
    return response.data
  },

  // ============ Confidentiality Levels ============

  createConfidentialityLevel: async (data: { name: string; description?: string; level: number }): Promise<{ success: boolean; data: ConfidentialityLevel }> => {
    const response = await apiClient.post('/api/v1/settings/confidentiality-levels', data)
    return response.data
  },

  getConfidentialityLevels: async (): Promise<{ success: boolean; data: { confidentialityLevels: ConfidentialityLevel[]; totalPages: number; currentPage: number; total: number } }> => {
    const response = await apiClient.get('/api/v1/settings/confidentiality-levels')
    return response.data
  },

  getConfidentialityLevelsConfig: async (): Promise<ConfidentialityLevelConfig> => {
    const response = await apiClient.get('/api/v1/config/confidentiality-levels')
    return response.data
  },

  updateConfidentialityLevel: async (id: string, data: { name?: string; description?: string; level?: number }): Promise<{ success: boolean; data: ConfidentialityLevel }> => {
    const response = await apiClient.put(`/api/v1/settings/confidentiality-levels/${id}`, data)
    return response.data
  },

  deleteConfidentialityLevel: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/settings/confidentiality-levels/${id}`)
    return response.data
  },

  // Initialize defaults
  initializeSettings: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/v1/settings/initialize')
    return response.data
  },
}

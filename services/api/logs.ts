import apiClient from './axios'
import { User } from './auth'

export interface AuditLog {
  userId: User
  action: string
  resource: string
  resourceId: string
  timestamp: string
}

export interface LogsResponse {
  success: boolean
  data: {
    logs: AuditLog[]
    totalPages: number
    currentPage: number
    total: number
  }
}

export const logsAPI = {
  // Get logs
  getLogs: async (params?: {
    page?: number
    limit?: number
    userId?: string
    action?: string
    fromDate?: string
    toDate?: string
    search?: string
  }): Promise<LogsResponse> => {
    const response = await apiClient.get('/api/v1/logs', { params })
    return response.data
  },

  // Get my logs
  getMyLogs: async (): Promise<{ success: boolean; data: AuditLog[] }> => {
    const response = await apiClient.get('/api/v1/logs/my')
    return response.data
  },

  // Export logs
  exportLogs: async (params?: {
    fromDate?: string
    toDate?: string
    format?: 'json' | 'csv'
  }): Promise<Blob> => {
    const response = await apiClient.get('/api/v1/logs/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  // Get log stats
  getLogStats: async (days?: number): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.get('/api/v1/logs/stats', {
      params: { days },
    })
    return response.data
  },
}

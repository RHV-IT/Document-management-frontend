import apiClient from './axios'
import { User } from './auth'

export interface AuditLog {
  _id: string
  userId: User
  userEmail: string
  action: string
  resource: string
  resourceId: string | null
  details: Record<string, unknown>
  ipAddress: string
  location: {
    country: string
    region: string
    city: string
    timezone: string
    isp: string
    latitude?: number
    longitude?: number
  }
  device: {
    browser: string
    browserVersion: string
    os: string
    osVersion: string
    deviceType: string
    deviceName: string
    userAgent: string
    platform: string
  }
  machine: {
    machineId: string
    machineName: string
    hostname: string
    platform: string
    browser: string
    browserVersion: string
    source: string
    deviceType: string
    localIP?: string
    publicIP?: string
  }
  uploadSource?: string
  sessionId: string
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

export interface LogStats {
  success: boolean
  data: {
    actionStats: Array<{ _id: string; count: number }>
    dailyStats: Array<{ _id: string; count: number }>
  }
}

export const auditAPI = {
  getLogs: async (params?: {
    page?: number
    limit?: number
    userId?: string
    action?: string
    fromDate?: string
    toDate?: string
    search?: string
    machineId?: string
  }): Promise<LogsResponse> => {
    const response = await apiClient.get('/api/v1/logs', { params })
    return response.data
  },

  getMyLogs: async (): Promise<{ success: boolean; data: AuditLog[] }> => {
    const response = await apiClient.get('/api/v1/logs/my')
    return response.data
  },

  getActions: async (): Promise<{ success: boolean; data: { actions: string[]; actionCounts: Array<{ _id: string; count: number }> } }> => {
    const response = await apiClient.get('/api/v1/logs/actions')
    return response.data
  },

  getLogsByIp: async (ip: string, params?: { page?: number; limit?: number }): Promise<LogsResponse> => {
    const response = await apiClient.get(`/api/v1/logs/ip/${ip}`, { params })
    return response.data
  },

  getLogsByDevice: async (deviceId: string, params?: { page?: number; limit?: number }): Promise<LogsResponse> => {
    const response = await apiClient.get(`/api/v1/logs/device/${deviceId}`, { params })
    return response.data
  },

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

  getLogStats: async (days?: number): Promise<LogStats> => {
    const response = await apiClient.get('/api/v1/logs/stats', {
      params: { days },
    })
    return response.data
  },
}
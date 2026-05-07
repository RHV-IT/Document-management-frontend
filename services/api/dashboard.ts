import apiClient from './axios'

export interface DashboardStats {
  totalFiles: number
  recentUploads: number
  storageUsed: string
  pendingShares: number
}

export interface RecentFile {
  fileId: string
  name: string
  alias?: string
  type: string
  size: string
  owner: {
    _id: string
    name: string
    email: string
  }
  confidentialityLevel: string
  createdAt: string
}

export interface RecentActivity {
  id: string
  action: string
  user: {
    _id: string
    name: string
    email: string
  }
  resource: string
  resourceId: string
  details: Record<string, unknown>
  timestamp: string
}

export const dashboardAPI = {
  getStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    const response = await apiClient.get('/api/v1/dashboard/stats')
    return response.data
  },

  getRecentFiles: async (): Promise<{ success: boolean; data: RecentFile[] }> => {
    const response = await apiClient.get('/api/v1/dashboard/recent-files')
    return response.data
  },

  getRecentActivity: async (): Promise<{ success: boolean; data: RecentActivity[] }> => {
    const response = await apiClient.get('/api/v1/dashboard/recent-activity')
    return response.data
  },
}
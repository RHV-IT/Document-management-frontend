import apiClient from './axios'

export interface Notification {
  _id: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface NotificationsResponse {
  success: boolean
  data: {
    notifications: Notification[]
    unreadCount: number
    currentPage: number
  }
}

export const notificationsAPI = {
  // Get notifications
  getNotifications: async (params?: {
    page?: number
    limit?: number
    unreadOnly?: boolean
  }): Promise<NotificationsResponse> => {
    const response = await apiClient.get('/api/v1/notifications', { params })
    return response.data
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<{ success: boolean; data: Notification }> => {
    const response = await apiClient.post(`/api/v1/notifications/${notificationId}/read`)
    return response.data
  },

  // Mark all as read
  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/v1/notifications/read-all')
    return response.data
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/notifications/${notificationId}`)
    return response.data
  },
}

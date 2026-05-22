import apiClient from './api/axios'

export interface PendingScan {
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

export interface ConfirmScanPayload {
  id: string
  alias: string
  confidentialityLevel: string
  description: string
  format: string
}

export interface ConfirmScanResponse {
  success: boolean
  data: {
    _id: string
    fileId: string
    name: string
    alias?: string
    filePath: string
    deleteLocal: boolean
  }
  message?: string
}

export const scannerService = {
  /**
   * Get scanner agent health from backend.
   * ALWAYS requires userId because the backend validates per-user agent status.
   */
  getHealth: async (userId?: string): Promise<any> => {
    let resolvedUserId = userId

    if (!resolvedUserId && typeof window !== 'undefined') {
      resolvedUserId = 
        localStorage.getItem('userId') || 
        sessionStorage.getItem('userId') || 
        ''
    }

    const params: any = {}
    if (resolvedUserId) params.userId = resolvedUserId

    const response = await apiClient.get('/api/v1/scanner/health', { params })
    return response.data
  },

  getPendingScans: async (machineId?: string): Promise<{ data: { pendingScans: PendingScan[] } }> => {
    const response = await apiClient.get('/api/v1/scanner/pending')
    return response.data
  },

  getPendingScan: async (id: string): Promise<{ data: PendingScan }> => {
    const response = await apiClient.get(`/api/v1/scanner/pending`)
    return response.data
  },

  confirmScan: async (payload: ConfirmScanPayload): Promise<{ data: ConfirmScanResponse }> => {
    const response = await apiClient.post('/api/v1/scanner/confirm', payload)
    return response.data
  },

  cancelScan: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/v1/scanner/cancel', { id, reason: 'User cancelled upload' })
    return response.data
  },
}
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { scannerService, PendingScan } from '@/services/scanner'
import { filesAPI, ScannerPendingItem } from '@/services/api/files'
import { addNotification } from '@/components/notifications/NotificationCenter'
import { useConfirmScan, useCancelScan } from './useScannerActions'

export type { PendingScan } from '@/services/scanner'
export type { ScannerPendingItem } from '@/services/api/files'

export { useConfirmScan, useCancelScan }

export interface ScannerConfirmPayload {
  id: string
  alias: string
  confidentialityLevel: string
  description: string
  format: string
}

export function usePendingScans(machineId?: string) {
  return useQuery({
    queryKey: ['pendingScans'],
    queryFn: () => scannerService.getPendingScans(),
    select: (response) => response.data?.pendingScans || [],
    refetchInterval: 3000,
    enabled: true,
  })
}

export function usePendingScan(id: string | null) {
  return useQuery({
    queryKey: ['pendingScan', id],
    queryFn: () => scannerService.getPendingScan(id!),
    select: (response) => response.data,
    enabled: !!id,
  })
}

export function useScannerPendingDetailsQuery(id: string | null) {
  return useQuery({
    queryKey: ['scanner-pending', id],
    queryFn: () => filesAPI.getPendingDetails(id!),
    select: (response) => response.data,
    enabled: !!id,
  })
}

export function useScannerPendingStatsQuery(machineId?: string) {
  return useQuery({
    queryKey: ['scanner-pending-stats'],
    queryFn: () => filesAPI.getPendingStats(),
    select: (response) => response.data,
    refetchInterval: 30000,
    enabled: true,
  })
}

export function useUploadToPendingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) => {
      const formData = new FormData()
      formData.append('file', file)
      return filesAPI.uploadToPending(formData, onProgress)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['scanner-pending'] })
      queryClient.invalidateQueries({ queryKey: ['scanner-pending-stats'] })
      addNotification('success', 'Upload Successful', response.message || 'File uploaded to pending for confirmation.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to upload file to pending'
      addNotification('error', 'Upload Failed', message)
    },
  })
}

export function useBulkUploadToPendingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ files, onProgress }: { files: File[]; onProgress?: (progress: number) => void }) => {
      const results: ScannerPendingItem[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('files', file)
        const response = await filesAPI.uploadToPending(formData, onProgress)
        results.push(response.data)
      }
      return results
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['scanner-pending'] })
      queryClient.invalidateQueries({ queryKey: ['scanner-pending-stats'] })
      addNotification('success', 'Upload Successful', `${results.length} file(s) uploaded to pending for confirmation.`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to upload files to pending'
      addNotification('error', 'Upload Failed', message)
    },
  })
}

export function useScannerDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return filesAPI.deletePending(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['scanner-pending'] })
      queryClient.invalidateQueries({ queryKey: ['scanner-pending-stats'] })
      addNotification('success', 'Document Deleted', response.message || 'Pending document has been deleted.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete pending document'
      addNotification('error', 'Deletion Failed', message)
    },
  })
}

export interface ScannerNewFileEvent {
  id: string
  fileName: string
  previewUrl?: string
  isImage?: boolean
}

export function useScannerSSE(onNewFile: (event: ScannerNewFileEvent) => void) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectedRef = useRef(false)

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const eventSource = new EventSource('/api/v1/scanner/events')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        isConnectedRef.current = true
      }

      eventSource.addEventListener('scanner:new-file', (event) => {
        try {
          const data = JSON.parse(event.data) as ScannerNewFileEvent
          onNewFile(data)
        } catch (e) {
          console.error('Failed to parse scanner event:', e)
        }
      })

      eventSource.onerror = () => {
        isConnectedRef.current = false
        eventSource.close()
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 5000)
      }
    } catch (error) {
      console.error('Failed to connect to scanner SSE:', error)
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, 5000)
    }
  }, [onNewFile])

  return { connect }
}

export function useScannerUploadMutation() {
  return useUploadToPendingMutation()
}

export function useScannerFilesQuery(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['scanner-pending', params],
    queryFn: () => filesAPI.listPending(params),
    select: (response) => response.data?.pendingScans || [],
    refetchInterval: 5000,
  })
}

export function useScannerPendingQuery(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['scanner-pending', params],
    queryFn: () => filesAPI.listPending(params),
    select: (response) => response.data?.pendingScans || [],
    refetchInterval: 5000,
  })
}

export function useScannerConfirmMutation() {
  return useMutation({
    mutationFn: async (payload: { id: string; alias: string; confidentiality: string; description: string; format: string }) => {
      return filesAPI.confirmPending({
        id: payload.id,
        alias: payload.alias,
        confidentiality: payload.confidentiality,
        description: payload.description,
        format: payload.format,
      })
    },
  })
}

export function useScannerCancelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return filesAPI.rejectPending(id)
    },
    onSuccess: (response, id) => {
      // Immediately remove the rejected scan from the UI
      queryClient.setQueryData(['pendingScans'], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pendingScans: oldData.pendingScans.filter((scan: any) => scan._id !== id && scan.id !== id)
        }
      })

      // Also update scanner stats
      queryClient.invalidateQueries({ queryKey: ['scanner-pending-stats'] })

      addNotification('success', 'Scan Rejected', response.message || 'Scan has been permanently rejected.')
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to reject scan'
      addNotification('error', 'Rejection Failed', message)
    },
  })
}
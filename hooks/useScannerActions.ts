import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scannerService, ConfirmScanPayload } from '@/services/scanner'
import { useDeleteAgentFile } from './useAgent'
import { addNotification } from '@/components/notifications/NotificationCenter'

export function useConfirmScan() {
  const queryClient = useQueryClient()
  const deleteAgentFile = useDeleteAgentFile()

  return useMutation({
    mutationFn: async (payload: ConfirmScanPayload) => {
      return scannerService.confirmScan(payload)
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['pendingScans'] })
      queryClient.invalidateQueries({ queryKey: ['scanner-pending'] })

      const deleteLocal = response.data?.data?.deleteLocal
      const filePath = response.data?.data?.filePath

      if (deleteLocal && filePath) {
        await deleteAgentFile.mutateAsync({ filePath })
      }

      addNotification('success', 'Upload successful', 'Scanned document has been saved successfully.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to confirm scanned document'
      addNotification('error', 'Confirmation Failed', message)
    },
  })
}

export function useCancelScan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return scannerService.cancelScan(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingScans'] })
      queryClient.invalidateQueries({ queryKey: ['scanner-pending'] })
      addNotification('success', 'Scan Cancelled', 'Scanned document has been cancelled successfully.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to cancel scanned document'
      addNotification('error', 'Cancellation Failed', message)
    },
  })
}
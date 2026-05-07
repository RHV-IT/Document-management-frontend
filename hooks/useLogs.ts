import { useMutation, useQuery } from '@tanstack/react-query'
import { logsAPI } from '@/services/api/logs'
import { toast } from 'sonner'

export function useLogsQuery(params?: {
  page?: number
  limit?: number
  userId?: string
  action?: string
  fromDate?: string
  toDate?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: () => logsAPI.getLogs(params),
    select: (response) => response.data,
  })
}

export function useMyLogsQuery() {
  return useQuery({
    queryKey: ['myLogs'],
    queryFn: () => logsAPI.getMyLogs(),
    select: (response) => response.data,
  })
}

export function useExportLogsMutation() {
  return useMutation({
    mutationFn: (params?: { fromDate?: string; toDate?: string; format?: 'json' | 'csv' }) =>
      logsAPI.exportLogs(params),
    onSuccess: (blob, params) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-${new Date().getTime()}.${params?.format === 'csv' ? 'csv' : 'json'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Logs exported successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export logs'
      toast.error(message)
    },
  })
}

export function useLogStatsQuery(days?: number) {
  return useQuery({
    queryKey: ['logStats', days],
    queryFn: () => logsAPI.getLogStats(days),
    select: (response) => response.data,
  })
}

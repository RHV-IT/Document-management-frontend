import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditAPI, AuditLog, LogsResponse } from '@/services/api/audit'
import { addNotification } from '@/components/notifications/NotificationCenter'

export function useAuditLogsQuery(params?: {
  page?: number
  limit?: number
  userId?: string
  action?: string
  fromDate?: string
  toDate?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditAPI.getLogs(params),
    select: (response) => response.data,
  })
}

export function useMyLogsQuery() {
  return useQuery({
    queryKey: ['my-logs'],
    queryFn: () => auditAPI.getMyLogs(),
    select: (response) => response.data,
  })
}

export function useAuditActionsQuery() {
  return useQuery({
    queryKey: ['audit-actions'],
    queryFn: () => auditAPI.getActions(),
    select: (response) => response.data,
  })
}

export function useAuditLogStatsQuery(days?: number) {
  return useQuery({
    queryKey: ['audit-log-stats', days],
    queryFn: () => auditAPI.getLogStats(days),
    select: (response) => response.data,
  })
}

export function useExportAuditLogsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params?: { fromDate?: string; toDate?: string; format?: 'json' | 'csv' }) =>
      auditAPI.exportLogs(params),
    onSuccess: (data, variables) => {
      const blob = new Blob([data], { type: variables?.format === 'csv' ? 'text/csv' : 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${variables?.format || 'json'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      addNotification('success', 'Success', 'Audit logs exported successfully')
    },
    onError: () => {
      addNotification('error', 'Error', 'Failed to export audit logs')
    },
  })
}
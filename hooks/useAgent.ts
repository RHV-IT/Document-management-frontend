import React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getMachineId } from '@/lib/utils'
import { agentService, AgentStatusResponse, AgentDeleteFileRequest } from '@/services/agent'
import { addNotification } from '@/components/notifications/NotificationCenter'

export function useAgentStatusQuery() {
  return useQuery({
    queryKey: ['agent-status'],
    queryFn: () => agentService.getStatus(),
    refetchInterval: 30000,
    retry: false,
    select: (data): AgentStatusResponse => data,
  })
}

export function useSyncAgentToken() {
  const mutation = useMutation({
    mutationFn: async ({ token, userId }: { token: string; userId: string }) => {
      return agentService.setToken({ token, userId, machineId: getMachineId() })
    },
    onError: (error) => {
      // Silently handle errors to avoid spamming notifications
      console.debug('Scanner agent token sync failed:', error)
    },
  })

  // Retry every 30 seconds if it failed
  React.useEffect(() => {
    if (mutation.isError) {
      const retryInterval = setInterval(() => {
        mutation.mutate({ token: '', userId: '' }) // Will use current values
      }, 30000)
      return () => clearInterval(retryInterval)
    }
  }, [mutation.isError])

  return mutation
}

export function useDeleteAgentFile() {
  return useMutation({
    mutationFn: async (request: AgentDeleteFileRequest) => {
      return agentService.deleteFile(request)
    },
    onError: (error: any) => {
      addNotification('error', 'Failed to delete local file', error.message || 'Unable to delete local scanner file.')
    },
  })
}
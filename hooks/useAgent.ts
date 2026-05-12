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
  return useMutation({
    mutationFn: async ({ token, userId }: { token: string; userId: string }) => {
      return agentService.setToken({ token, userId, machineId: getMachineId() })
    },
    onError: (error) => {
      // Don't show error notification for scanner agent connection failures
      // as it's acceptable for the agent to not be running
      console.log('Scanner agent token sync failed (this is normal if agent is not running):', error)
    },
  })
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
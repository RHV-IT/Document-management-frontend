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
    onError: () => {
      addNotification('error', 'Scanner agent not running', 'Unable to connect to the scanner agent.')
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { permissionsAPI } from '@/services/api/permissions'
import { toast } from 'sonner'

export function useFilePermissionsQuery(fileId: string) {
  return useQuery({
    queryKey: ['permissions', fileId],
    queryFn: () => permissionsAPI.getFilePermissions(fileId),
    select: (response) => response.data,
    enabled: !!fileId,
  })
}

export function useGrantPermissionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { fileId: string; userId: string; access: 'view' | 'download' | 'edit' }) =>
      permissionsAPI.grantPermission(variables.fileId, variables.userId, variables.access),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permissions', variables.fileId] })
      toast.success('Permission granted successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to grant permission'
      toast.error(message)
    },
  })
}

export function useRevokePermissionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (permissionId: string) => permissionsAPI.revokePermission(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      toast.success('Permission revoked successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to revoke permission'
      toast.error(message)
    },
  })
}

export function useMyPermissionsQuery() {
  return useQuery({
    queryKey: ['myPermissions'],
    queryFn: () => permissionsAPI.getMyPermissions(),
    select: (response) => response.data,
  })
}

export function useMySentPermissionsQuery() {
  return useQuery({
    queryKey: ['mySentPermissions'],
    queryFn: () => permissionsAPI.getMySentPermissions(),
    select: (response) => response.data,
  })
}

export function useHodOverrideMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { fileId: string; userId: string; access: 'view' | 'download' | 'edit' }) =>
      permissionsAPI.hodOverride(variables.fileId, variables.userId, variables.access),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      toast.success('Manager override applied successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to apply Manager override'
      toast.error(message)
    },
  })
}

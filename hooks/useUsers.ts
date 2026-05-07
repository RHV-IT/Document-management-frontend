import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '@/services/api/users'
import { User } from '@/services/api/auth'
import { toast } from 'sonner'

export function useUsersQuery(params?: {
  page?: number
  limit?: number
  role?: string
  status?: string
  department?: string
  search?: string
  includeDeleted?: boolean
}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersAPI.getUsers(params),
    select: (response) => response.data,
  })
}

export function useUserQuery(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersAPI.getUser(userId),
    select: (response) => response.data,
    enabled: !!userId,
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string; department: string; role?: string }) =>
      usersAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create user'
      toast.error(message)
    },
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { userId: string; data: Partial<User> }) =>
      usersAPI.updateUser(variables.userId, variables.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update user'
      toast.error(message)
    },
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (variables: { userId: string; newPassword: string }) =>
      usersAPI.resetPassword(variables.userId, variables.newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reset password'
      toast.error(message)
    },
  })
}

export function useSuspendUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => usersAPI.suspendUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success('User suspended successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to suspend user'
      toast.error(message)
    },
  })
}

export function useRestoreUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => usersAPI.restoreUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success('User restored successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to restore user'
      toast.error(message)
    },
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => usersAPI.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete user'
      toast.error(message)
    },
  })
}

export function useActivateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => usersAPI.activateUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success('User activated successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to activate user'
      toast.error(message)
    },
  })
}

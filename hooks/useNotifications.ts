import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsAPI } from '@/services/api/notifications'
import { toast } from 'sonner'

export function useNotificationsQuery(params?: {
  page?: number
  limit?: number
  unreadOnly?: boolean
  type?: string
}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsAPI.getNotifications(params),
    select: (response) => response.data,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useMarkAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => notificationsAPI.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to mark as read'
      toast.error(message)
    },
  })
}

export function useMarkAllAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to mark all as read'
      toast.error(message)
    },
  })
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => notificationsAPI.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notification deleted')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete notification'
      toast.error(message)
    },
  })
}

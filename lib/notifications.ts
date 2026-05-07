import { addNotification } from '@/components/notifications/NotificationCenter'

export const notify = {
  success: (title: string, message: string, duration = 5000) => {
    addNotification('success', title, message, duration)
  },
  error: (title: string, message: string, duration = 5000) => {
    addNotification('error', title, message, duration)
  },
  warning: (title: string, message: string, duration = 5000) => {
    addNotification('warning', title, message, duration)
  },
  info: (title: string, message: string, duration = 5000) => {
    addNotification('info', title, message, duration)
  },
}

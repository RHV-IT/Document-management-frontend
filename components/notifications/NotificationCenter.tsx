'use client'

import { toast } from 'sonner'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

let notificationId = 0

export function addNotification(
  type: Notification['type'],
  title: string,
  message: string,
  duration = 5000,
  action?: Notification['action']
) {
  const id = `notification-${++notificationId}`
  
  const options = {
    duration: duration,
    ...(action && {
      action: {
        label: action.label,
        onClick: () => action.onClick(),
      },
    }),
  }

  switch (type) {
    case 'success':
      toast.success(title, { ...options, description: message })
      break
    case 'error':
      toast.error(title, { ...options, description: message })
      break
    case 'warning':
      toast.warning(title, { ...options, description: message })
      break
    case 'info':
    default:
      toast.info(title, { ...options, description: message })
      break
  }
}

export function NotificationCenter() {
  return null
}
'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useNotificationsQuery, useMarkAsReadMutation, useDeleteNotificationMutation, useMarkAllAsReadMutation } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TableSkeleton } from '@/components/loaders/TableSkeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Bell, Check, Trash2, Eye, EyeOff, Sparkles, Calendar, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'

const NOTIFICATION_ICONS: Record<string, string> = {
  file_shared: '📄',
  file_uploaded: '📤',
  file_deleted: '🗑️',
  permission_granted: '✅',
  permission_revoked: '❌',
  user_added: '👤',
  default: '🔔',
}

const NOTIFICATION_COLORS: Record<string, string> = {
  file_shared: 'from-blue-500 to-cyan-500',
  file_uploaded: 'from-green-500 to-emerald-500',
  file_deleted: 'from-red-500 to-rose-500',
  permission_granted: 'from-emerald-500 to-teal-500',
  permission_revoked: 'from-orange-500 to-amber-500',
  user_added: 'from-purple-500 to-violet-500',
  default: 'from-gray-500 to-slate-500',
}

const NOTIFICATION_BG: Record<string, string> = {
  file_shared: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
  file_uploaded: 'bg-gradient-to-br from-green-50 to-emerald-100/50',
  file_deleted: 'bg-gradient-to-br from-red-50 to-rose-100/50',
  permission_granted: 'bg-gradient-to-br from-emerald-50 to-teal-100/50',
  permission_revoked: 'bg-gradient-to-br from-orange-50 to-amber-100/50',
  user_added: 'bg-gradient-to-br from-purple-50 to-violet-100/50',
  default: 'bg-gradient-to-br from-gray-50 to-slate-100/50',
}

export default function NotificationsPage() {
  const searchParams = useSearchParams()
  const [page, setPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data, isLoading } = useNotificationsQuery({ page, limit: 50 })
  const markAsRead = useMarkAsReadMutation()
  const markAllAsRead = useMarkAllAsReadMutation()
  const deleteNotification = useDeleteNotificationMutation()

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0
  const currentPage = data?.currentPage || 1
  const hasMore = notifications.length === 50

  useEffect(() => {
    const notificationId = searchParams.get('notificationId')
    if (!notificationId) return
    const notification = notifications.find((item: any) => item._id === notificationId)
    if (notification) {
      handleCardClick(notification)
    }
  }, [searchParams])

  const handleMarkAsRead = (notificationId: string) => {
    if (!notificationId) return
    markAsRead.mutate(notificationId)
  }

  const handleCardClick = (notification: any) => {
    const updated = { ...notification, isRead: true }
    setSelectedNotification(updated)
    setIsDialogOpen(true)
    if (!notification.isRead) {
      handleMarkAsRead(notification._id)
    }
  }

  const handleDelete = (notificationId: string) => {
    deleteNotification.mutate(notificationId)
    setDeleteConfirm(null)
    if (selectedNotification?._id === notificationId) {
      setIsDialogOpen(false)
      setSelectedNotification(null)
    }
  }

  const handleMarkAllRead = () => {
    markAllAsRead.mutate()
  }

  const getNotificationIcon = (type: string) => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default
  }

  const getNotificationColor = (type: string) => {
    return NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.default
  }

  const getNotificationBg = (type: string) => {
    return NOTIFICATION_BG[type] || NOTIFICATION_BG.default
  }

  const isUnread = (notification: any) => !notification.isRead

  return (
    <ResponsiveContainer>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b border-border p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up! No unread notifications.'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={handleMarkAllRead}
              disabled={markAllAsRead.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <Card
                    key={notification._id}
                    className={cn(
                      'transition-all duration-200 hover:shadow-lg border-l-4 cursor-pointer group',
                      notification.isRead
                        ? 'border-l-gray-200 bg-white hover:border-l-gray-300'
                        : 'border-l-blue-500 bg-gradient-to-r from-blue-50/40 to-white hover:from-blue-50/60 hover:to-white'
                    )}
                    onClick={() => handleCardClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon with animated background */}
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm',
                          'bg-gradient-to-br',
                          getNotificationColor(notification.type),
                          isUnread(notification) && 'ring-2 ring-blue-500/50 ring-offset-2'
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={cn(
                              'text-sm font-semibold leading-relaxed truncate',
                              notification.isRead ? 'text-gray-600' : 'text-gray-900'
                            )}>
                              {notification.message}
                            </p>
                            {isUnread(notification) && (
                              <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                            <span className="text-gray-300">•</span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize">
                              {notification.type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification._id)
                              }}
                              disabled={markAsRead.isPending}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirm(notification._id)
                            }}
                            disabled={deleteNotification.isPending}
                            title="Delete notification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="flex items-center justify-center pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={isLoading}
                      className="cursor-pointer"
                    >
                      Load More
                    </Button>
                    <span className="text-sm text-gray-500 ml-3">
                      Page {currentPage}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900">No notifications</p>
                  <p className="text-sm text-gray-500 mt-1">
                    You're all caught up! Check back later for updates.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modern Notification Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
          {selectedNotification && (
            <div className="relative">
              {/* Animated gradient background */}
              <div className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-90',
                getNotificationBg(selectedNotification.type)
              )} />
              
              {/* Sparkles decoration */}
              <div className="absolute top-4 right-4 opacity-50">
                <Sparkles className="h-6 w-6 text-white/60" />
              </div>
              <div className="absolute bottom-4 left-4 opacity-50">
                <Sparkles className="h-4 w-4 text-white/60" />
              </div>

              {/* Content */}
              <div className="relative p-6">
                <DialogHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    {/* Large icon */}
                    <div className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg',
                      'bg-gradient-to-br',
                      getNotificationColor(selectedNotification.type)
                    )}>
                      {getNotificationIcon(selectedNotification.type)}
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-xl font-bold text-gray-900 leading-tight">
                        {selectedNotification.message}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-gray-600 mt-2">
                        {selectedNotification.type.replace(/_/g, ' ')}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    {selectedNotification.isRead ? (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Read
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-600">
                        <Eye className="h-3 w-3 mr-1" />
                        New
                      </Badge>
                    )}
                    
                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(selectedNotification.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(selectedNotification.createdAt), 'h:mm a')}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200/60" />

                  {/* Additional details card */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notification ID</p>
                    <p className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                      {selectedNotification._id}
                    </p>
                  </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-gray-200/60">
                  <Button
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                          {!selectedNotification.isRead && (
                            <Button
                              variant="default"
                              className="cursor-pointer bg-blue-600 hover:bg-blue-700"
                              onClick={() => {
                                handleMarkAsRead(selectedNotification._id)
                                 setSelectedNotification((prev: any) => prev ? { ...prev, isRead: true } : null)
                              }}
                              disabled={markAsRead.isPending}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Mark as Read
                            </Button>
                          )}
                  <Button
                    variant="outline"
                    className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => {
                      setDeleteConfirm(selectedNotification._id)
                      setIsDialogOpen(false)
                    }}
                    disabled={deleteNotification.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  </ResponsiveContainer>
)
}

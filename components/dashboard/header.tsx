'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth'
import { useNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from '@/hooks/useNotifications'
import type { Notification } from '@/services/api/notifications'
import { Bell, Search, User, Settings, LogOut, Check, X, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

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
  file_shared: 'bg-blue-100 text-blue-600',
  file_uploaded: 'bg-green-100 text-green-600',
  file_deleted: 'bg-red-100 text-red-600',
  permission_granted: 'bg-emerald-100 text-emerald-600',
  permission_revoked: 'bg-orange-100 text-orange-600',
  user_added: 'bg-purple-100 text-purple-600',
  default: 'bg-gray-100 text-gray-600',
}

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { data: notificationsData, isLoading } = useNotificationsQuery({ limit: 5 })
  const markAsRead = useMarkAsReadMutation()
  const markAllAsRead = useMarkAllAsReadMutation()

  const unreadCount = notificationsData?.unreadCount || 0

  const getNotificationIcon = (type: string) => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default
  }

  const getNotificationColor = (type: string) => {
    return NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.default
  }

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    markAsRead.mutate(notificationId)
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification._id)
    }
  }

  return (
    <header className="h-16 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 gap-4 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          <Input 
            placeholder="Search files, tags, aliases..." 
            className="pl-10 bg-gray-50/50 border-gray-200/50 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 p-0 overflow-hidden">
            {/* Notification Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="bg-white/20 text-white text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 text-xs cursor-pointer"
                  onClick={() => markAllAsRead.mutate()}
                >
                  Mark all read
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <SkeletonLoader type="circle" className="h-8 w-8" />
                      <div className="flex-1 space-y-2">
                        <SkeletonLoader type="text" className="h-4 w-full" />
                        <SkeletonLoader type="text" className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notificationsData?.notifications && notificationsData.notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notificationsData.notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification._id}
                      className="flex items-start gap-3 py-3 px-4 cursor-pointer hover:bg-blue-50/50 transition-colors focus:bg-blue-50/50"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm', getNotificationColor(notification.type))}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium', notification.isRead ? 'text-gray-600' : 'text-gray-900')}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens</p>
                </div>
              )}
            </ScrollArea>

            {/* View All Link */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/50">
              <Link 
                href="/dashboard/notifications" 
                className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
              >
                View all notifications
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hover:bg-blue-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2">
            <div className="px-3 py-2 bg-gray-50 rounded-lg mb-2">
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {user?.department && (
                <p className="text-xs text-blue-600 mt-1">{user.department}</p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push('/dashboard/profile')}
            >
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push('/dashboard/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
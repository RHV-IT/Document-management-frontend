'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/contexts/auth'
import { useAccessControl } from '@/hooks/useAccessControl'
import { useNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from '@/hooks/useNotifications'
import type { Notification } from '@/services/api/notifications'
import { Bell, User, Settings, LogOut, Check, ChevronRight, Shield, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { GlobalSearch } from '@/components/dashboard/global-search'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { getRoleBadgeColor, getRoleLabel } from '@/lib/roles'
import { useProfileStore } from '@/stores/useProfileStore'
import { ProfileSwitcher } from './ProfileSwitcher'

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
  const { user, logout } = useAuthContext()
  const { clearanceBadge } = useAccessControl()
  const router = useRouter()
  const { data: notificationsData, isLoading } = useNotificationsQuery({ limit: 5 })
  const markAsRead = useMarkAsReadMutation()
  const markAllAsRead = useMarkAllAsReadMutation()
  const { profiles, activeProfile } = useProfileStore()
  const [profileSwitcherOpen, setProfileSwitcherOpen] = useState(false)
  const hasMultipleProfiles = profiles.length > 1 || (activeProfile !== null && profiles.length >= 1)

  const unreadCount = notificationsData?.unreadCount || 0
  const userInitial = user?.name?.charAt(0).toUpperCase() || '?'
  const departmentValue = activeProfile?.department || user?.department as any
  const departmentName = !departmentValue
    ? 'Not assigned'
    : typeof departmentValue === 'string'
      ? departmentValue
      : departmentValue.name || departmentValue._id || 'Not assigned'

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
      <div className="flex-1 max-w-xl">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3 shrink-0">
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
                      className="flex items-start gap-3 py-3 px-4 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 transition-colors"
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="max-w-xs sm:max-w-sm hover:bg-blue-50 cursor-pointer">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-white">
                  {userInitial}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[170px] sm:max-w-[220px]" title={user?.name}>
                    {user?.name || 'User'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[190px]" title={user?.role}>
                      {getRoleLabel(user?.role)}
                    </p>
                    <span className={`text-[9px] px-1 py-px rounded border font-medium tracking-tight ${clearanceBadge.color}`}>{clearanceBadge.label}</span>
                  </div>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-3">
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-lg font-bold shadow-md">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate" title={user?.name}>
                    {user?.name || 'User'}
                  </p>
                  <p className="text-sm text-gray-500 truncate mt-0.5" title={user?.email}>
                    {user?.email || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 mt-4">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white/80 border border-gray-100 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-purple-50 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-gray-400">Role</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{getRoleLabel(user?.role)}</p>
                    </div>
                  </div>
                  <Badge className={getRoleBadgeColor(user?.role)}>
                    {getRoleLabel(user?.role)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-white/80 border border-gray-100 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Shield className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{clearanceBadge.label}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-lg border font-semibold whitespace-nowrap ${clearanceBadge.color}`}>
                    {clearanceBadge.label}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-white/80 border border-gray-100 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate" title={departmentName}>
                        {departmentName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator className="my-3" />

            {hasMultipleProfiles && (
              <>
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl hover:bg-gray-50 focus:bg-gray-50 transition-colors"
                  onClick={() => setProfileSwitcherOpen(true)}
                >
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Switch Department Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-3" />
              </>
            )}

            <DropdownMenuItem
              className="cursor-pointer rounded-xl hover:bg-gray-50 focus:bg-gray-50 transition-colors"
              onClick={() => router.push('/dashboard/profile')}
            >
              <User className="h-4 w-4 mr-2 text-gray-500" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-xl hover:bg-gray-50 focus:bg-gray-50 transition-colors"
              onClick={() => router.push('/dashboard/settings')}
            >
              <Settings className="h-4 w-4 mr-2 text-gray-500" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-3" />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer rounded-xl hover:bg-red-50/50 focus:bg-red-50/50 transition-colors"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasMultipleProfiles && (
        <ProfileSwitcher open={profileSwitcherOpen} onOpenChange={setProfileSwitcherOpen} />
      )}
    </header>
  )
}

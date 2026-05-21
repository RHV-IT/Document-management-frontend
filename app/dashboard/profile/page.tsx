'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/auth'
import { useNotificationsQuery } from '@/hooks/useNotifications'
import { useUsersQuery } from '@/hooks/useUsers'
import { usePendingScans } from '@/hooks/useScanner'
import apiClient from '@/services/api/axios'
import { AgentStatusResponse } from '@/services/agent'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'
import { cn } from '@/lib/utils'
import {
  User,
  Bell,
  Shield,
  Monitor,
  Users,
  ArrowRight,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Activity,
  Building2
} from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user } = useAuth()
  const isHod = user?.role?.toLowerCase() === 'hod'

  // Fetch recent notifications (top 5)
  const { data: notificationsData, isLoading: notificationsLoading } = useNotificationsQuery({
    limit: 5,
    page: 1
  })

  // Fetch department users if HOD
  const { data: departmentUsersData, isLoading: departmentUsersLoading } = useUsersQuery({
    department: user?.department,
    status: 'active'
  })

  // Fetch pending scans for scanner status
  const { data: pendingScans, isLoading: pendingScansLoading } = usePendingScans()

  // Agent status
  const [agentStatus, setAgentStatus] = useState<AgentStatusResponse>({
    status: 'unknown',
    connected: false
  })
  const [agentLoading, setAgentLoading] = useState(true)

  // Get scanner agent status via backend (realtime, works in production)
  React.useEffect(() => {
    const checkAgentStatus = async () => {
      try {
        const userId = user?._id || user?.id
        if (!userId) {
          setAgentStatus({ status: 'offline', connected: false })
          setAgentLoading(false)
          return
        }

        // Use backend endpoint instead of direct localhost
        const response = await apiClient.get('/api/v1/scanner/health', {
          params: { userId }
        })
        const data = response.data || {}

        // Derive connected/online state from common response shapes
        const isConnected = Boolean(
          data.connected ||
          data.success ||
          data.online ||
          data.agentConnected ||
          data.watcherRunning
        )

        setAgentStatus({
          connected: isConnected,
          success: data.success,
          version: data.version,
          machineId: data.machineId,
          watcherRunning: data.watcherRunning,
          hasToken: data.hasToken,
          status: isConnected ? 'connected' : 'offline'
        })
      } catch (error) {
        setAgentStatus({ status: 'offline', connected: false })
      } finally {
        setAgentLoading(false)
      }
    }
    checkAgentStatus()
    // Refresh every 5 seconds for realtime status
    const interval = setInterval(checkAgentStatus, 5000)
    return () => clearInterval(interval)
  }, [user])

  // Recent notifications (top 5)
  const recentNotifications = useMemo(() => {
    return (notificationsData?.notifications || []).slice(0, 5)
  }, [notificationsData])

  // Department users (for HOD)
  const departmentUsers = useMemo(() => {
    return (departmentUsersData?.users || []).filter(u => u._id !== user?._id)
  }, [departmentUsersData, user])

  // Pending scans count
  const pendingScansCount = useMemo(() => {
    return (pendingScans || []).length
  }, [pendingScans])

  // Get confidentiality level color
  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'public': 'bg-green-100 text-green-700 border-green-200',
      'internal': 'bg-blue-100 text-blue-700 border-blue-200',
      'confidential': 'bg-orange-100 text-orange-700 border-orange-200',
      'highly_confidential': 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[level] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'hod':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (!user) {
    return (
      <div className="flex-1 p-8 bg-gray-50/50 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <SkeletonLoader type="card" className="h-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonLoader type="card" className="h-64" />
            <SkeletonLoader type="card" className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer>
      <div className="flex-1 p-8 bg-gray-50/50 overflow-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">View your account details, notifications, and scanner status</p>
      </div>

      <div className="max-w-6xl space-y-6">
        {/* Profile Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Profile Information
            </CardTitle>
            <CardDescription>Your personal and account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>

              {/* Details */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-base font-semibold text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-base text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Department</p>
                    <p className="text-base text-gray-900">{user.department || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <Badge className={`${getRoleBadgeColor(user.role || 'user')} mt-1`}>
                      {user.role === 'admin' ? 'Administrator' : user.role === 'hod' ? 'Head of Dept' : 'User'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Confidentiality Level</p>
                    {user.confidentialityLevel ? (
                      <Badge
                        className={`${getLevelColor(user.confidentialityLevel)} mt-1`}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {user.confidentialityLevel.replace(/_/g, ' ')}
                      </Badge>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">Not assigned</p>
                    )}
                  </div>
                </div>

                {/* Confidentiality Levels */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Confidentiality Levels</p>
                  <div className="flex flex-wrap gap-2">
                    {user.confidentialityLevels && user.confidentialityLevels.length > 0 ? (
                      user.confidentialityLevels.map((level) => (
                        <Badge key={level} className={getLevelColor(level)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {level.replace(/_/g, ' ')}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No confidentiality levels assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HOD Department Users Section */}
        {isHod && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Department Users
              </CardTitle>
              <CardDescription>Users in your department ({user.department})</CardDescription>
            </CardHeader>
            <CardContent>
              {departmentUsersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                      <SkeletonLoader type="circle" className="h-10 w-10" />
                      <div className="flex-1">
                        <SkeletonLoader type="text" className="h-4 w-32" />
                        <SkeletonLoader type="text" className="h-3 w-48 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : departmentUsers && departmentUsers.length > 0 ? (
                <div className="space-y-2">
                  {departmentUsers.map((deptUser, index) => (
                    <div
                      key={deptUser._id || deptUser.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors animate-slide-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                          {deptUser.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{deptUser.name}</p>
                          <p className="text-sm text-gray-500">{deptUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(deptUser.role || 'user')}>
                          {deptUser.role === 'admin' ? 'Admin' : deptUser.role === 'hod' ? 'HOD' : 'User'}
                        </Badge>
                        {deptUser.confidentialityLevels && deptUser.confidentialityLevels.length > 0 && (
                          <div className="flex gap-1">
                            {deptUser.confidentialityLevels.slice(0, 2).map((level) => (
                              <Badge key={level} className={cn(getLevelColor(level), 'text-[10px]')}>
                                {level.replace('_', ' ').substring(0, 4)}
                              </Badge>
                            ))}
                            {deptUser.confidentialityLevels.length > 2 && (
                              <Badge variant="secondary" className="text-[10px]">
                                +{deptUser.confidentialityLevels.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No other users in your department</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notifications Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Recent Notifications
            </CardTitle>
            <CardDescription>Your latest account notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                    <SkeletonLoader type="circle" className="h-8 w-8" />
                    <div className="flex-1 space-y-2">
                      <SkeletonLoader type="text" className="h-4 w-3/4" />
                      <SkeletonLoader type="text" className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentNotifications.length > 0 ? (
              <div className="space-y-2">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                      notification.isRead
                        ? 'bg-white border-gray-200 hover:border-gray-300'
                        : 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      notification.isRead ? 'bg-gray-100' : 'bg-blue-100'
                    )}>
                      {notification.isRead ? (
                        <CheckCircle2 className="h-4 w-4 text-gray-500" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm',
                        notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
                      )}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(notification.createdAt).toLocaleDateString()} • {notification.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <Link href="/dashboard/notifications">
                      <Button variant="ghost" size="sm" className="cursor-pointer text-blue-600 hover:text-blue-700">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scanner Agent Status Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              Scanner Agent
            </CardTitle>
            <CardDescription>Desktop scanner agent status and pending scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* Agent Status */}
               <div className="p-4 bg-gray-50 rounded-lg">
                 <div className="flex items-center gap-2 mb-2">
                   <Activity className="h-4 w-4 text-gray-500" />
                   <span className="text-sm font-medium text-gray-700">Agent Status</span>
                 </div>
                 {agentLoading ? (
                   <SkeletonLoader type="text" className="h-5 w-20" />
                 ) : (
                   <div className="space-y-2">
                     <div className="flex items-center gap-2">
                       { (agentStatus.connected || agentStatus.success) ? (
                         <>
                           <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                           <span className="text-sm font-semibold text-green-700">🟢 Scanner Connected</span>
                         </>
                       ) : (
                         <>
                           <div className="w-3 h-3 rounded-full bg-red-500" />
                           <span className="text-sm font-semibold text-red-700">🔴 Scanner Offline</span>
                         </>
                       )}
                     </div>
                     {(agentStatus.connected || agentStatus.success) && (
                       <div className="text-xs text-gray-600 space-y-0.5 pl-5">
                         {agentStatus.version && <div>Version: {agentStatus.version}</div>}
                         {agentStatus.machineId && <div>Machine: {agentStatus.machineId}</div>}
                         {typeof agentStatus.watcherRunning !== 'undefined' && (
                           <div>Watcher: {agentStatus.watcherRunning ? 'Running' : 'Stopped'}</div>
                         )}
                         {typeof agentStatus.hasToken !== 'undefined' && (
                           <div>Token: {agentStatus.hasToken ? 'Present' : 'Missing'}</div>
                         )}
                       </div>
                     )}
                   </div>
                 )}
               </div>

              {/* Pending Scans */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Pending Scans</span>
                </div>
                {pendingScansLoading ? (
                  <SkeletonLoader type="text" className="h-5 w-16" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">{pendingScansCount}</span>
                    <span className="text-sm text-gray-500">files awaiting confirmation</span>
                  </div>
                )}
              </div>

              {/* Quick Action */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Setup Guide</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">Need to install or troubleshoot the scanner?</p>
                <Link href="/dashboard/settings?tab=scanner">
                  <Button size="sm" className="cursor-pointer bg-purple-600 hover:bg-purple-700 w-full">
                    Open Scanner Settings
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </ResponsiveContainer>
)
}

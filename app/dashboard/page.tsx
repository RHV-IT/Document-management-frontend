'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/contexts/auth'
import { useAccessControl } from '@/hooks/useAccessControl'
import { useDashboardStats, useRecentFiles, useRecentActivity } from '@/hooks/useDashboard'
import {
  FileText, Upload, Clock, HardDrive, Users, Share2,
  TrendingUp, Activity, ArrowRight, File, Download,
  Trash2, Eye, Edit, LogIn, LogOut
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { OnboardingFlow } from '@/components/tutorial/OnboardingFlow'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'

const ACTION_ICONS: Record<string, React.ReactNode> = {
  upload: <Upload className="h-4 w-4 text-green-600" />,
  download: <Download className="h-4 w-4 text-blue-600" />,
  delete: <Trash2 className="h-4 w-4 text-red-600" />,
  login: <LogIn className="h-4 w-4 text-purple-600" />,
  logout: <LogOut className="h-4 w-4 text-orange-600" />,
  permission_grant: <Share2 className="h-4 w-4 text-emerald-600" />,
  permission_revoke: <Share2 className="h-4 w-4 text-red-600" />,
  file_share: <Share2 className="h-4 w-4 text-blue-600" />,
  file_update: <Edit className="h-4 w-4 text-amber-600" />,
  default: <Activity className="h-4 w-4 text-gray-600" />,
}

const ACTION_LABELS: Record<string, string> = {
  upload: 'Uploaded a file',
  download: 'Downloaded a file',
  delete: 'Deleted a file',
  login: 'Logged in',
  logout: 'Logged out',
  permission_grant: 'Granted permission',
  permission_revoke: 'Revoked permission',
  file_share: 'Shared a file',
  file_update: 'Updated a file',
}

export default function DashboardPage() {
  const { user, canAccess, isLoading, isFirstLogin } = useAuthContext()
  const { filterFiles, clearanceBadge } = useAccessControl()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentFilesRaw, isLoading: filesLoading } = useRecentFiles()
  const recentFiles = useMemo(() => filterFiles((recentFilesRaw || []) as any), [recentFilesRaw, filterFiles])
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity()

  const getActionIcon = (action: string) => {
    return ACTION_ICONS[action] || ACTION_ICONS.default
  }

  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action
  }

  const getFileTypeIcon = (type: string) => {
    const ext = type.toLowerCase()
    if (['pdf'].includes(ext)) return '📕'
    if (['doc', 'docx'].includes(ext)) return '📄'
    if (['xls', 'xlsx'].includes(ext)) return '📊'
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️'
    return '📁'
  }

  return (
    <ResponsiveContainer>
      <div className="flex-1 p-8 bg-gray-50/50 overflow-auto animate-fade-in relative">
        {/* Onboarding Flow Overlay */}
        {!isLoading && isFirstLogin() && (
          <OnboardingFlow
            isFirstLogin={true}
            onComplete={() => {
              // This callback will be called when onboarding is done
              // The incrementLoginCount is already called inside the flow
            }}
          />
        )}
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your documents today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Files */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn(
                  'p-3 rounded-xl transition-transform group-hover:scale-110',
                  'bg-blue-100'
                )}>
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="mt-4">
                {statsLoading ? (
                  <SkeletonLoader type="text" className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalFiles || 0}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Total Files</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn(
                  'p-3 rounded-xl transition-transform group-hover:scale-110',
                  'bg-green-100'
                )}>
                  <Upload className="h-6 w-6 text-green-600" />
                </div>
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div className="mt-4">
                {statsLoading ? (
                  <SkeletonLoader type="text" className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats?.recentUploads || 0}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Recent Uploads (7 days)</p>
              </div>
            </CardContent>
          </Card>

          {/* Storage Used */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn(
                  'p-3 rounded-xl transition-transform group-hover:scale-110',
                  'bg-purple-100'
                )}>
                  <HardDrive className="h-6 w-6 text-purple-600" />
                </div>
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div className="mt-4">
                {statsLoading ? (
                  <SkeletonLoader type="text" className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats?.storageUsed || '0 MB'}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Storage Used</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Shares */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn(
                  'p-3 rounded-xl transition-transform group-hover:scale-110',
                  'bg-orange-100'
                )}>
                  <Share2 className="h-6 w-6 text-orange-600" />
                </div>
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div className="mt-4">
                {statsLoading ? (
                  <SkeletonLoader type="text" className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats?.pendingShares || 0}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Shared Files</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/dashboard/upload">
            <Card className="border-0 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Upload Files</p>
                  <p className="text-sm text-gray-500">Add new documents</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/files">
            <Card className="border-0 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">My Files</p>
                  <p className="text-sm text-gray-500">View all documents</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>

          {canAccess(['admin', 'hod']) && (
            <Link href="/dashboard/admin/users">
              <Card className="border-0 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Manage Users</p>
                    <p className="text-sm text-gray-500">User administration</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Recent Files & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Files */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Files</CardTitle>
                <CardDescription className="text-sm text-gray-500">Your latest documents</CardDescription>
              </div>
              <Link href="/dashboard/files">
                <Button variant="ghost" size="sm" className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <SkeletonLoader type="circle" className="h-8 w-8" />
                      <div className="flex-1">
                        <SkeletonLoader type="text" className="h-4 w-full" />
                        <SkeletonLoader type="text" className="h-3 w-2/3 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentFiles && recentFiles.length > 0 ? (
                <Table>
                  <TableBody>
                    {recentFiles.slice(0, 5).map((file) => (
                      <TableRow key={file.fileId} className="hover:bg-gray-50/50 cursor-pointer">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getFileTypeIcon(file.type || 'unknown')}</span>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{file.alias || file.name}</p>
                              {file.alias && <p className="text-xs text-gray-400">{file.name}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Badge variant="outline" className="text-xs">
                            {file.confidentialityLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs text-gray-500">
                          {formatDistanceToNow(new Date(file.createdAt || Date.now()), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No files yet</p>
                  <Link href="/dashboard/upload">
                    <Button size="sm" className="mt-3 cursor-pointer bg-blue-600 hover:bg-blue-700">
                      Upload your first file
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                <CardDescription className="text-sm text-gray-500">Your latest actions</CardDescription>
              </div>
              {canAccess(['admin']) && (
                <Link href="/dashboard/admin/audit-log">
                  <Button variant="ghost" size="sm" className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    View all <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <SkeletonLoader type="circle" className="h-8 w-8" />
                      <div className="flex-1">
                        <SkeletonLoader type="text" className="h-4 w-full" />
                        <SkeletonLoader type="text" className="h-3 w-2/3 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50/50 transition-colors cursor-pointer">
                      <div className="p-2 rounded-lg bg-gray-100">
                        {getActionIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.user?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getActionLabel(activity.action)}
                          {activity.details?.fileName ? ` - ${String(activity.details.fileName)}` : null}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveContainer>
  )
}
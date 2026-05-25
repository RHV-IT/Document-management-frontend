'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { useUserQuery, useUpdateUserMutation, useResetPasswordMutation, useSuspendUserMutation, useActivateUserMutation, useRestoreUserMutation, useDeleteUserMutation } from '@/hooks/useUsers'
import { useAuditLogsQuery } from '@/hooks/useAuditLog'
import { 
  Activity, ArrowLeft, User, Mail, Building, Shield, Clock, Calendar,
  MoreVertical, Edit, Key, Trash2, PlayCircle, PauseCircle, RotateCcw
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatDistanceToNow, format } from 'date-fns'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  deleted: 'bg-red-100 text-red-800',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  hod: 'bg-blue-100 text-blue-800',
  user: 'bg-gray-100 text-gray-800',
}

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-orange-100 text-orange-700',
  upload: 'bg-green-100 text-green-700',
  download: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  file_share: 'bg-blue-100 text-blue-700',
  permission_grant: 'bg-green-100 text-green-700',
  permission_revoke: 'bg-red-100 text-red-700',
  default: 'bg-gray-100 text-gray-700',
}

export default function UserActivityPage() {
  const params = useParams()
  const router = useRouter()
  const { canAccess } = useAuth()
  const userId = params.userId as string
  const [page, setPage] = useState(1)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const { data: user, isLoading: userLoading } = useUserQuery(userId)
  const { data: activity, isLoading: activityLoading } = useAuditLogsQuery({
    page,
    limit: 20,
    userId,
  })

  const { mutate: updateUser } = useUpdateUserMutation()
  const { mutate: resetPassword } = useResetPasswordMutation()
  const { mutate: suspend } = useSuspendUserMutation()
  const { mutate: activate } = useActivateUserMutation()
  const { mutate: restore } = useRestoreUserMutation()
  const { mutate: deleteUser } = useDeleteUserMutation()

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) return
    resetPassword({ userId, newPassword })
    setShowResetPassword(false)
    setNewPassword('')
  }

   if (!canAccess(['admin', 'hod'])) {
     return (
        <ResponsiveContainer>
         <div className="flex-1 flex items-center justify-center p-8">
           <div className="text-center">
             <Activity className="h-16 w-16 text-red-400 mx-auto mb-4" />
             <h2 className="text-xl font-semibold">Access Denied</h2>
             <p className="text-gray-500 mt-2">You do not have permission to view user activity.</p>
             <Button onClick={() => router.push('/dashboard/admin/users')} className="mt-4 cursor-pointer">
               Go to Users
             </Button>
           </div>
         </div>
       </ResponsiveContainer>
     )
   }

   return (
     <ResponsiveContainer>
       <div className="flex-1 p-8 bg-gray-50/50 overflow-auto animate-fade-in">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard/admin/users')} className="cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>

      {/* User Info Card */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-6">
          {userLoading ? (
            <div className="flex items-center gap-4">
              <SkeletonLoader type="circle" className="h-16 w-16" />
              <div className="flex-1">
                <SkeletonLoader type="text" className="h-6 w-48" />
                <SkeletonLoader type="text" className="h-4 w-64 mt-2" />
              </div>
            </div>
          ) : user && (
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={ROLE_COLORS[user.role] || 'bg-gray-100'}>
                      {user.role}
                    </Badge>
                    <Badge className={STATUS_COLORS[user.status] || 'bg-gray-100'}>
                      {user.status || 'active'}
                    </Badge>
                    {((user.confidentialityLevels && user.confidentialityLevels.length > 0 ? user.confidentialityLevels : (user.confidentialityLevel ? [user.confidentialityLevel] : [])).slice(0,1)[0]) && (
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: {
                            public: '#10b981',
                            internal: '#3b82f6',
                            confidential: '#f59e0b',
                            highly_confidential: '#ef4444'
                          }[((user.confidentialityLevels && user.confidentialityLevels.length > 0 ? user.confidentialityLevels : (user.confidentialityLevel ? [user.confidentialityLevel] : [])).slice(0,1)[0])] + '20',
                          color: {
                            public: '#065f46',
                            internal: '#1e40af',
                            confidential: '#92400e',
                            highly_confidential: '#991b1b'
                          }[((user.confidentialityLevels && user.confidentialityLevels.length > 0 ? user.confidentialityLevels : (user.confidentialityLevel ? [user.confidentialityLevel] : [])).slice(0,1)[0])],
                          border: `1px solid ${
                            {
                              public: '#10b981',
                              internal: '#3b82f6',
                              confidential: '#f59e0b',
                              highly_confidential: '#ef4444'
                            }[((user.confidentialityLevels && user.confidentialityLevels.length > 0 ? user.confidentialityLevels : (user.confidentialityLevel ? [user.confidentialityLevel] : [])).slice(0,1)[0])]
                          }`
                        }}
                      >
                        {((user.confidentialityLevels && user.confidentialityLevels.length > 0 ? user.confidentialityLevels : (user.confidentialityLevel ? [user.confidentialityLevel] : [])).slice(0,1)[0]).replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="cursor-pointer">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => updateUser({ userId, data: { name: user.name, email: user.email } })}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowResetPassword(true)}>
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                    {user.status === 'active' ? (
                      <DropdownMenuItem onClick={() => suspend(userId)} className="text-orange-600">
                        <PauseCircle className="h-4 w-4 mr-2" />
                        Suspend User
                      </DropdownMenuItem>
                    ) : user.status === 'suspended' ? (
                      <>
                        <DropdownMenuItem onClick={() => restore(userId)}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Restore User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteUser(userId)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </>
                    ) : null}
                    {user.status !== 'active' && user.status !== 'suspended' && (
                      <DropdownMenuItem onClick={() => activate(userId)}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Activate User
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Activity Log</h2>
            <p className="text-sm text-gray-500">Recent user activities</p>
          </div>
          
          {activityLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <SkeletonLoader type="circle" className="h-10 w-10" />
                  <div className="flex-1">
                    <SkeletonLoader type="text" className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity?.logs && activity.logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="font-semibold">Resource</TableHead>
                  <TableHead className="font-semibold">IP Address</TableHead>
                  <TableHead className="font-semibold">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>
                      <Badge className={ACTION_COLORS[log.action] || ACTION_COLORS.default}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{log.resource}</TableCell>
                    <TableCell className="text-gray-500">{log.ipAddress}</TableCell>
                    <TableCell className="text-gray-500">
                      {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No activity found</p>
            </div>
          )}

          {activity && activity.totalPages > 0 && (
            <div className="flex items-center justify-between p-4 border-t bg-gray-50/30">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Showing {(activity.currentPage - 1) * 20 + 1}-{Math.min(activity.currentPage * 20, activity.total)} of {activity.total}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activity.currentPage === 1}
                  onClick={() => setPage(1)}
                  className="cursor-pointer"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activity.currentPage === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="cursor-pointer"
                >
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {activity.currentPage} of {activity.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activity.currentPage === activity.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="cursor-pointer"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activity.currentPage === activity.totalPages}
                  onClick={() => setPage(activity.totalPages)}
                  className="cursor-pointer"
                >
                  Last
                </Button>
                <Select value={String(page)} onValueChange={(value) => setPage(Number(value))}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: activity.totalPages }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for {user?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 cursor-pointer">
                  Reset Password
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowResetPassword(false)} className="flex-1 cursor-pointer">
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  </ResponsiveContainer>
)
}
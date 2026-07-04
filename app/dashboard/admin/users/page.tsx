'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfidentialityLevelSelect } from '@/components/ui/ConfidentialityLevelSelect'

import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { settingsAPI } from '@/services/api/settings'
import {
  useUsersQuery,
  useSuspendUserMutation,
  useActivateUserMutation,
  useResetPasswordMutation,
  useRestoreUserMutation,
  useDeleteUserMutation,
  useRequestSuspendMutation,
  useRequestPasswordResetMutation,
} from '@/hooks/useUsers'
import { UserFormDialog } from '@/components/admin/UserFormDialog'
import { useNotificationsQuery, useMarkAsReadMutation } from '@/hooks/useNotifications'
import { useAuditLogsQuery } from '@/hooks/useAuditLog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'
import { MoreHorizontal, Plus, Grid3X3, List, Search, Mail, Building, Calendar, MoreVertical, User, Shield, Clock, MapPin, Activity, Lock, CheckCircle, Eye, AlertCircle, AlertTriangle, X, Check, HelpCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { TableSkeleton } from '@/components/loaders/TableSkeleton'
import { getRoleBadgeColor, getRoleLabel, isHodRole } from '@/lib/roles'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip'

type ViewMode = 'grid' | 'table'

interface UserType {
  _id?: string
  id?: string
  name: string
  email: string
  role: string
  department: string
  departments?: string[]
  status: string
  confidentialityLevel?: string
  confidentialityLevels?: string[]
  profiles?: {
    _id?: string
    department: string
    isPrimary: boolean
    confidentialityLevels?: string[]
  }[]
  createdAt?: string
}

interface DepartmentOption {
  _id: string
  name: string
  code: string
  description?: string
  isActive: boolean
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  deleted: 'bg-red-100 text-red-800',
}


export default function AdminUsersPage() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activityUser, setActivityUser] = useState<UserType | null>(null)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)

  // Password reset
  const [resetPwUser, setResetPwUser] = useState<UserType | null>(null)
  const [isResetPwOpen, setIsResetPwOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  // User action (suspend/activate/restore/delete)
  const [actionUser, setActionUser] = useState<UserType | null>(null)
  const [actionType, setActionType] = useState<string>('')
  const [actionDialogOpen, setActionDialogOpen] = useState(false)

  // Helper: get the highest clearance level from user's profiles or legacy fields
  const getUserHighestClearanceLevel = (user: UserType) => {
    // If profiles exist, collect all confidentiality levels from all profiles
    if (user.profiles && user.profiles.length > 0) {
      const allLevels: string[] = []
      user.profiles.forEach(profile => {
        if (profile.confidentialityLevels && Array.isArray(profile.confidentialityLevels)) {
          allLevels.push(...profile.confidentialityLevels)
        }
      })
      if (allLevels.length > 0) {
        const order: Record<string, number> = {
          public: 0,
          internal: 1,
          confidential: 2,
          highly_confidential: 3
        }
        const sorted = [...allLevels].sort((a, b) => (order[a] || 99) - (order[b] || 99))
        return sorted.pop() || ''
      }
    }
    // Fallback to legacy fields
    if (user.confidentialityLevels && user.confidentialityLevels.length > 0) {
      const order: Record<string, number> = {
        public: 0,
        internal: 1,
        confidential: 2,
        highly_confidential: 3
      }
      const sorted = [...user.confidentialityLevels].sort((a, b) => (order[a] || 99) - (order[b] || 99))
      return sorted.pop() || ''
    }
    if (user.confidentialityLevel) {
      return user.confidentialityLevel
    }
    return ''
  }

  const { user } = useAuth()
  const currentUserDept = user?.department || ''
  const isManager = isHodRole(user?.role)
  const router = useRouter()

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => settingsAPI.getDepartments(),
  })

  const departments: DepartmentOption[] = departmentsData?.data || []

  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || ''
    if (searchFromUrl !== search) {
      setSearch(searchFromUrl)
      setPage(1)
    }
  }, [searchParams])

  const { data, isLoading } = useUsersQuery({
    page,
    limit,
    search: search || undefined,
    role: roleFilter || undefined,
    department: isManager ? user?.department : undefined,
  })

  const users: UserType[] = (data?.users as UserType[]) ?? []

  // Mutations
  const { mutate: suspend } = useSuspendUserMutation()
  const { mutate: activate } = useActivateUserMutation()
  const { mutate: resetPassword } = useResetPasswordMutation()
  const { mutate: restore } = useRestoreUserMutation()
  const { mutate: deleteUser } = useDeleteUserMutation()

  // HOD request mutations
  const { mutate: requestSuspend } = useRequestSuspendMutation()
  const { mutate: requestPasswordReset } = useRequestPasswordResetMutation()

  // Notifications (for admins to see HOD requests)
  const { data: notificationsData } = useNotificationsQuery({ type: 'user_action_request', limit: 20 })
  const { mutate: markNotifAsRead } = useMarkAsReadMutation()

  const { data: activityData, isLoading: activityLoading } = useAuditLogsQuery({
    userId: activityUser?._id || activityUser?.id,
  })

  const handleEditUser = (user: UserType) => {
    setEditingUser(user)
    setIsEditDialogOpen(true)
  }

  const handleViewActivity = (user: UserType) => {
    setActivityUser(user)
    setIsActivityDialogOpen(true)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !resetPwUser) return
    resetPassword({ userId: resetPwUser._id || resetPwUser.id!, newPassword })
    setIsResetPwOpen(false)
    setResetPwUser(null)
    setNewPassword('')
  }

  const handleUserAction = () => {
    if (!actionUser) return
    const userId = actionUser._id || actionUser.id!
    switch (actionType) {
      case 'suspend':
        suspend(userId)
        break
      case 'request-suspend':
        requestSuspend(userId)
        break
      case 'request-password-reset':
        requestPasswordReset(userId)
        break
      case 'activate':
        activate(userId)
        break
      case 'restore':
        restore(userId)
        break
      case 'delete':
        deleteUser(userId)
        break
    }
    setActionDialogOpen(false)
    setActionUser(null)
  }

  return (
    <ResponsiveContainer>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Header */}
        <div className="border-b border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="cursor-pointer"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="cursor-pointer"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button size="lg" className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-xs relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="h-9 pl-10"
              />
            </div>
          </div>
        </div>

        {/* HOD Action Requests â€” only visible to admins */}
        {!isManager && notificationsData?.notifications && notificationsData.notifications.length > 0 && (
          <div className="px-6 pt-4">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Pending Requests from Managers</span>
                  <span className="text-xs bg-amber-200 text-amber-800 rounded-full px-2 py-0.5">{notificationsData.notifications.length}</span>
                </div>
                <div className="space-y-2">
                  {notificationsData.notifications.map((notif) => (
                    <div key={notif._id} className="flex items-center justify-between bg-white rounded-lg border border-amber-100 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 truncate">{notif.message}</p>
                          <p className="text-xs text-gray-400">
                            {notif.details?.requestedBy?.name && `From: ${notif.details.requestedBy.name} â€¢ `}
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {notif.details?.action === 'suspend' && notif.details?.targetUserId && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 cursor-pointer"
                            onClick={() => { setActionUser({ _id: notif.details!.targetUserId!, name: notif.details!.targetUserName || '' } as UserType); setActionType('suspend'); setActionDialogOpen(true); markNotifAsRead(notif._id); }}
                          >
                            Suspend
                          </Button>
                        )}
                        {notif.details?.action === 'edit' && notif.details?.targetUserId && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 cursor-pointer"
                            onClick={() => { markNotifAsRead(notif._id); }}
                          >
                            Review
                          </Button>
                        )}
                        {notif.details?.action === 'password_reset' && notif.details?.targetUserId && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 cursor-pointer"
                            onClick={() => { setResetPwUser({ _id: notif.details!.targetUserId!, name: notif.details!.targetUserName || '' } as UserType); setIsResetPwOpen(true); markNotifAsRead(notif._id); }}
                          >
                            Reset Pw
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 cursor-pointer text-gray-400 hover:text-gray-600"
                          onClick={() => markNotifAsRead(notif._id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Display */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : data?.users && data.users.length > 0 ? (
            viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.users.map((user) => (
                  <Card
                    key={user._id || user.id}
                    className="hover:shadow-md transition-shadow relative cursor-pointer"
                    onClick={() => {
                      if (openDropdown === (user._id || user.id)) {
                        setOpenDropdown(null)
                      } else {
                        setSelectedUser(user)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-semibold shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{user.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <Badge className={STATUS_COLORS[user.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                          {user.status || 'active'}
                        </Badge>
                        {(() => {
                          const lvl = getUserHighestClearanceLevel(user)
                          return lvl ? (
                            <Badge
                              className="text-xs"
                              style={{
                                backgroundColor: {
                                  public: '#10b981',
                                  internal: '#3b82f6',
                                  confidential: '#f59e0b',
                                  highly_confidential: '#ef4444'
                                }[lvl] + '20',
                                color: {
                                  public: '#065f46',
                                  internal: '#1e40af',
                                  confidential: '#92400e',
                                  highly_confidential: '#991b1b'
                                }[lvl],
                                border: `1px solid ${{
                                  public: '#10b981',
                                  internal: '#3b82f6',
                                  confidential: '#f59e0b',
                                  highly_confidential: '#ef4444'
                                }[lvl]}`
                              }}
                            >
                              {lvl.replace(/_/g, ' ')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )
                        })()}
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <Building className="h-3 w-3 mt-0.5 shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {(user as UserType).profiles?.[0] ? (
                              (user as UserType).profiles!.map((profile, idx) => (
                                <span key={profile._id ?? `profile-${idx}`} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${profile.isPrimary ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {profile.department}{profile.isPrimary && ' â€¢ Primary'}
                                </span>
                              ))
                            ) : (
                              <span className="truncate">{(user as UserType).department}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(user.createdAt || ''), { addSuffix: true })}</span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <Building className="h-3 w-3 mt-0.5 shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {user.departments && user.departments.length > 0 ? (
                              user.departments.map((dept, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                  {dept}
                                </span>
                              ))
                            ) : (
                              <span className="truncate">{user.department}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(user.createdAt || ''), { addSuffix: true })}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t flex justify-end">
                        <DropdownMenu open={openDropdown === (user._id || user.id)} onOpenChange={(open) => {
                          if (!open) setOpenDropdown(null)
                        }}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="cursor-pointer absolute top-2 right-2 z-10"
                              onClick={(e) => {
                                e.stopPropagation()
                                const userId = user._id || user.id || null
                                setOpenDropdown(openDropdown === userId ? null : userId)
                              }}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Edit: HOD can only edit name/email; admin has full edit */}
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditUser(user); setOpenDropdown(null) }}>Edit User</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewActivity(user); setOpenDropdown(null) }}>View Activity</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {isManager ? (
                              <>
                                {/* HOD: request actions that notify admin */}
                                {user.status === 'active' && (
                                  <DropdownMenuItem
                                    className="text-orange-600"
                                    onClick={(e) => { e.stopPropagation(); setActionUser(user); setActionType('request-suspend'); setActionDialogOpen(true); setOpenDropdown(null) }}
                                  >
                                    Request Suspend
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => { e.stopPropagation(); setActionUser(user); setActionType('request-password-reset'); setActionDialogOpen(true); setOpenDropdown(null) }}
                                >
                                  Request Password Reset
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                {/* Admin: direct actions */}
                                {user.status === 'active' ? (
                                  <DropdownMenuItem
                                    className="text-orange-600"
                                    onClick={(e) => { e.stopPropagation(); setActionUser(user); setActionType('suspend'); setActionDialogOpen(true); setOpenDropdown(null) }}
                                  >
                                    Suspend User
                                  </DropdownMenuItem>
                                ) : user.status === 'suspended' ? (
                                  <>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setActionUser(user); setActionType('restore'); setActionDialogOpen(true); setOpenDropdown(null) }}>
                                      Restore User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={(e) => { e.stopPropagation(); setActionUser(user); setActionType('delete'); setActionDialogOpen(true); setOpenDropdown(null) }}
                                    >
                                      Delete User
                                    </DropdownMenuItem>
                                  </>
                                ) : user.status === 'deleted' ? (
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setActionUser(user); setActionType('activate'); setActionDialogOpen(true); setOpenDropdown(null) }}>
                                    Activate User
                                  </DropdownMenuItem>
                                ) : null}
                                {user.status !== 'active' && user.status !== 'deleted' && user.status !== 'suspended' ? (
                                  <DropdownMenuItem
                                    className="text-orange-600"
                                    onClick={(e) => { e.stopPropagation(); setActionUser(user); setActionType('suspend'); setActionDialogOpen(true); setOpenDropdown(null) }}
                                  >
                                    Suspend User
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setResetPwUser(user); setIsResetPwOpen(true); setOpenDropdown(null) }}>Reset Password</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Table View */
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Confidentiality</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-12 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user) => (
                      <TableRow key={user._id || user.id} className="cursor-pointer" onClick={() => setSelectedUser(user)}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[user.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                            {user.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const lvl = getUserHighestClearanceLevel(user)
                            return lvl ? (
                              <Badge
                                className="text-xs"
                                style={{
                                  backgroundColor: {
                                    public: '#10b981',
                                    internal: '#3b82f6',
                                    confidential: '#f59e0b',
                                    highly_confidential: '#ef4444'
                                  }[lvl] + '20',
                                  color: {
                                    public: '#065f46',
                                    internal: '#1e40af',
                                    confidential: '#92400e',
                                    highly_confidential: '#991b1b'
                                  }[lvl],
                                  border: `1px solid ${{
                                    public: '#10b981',
                                    internal: '#3b82f6',
                                    confidential: '#f59e0b',
                                    highly_confidential: '#ef4444'
                                  }[lvl]}`
                                }}
                              >
                                {lvl.replace(/_/g, ' ')}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )
                          })()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(user.createdAt || ''), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>Edit User</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewActivity(user)}>View Activity</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {isManager ? (
                                <>
                                  {user.status === 'active' && (
                                    <DropdownMenuItem
                                      className="text-orange-600"
                                      onClick={() => { setActionUser(user); setActionType('request-suspend'); setActionDialogOpen(true) }}
                                    >
                                      Request Suspend
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => { setActionUser(user); setActionType('request-password-reset'); setActionDialogOpen(true) }}
                                  >
                                    Request Password Reset
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => { setResetPwUser(user); setIsResetPwOpen(true) }}>Reset Password</DropdownMenuItem>
                                  {user.status === 'active' ? (
                                    <DropdownMenuItem
                                      className="text-orange-600"
                                      onClick={() => { setActionUser(user); setActionType('suspend'); setActionDialogOpen(true) }}
                                    >
                                      Suspend User
                                    </DropdownMenuItem>
                                  ) : user.status === 'suspended' ? (
                                    <>
                                      <DropdownMenuItem onClick={() => { setActionUser(user); setActionType('restore'); setActionDialogOpen(true) }}>
                                        Restore User
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => { setActionUser(user); setActionType('delete'); setActionDialogOpen(true) }}
                                      >
                                        Delete User
                                      </DropdownMenuItem>
                                    </>
                                  ) : user.status === 'deleted' ? (
                                    <DropdownMenuItem onClick={() => { setActionUser(user); setActionType('activate'); setActionDialogOpen(true) }}>
                                      Activate User
                                    </DropdownMenuItem>
                                  ) : null}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No users found</p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {data && data.totalPages > 0 && (
            <div className="flex items-center justify-between p-4 border-t bg-gray-50/30">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Showing {(data.currentPage - 1) * limit + 1}-{Math.min(data.currentPage * limit, data.total)} of {data.total}
                </span>
                <Select value={String(limit)} onValueChange={(value) => { setLimit(Number(value)); setPage(1) }}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.currentPage === 1}
                  onClick={() => setPage(1)}
                  className="cursor-pointer"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.currentPage === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="cursor-pointer"
                >
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {data.currentPage} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.currentPage === data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="cursor-pointer"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.currentPage === data.totalPages}
                  onClick={() => setPage(data.totalPages)}
                  className="cursor-pointer"
                >
                  Last
                </Button>
                <Select value={String(page)} onValueChange={(value) => setPage(Number(value))}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: data.totalPages }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            {selectedUser && (
              <>
                <DialogHeader className="pb-6">
                  <DialogTitle className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-blue-50">
                      {selectedUser.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-gray-900 truncate">{selectedUser.name}</h2>
                      <p className="text-base text-gray-600 mt-1">{selectedUser.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge className={`${getRoleBadgeColor(selectedUser.role)} text-white font-medium px-3 py-1`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {getRoleLabel(selectedUser.role)}
                        </Badge>
                        <Badge className={`${STATUS_COLORS[selectedUser.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'} font-medium px-3 py-1`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {selectedUser.status || 'active'}
                        </Badge>
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto max-h-96">
                  {/* Key Information Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building className="h-4 w-4 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-blue-900">Department</h3>
                      </div>
                      <p className="text-blue-800 text-lg font-medium">{selectedUser.department}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Mail className="h-4 w-4 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-green-900">Contact</h3>
                      </div>
                      <p className="text-green-800 text-sm break-all">{selectedUser.email}</p>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-gray-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Account Information</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Member since</span>
                        <span className="text-gray-900 font-semibold">
                          {formatDistanceToNow(new Date(selectedUser.createdAt || ''), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-gray-600 font-medium">User ID</span>
                        <code className="text-gray-900 bg-gray-100 px-2 py-1 rounded text-sm">
                          {selectedUser._id || selectedUser.id}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Departments & Access Profiles */}
                <div className="border-t pt-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Departments & Access Profiles</h2>
                  {selectedUser.profiles && selectedUser.profiles.length > 0 ? (
                    <div className="space-y-4">
                      {selectedUser.profiles.map((profile, index) => (
                        <div key={profile._id || index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span className="font-medium">{profile.department}</span>
                              {profile.isPrimary && (
                                <span className="ml-2 px-1.5 px-2.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {profile.confidentialityLevels && profile.confidentialityLevels.length > 0 ? (
                              <>
                                <p className="text-sm font-medium text-gray-700">Confidentiality Levels:</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {profile.confidentialityLevels.map((level, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium"
                                      style={{
                                        backgroundColor: {
                                          public: '#10b981',
                                          internal: '#3b82f6',
                                          confidential: '#f59e0b',
                                          highly_confidential: '#ef4444'
                                        }[level] + '20',
                                        color: {
                                          public: '#065f46',
                                          internal: '#1e40af',
                                          confidential: '#92400e',
                                          highly_confidential: '#991b1b'
                                        }[level],
                                        border: `1px solid ${{
                                          public: '#10b981',
                                          internal: '#3b82f6',
                                          confidential: '#f59e0b',
                                          highly_confidential: '#ef4444'
                                        }[level]}`
                                      }}>
                                      {level.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">No specific confidentiality levels assigned for this department.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      <p>No department profiles found. Falling back to legacy department field.</p>
                      <p className="mt-2">
                        <Building className="h-4 w-4 mr-2" />
                        <span className="font-medium">{selectedUser.department}</span>
                      </p>
                      {(() => {
                        if (!selectedUser) return null
                        const lvl = getUserHighestClearanceLevel(selectedUser)
                        if (!lvl) return null
                        const bg = {
                          public: '#10b981',
                          internal: '#3b82f6',
                          confidential: '#f59e0b',
                          highly_confidential: '#ef4444'
                        }[lvl]
                        const color = {
                          public: '#065f46',
                          internal: '#1e40af',
                          confidential: '#92400e',
                          highly_confidential: '#991b1b'
                        }[lvl]

                        return (
                          <p className="mt-2">
                            <span className="font-medium">Confidentiality Level:</span>{' '}
                            <span
                              className="ml-2"
                              style={{
                                backgroundColor: bg + '20',
                                color: color,
                                border: `1px solid ${bg}`
                              }}
                            >
                              {lvl.replace(/_/g, ' ')}
                            </span>
                          </p>
                        )
                      })()}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <DialogFooter className="flex gap-3 pt-6 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => handleViewActivity(selectedUser!)}
                    className="flex-1 cursor-pointer"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Activity
                  </Button>
                  <Button
                    onClick={() => handleEditUser(selectedUser!)}
                    className="flex-1 cursor-pointer bg-blue-600 hover:bg-blue-700"
                  >
                    Edit User
                  </Button>
                  {isManager ? (
                    selectedUser.status === 'active' ? (
                      <Button
                        variant="outline"
                        className="cursor-pointer text-orange-600"
                        onClick={() => { setActionUser(selectedUser); setActionType('request-suspend'); setActionDialogOpen(true); setSelectedUser(null) }}
                      >
                        Request Suspend
                      </Button>
                    ) : null
                  ) : (
                    selectedUser.status === 'active' ? (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          suspend((selectedUser._id || selectedUser.id)!)
                          setSelectedUser(null)
                        }}
                        className="cursor-pointer"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          activate((selectedUser._id || selectedUser.id)!)
                          setSelectedUser(null)
                        }}
                        className="cursor-pointer bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                    )
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <UserFormDialog
          mode="edit"
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) setEditingUser(null)
          }}
          user={editingUser}
        />

        <UserFormDialog mode="create" open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />


        {/* Activity Dialog */}
        <Dialog open={isActivityDialogOpen} onOpenChange={(open) => {
          setIsActivityDialogOpen(open)
          if (!open) setActivityUser(null)
        }}>
          <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-4 text-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
                  {activityUser?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p>{activityUser?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getRoleBadgeColor(activityUser?.role) || 'bg-gray-100'}>
                      {getRoleLabel(activityUser?.role)}
                    </Badge>
                    <Badge className={STATUS_COLORS[activityUser?.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                      {activityUser?.status || 'active'}
                    </Badge>
                    {(() => {
                      const lvl = activityUser ? getUserHighestClearanceLevel(activityUser) : ''
                      return lvl ? (
                        <Badge
                          className="text-xs"
                          style={{
                            backgroundColor: {
                              public: '#10b981',
                              internal: '#3b82f6',
                              confidential: '#f59e0b',
                              highly_confidential: '#ef4444'
                            }[lvl] + '20',
                            color: {
                              public: '#065f46',
                              internal: '#1e40af',
                              confidential: '#92400e',
                              highly_confidential: '#991b1b'
                            }[lvl],
                            border: `1px solid ${{
                              public: '#10b981',
                              internal: '#3b82f6',
                              confidential: '#f59e0b',
                              highly_confidential: '#ef4444'
                            }[lvl]}`
                          }}
                        >
                          {lvl.replace(/_/g, ' ')}
                        </Badge>
                      ) : null
                    })()}
                  </div>
                  <p className="text-sm text-muted-foreground font-normal mt-1">Activity Log</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="pt-4">
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <SkeletonLoader type="circle" className="h-8 w-8" />
                      <div className="flex-1">
                        <SkeletonLoader type="text" className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activityData?.logs && activityData.logs.length > 0 ? (
                <div className="space-y-3">
                  {activityData.logs.map((log) => (
                    <div key={log._id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className={cn(
                        'p-2 rounded-lg',
                        log.action === 'login' ? 'bg-purple-100' :
                          log.action === 'logout' ? 'bg-orange-100' :
                            log.action === 'upload' ? 'bg-green-100' :
                              log.action === 'download' ? 'bg-blue-100' :
                                log.action === 'delete' ? 'bg-red-100' : 'bg-gray-100'
                      )}>
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</p>
                          <Badge variant="outline" className="text-xs capitalize">{log.resource}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.ipAddress} {log.location?.country && `â€¢ ${log.location.city}, ${log.location.country}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No activity found</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPwOpen} onOpenChange={(open) => {
          setIsResetPwOpen(open)
          if (!open) { setResetPwUser(null); setNewPassword('') }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter a new password for {resetPwUser?.name}
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
                  <Button type="button" variant="outline" onClick={() => setIsResetPwOpen(false)} className="flex-1 cursor-pointer">
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* User Action Dialog (Suspend/Activate/Restore/Delete) */}
        <Dialog open={actionDialogOpen} onOpenChange={(open) => {
          setActionDialogOpen(open)
          if (!open) setActionUser(null)
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="capitalize">
                {actionType === 'suspend' && 'Suspend User'}
                {actionType === 'activate' && 'Activate User'}
                {actionType === 'restore' && 'Restore User'}
                {actionType === 'delete' && 'Delete User'}
                {actionType === 'request-suspend' && 'Request Suspend'}
                {actionType === 'request-password-reset' && 'Request Password Reset'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'suspend' && `Are you sure you want to suspend ${actionUser?.name}? They will not be able to access the system.`}
                {actionType === 'activate' && `Are you sure you want to activate ${actionUser?.name}?`}
                {actionType === 'restore' && `Are you sure you want to restore ${actionUser?.name}?`}
                {actionType === 'delete' && `Are you sure you want to delete ${actionUser?.name}? This action cannot be undone.`}
                {actionType === 'request-suspend' && `Send a request to the administrator to suspend ${actionUser?.name}?`}
                {actionType === 'request-password-reset' && `Send a request to the administrator to reset the password for ${actionUser?.name}?`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button
                className="flex-1 cursor-pointer"
                variant={actionType === 'delete' ? 'destructive' : actionType === 'suspend' ? 'outline' : 'default'}
                onClick={handleUserAction}
              >
                {actionType === 'suspend' && 'Suspend'}
                {actionType === 'activate' && 'Activate'}
                {actionType === 'restore' && 'Restore'}
                {actionType === 'delete' && 'Delete'}
                {actionType === 'request-suspend' && 'Send Request'}
                {actionType === 'request-password-reset' && 'Send Request'}
              </Button>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)} className="flex-1 cursor-pointer">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsiveContainer>
  )
}

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfidentialityLevelSelect } from '@/components/ui/ConfidentialityLevelSelect'
import { ScannerAgentSetupPrompt } from '@/components/tutorial/ScannerAgentSetupPrompt'
import { useAuth } from '@/hooks/useAuth'
import { useAgentStatusQuery } from '@/hooks/useAgent'
import { TableSkeleton } from '@/components/loaders/TableSkeleton'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { useUsersQuery, useSuspendUserMutation, useActivateUserMutation, useUpdateUserMutation, useResetPasswordMutation, useRestoreUserMutation, useDeleteUserMutation } from '@/hooks/useUsers'
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
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Plus, Grid3X3, List, Search, Mail, Building, Calendar, MoreVertical, User, Shield, Clock, MapPin, Activity, Lock, CheckCircle, Eye, AlertCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'

type ViewMode = 'grid' | 'table'

interface UserType {
  _id?: string
  id?: string
  name: string
  email: string
  role: string
  department: string
  status: string
  confidentialityLevel?: string
  createdAt?: string
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  deleted: 'bg-red-100 text-red-800',
}

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-800',
  hod: 'bg-blue-100 text-blue-800',
  user: 'bg-gray-100 text-gray-800',
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [editingConfidentialityLevel, setEditingConfidentialityLevel] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [activityUser, setActivityUser] = useState<UserType | null>(null)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  const [isSetupPromptOpen, setIsSetupPromptOpen] = useState(false)

  // Password reset
  const [resetPwUser, setResetPwUser] = useState<UserType | null>(null)
  const [isResetPwOpen, setIsResetPwOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  // User action (suspend/activate/restore/delete)
  const [actionUser, setActionUser] = useState<UserType | null>(null)
  const [actionType, setActionType] = useState<string>('')
  const [actionDialogOpen, setActionDialogOpen] = useState(false)

  const { user } = useAuth()
  const router = useRouter()
  const { data: agentStatus } = useAgentStatusQuery()

  const { data, isLoading } = useUsersQuery({
    page,
    limit,
    search: search || undefined,
    role: roleFilter || undefined,
  })

  const { mutate: suspend } = useSuspendUserMutation()
  const { mutate: activate } = useActivateUserMutation()
  const { mutate: updateUser } = useUpdateUserMutation()
  const { mutate: resetPassword } = useResetPasswordMutation()
  const { mutate: restore } = useRestoreUserMutation()
  const { mutate: deleteUser } = useDeleteUserMutation()

  const { data: activityData, isLoading: activityLoading } = useAuditLogsQuery({
    page: 1,
    limit: 20,
    userId: activityUser?._id || activityUser?.id,
  })

  // Check scanner agent status and show setup prompt if not connected
  React.useEffect(() => {
    if (agentStatus && !agentStatus.connected) {
      setIsSetupPromptOpen(true)
    }
  }, [agentStatus])

  const handleEditUser = (user: UserType) => {
    setEditingUser(user)
    setEditingConfidentialityLevel(user.confidentialityLevel || '')
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
              <Link href="/dashboard/admin/create-user">
                <Button size="lg" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </Link>
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
                        <Badge className={ROLE_COLORS[user.role as keyof typeof ROLE_COLORS]}>
                          {user.role}
                        </Badge>
                        <Badge className={STATUS_COLORS[user.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                          {user.status || 'active'}
                        </Badge>
                        {user.confidentialityLevel && (
                          <Badge
                            className="text-xs"
                            style={{
                              backgroundColor: {
                                public: '#10b981',
                                internal: '#3b82f6',
                                confidential: '#f59e0b',
                                highly_confidential: '#ef4444'
                              }[user.confidentialityLevel] + '20',
                              color: {
                                public: '#065f46',
                                internal: '#1e40af',
                                confidential: '#92400e',
                                highly_confidential: '#991b1b'
                              }[user.confidentialityLevel],
                              border: `1px solid ${{
                                public: '#10b981',
                                internal: '#3b82f6',
                                confidential: '#f59e0b',
                                highly_confidential: '#ef4444'
                              }[user.confidentialityLevel]
                                }`
                            }}
                          >
                            {user.confidentialityLevel.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3" />
                          <span className="truncate">{user.department}</span>
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditUser(user); setOpenDropdown(null) }}>Edit User</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setResetPwUser(user); setIsResetPwOpen(true); setOpenDropdown(null) }}>Reset Password</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewActivity(user); setOpenDropdown(null) }}>View Activity</DropdownMenuItem>
                            <DropdownMenuSeparator />
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
                            {user.status === 'deleted' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setActionUser(user); setActionType('activate'); setActionDialogOpen(true); setOpenDropdown(null) }}>
                                Activate User
                              </DropdownMenuItem>
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
                          <Badge className={ROLE_COLORS[user.role as keyof typeof ROLE_COLORS]}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[user.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                            {user.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.confidentialityLevel ? (
                            <Badge
                              className="text-xs"
                              style={{
                                backgroundColor: {
                                  public: '#10b981',
                                  internal: '#3b82f6',
                                  confidential: '#f59e0b',
                                  highly_confidential: '#ef4444'
                                }[user.confidentialityLevel] + '20',
                                color: {
                                  public: '#065f46',
                                  internal: '#1e40af',
                                  confidential: '#92400e',
                                  highly_confidential: '#991b1b'
                                }[user.confidentialityLevel],
                                border: `1px solid ${{
                                  public: '#10b981',
                                  internal: '#3b82f6',
                                  confidential: '#f59e0b',
                                  highly_confidential: '#ef4444'
                                }[user.confidentialityLevel]
                                  }`
                              }}
                            >
                              {user.confidentialityLevel.replace(/_/g, ' ')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
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
                              <DropdownMenuItem onClick={() => { setResetPwUser(user); setIsResetPwOpen(true) }}>Reset Password</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewActivity(user)}>View Activity</DropdownMenuItem>
                              <DropdownMenuSeparator />
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
                              {user.status !== 'active' && user.status !== 'deleted' && user.status !== 'suspended' ? (
                                <DropdownMenuItem
                                  className="text-orange-600"
                                  onClick={() => { setActionUser(user); setActionType('suspend'); setActionDialogOpen(true) }}
                                >
                                  Suspend User
                                </DropdownMenuItem>
                              ) : null}
                              {user.status === 'deleted' && (
                                <DropdownMenuItem onClick={() => { setActionUser(user); setActionType('activate'); setActionDialogOpen(true) }}>
                                  Activate User
                                </DropdownMenuItem>
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
                        <Badge className={`${ROLE_COLORS[selectedUser.role as keyof typeof ROLE_COLORS]} text-white font-medium px-3 py-1`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {selectedUser.role}
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
                  {selectedUser.status === 'active' ? (
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
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setEditingUser(null)
            setEditingConfidentialityLevel('')
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="pb-6">
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                Edit User
              </DialogTitle>
              <DialogDescription className="text-base">
                Update user information and permissions
              </DialogDescription>
            </DialogHeader>

            {editingUser && (
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                updateUser({
                  userId: editingUser._id || editingUser.id!,
                  data: {
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    department: formData.get('department') as string,
                    role: formData.get('role') as string,
                    confidentialityLevel: editingConfidentialityLevel,
                  }
                })
                setIsEditDialogOpen(false)
                setEditingUser(null)
                setEditingConfidentialityLevel('')
              }}>
                <div className="space-y-6">
                  {/* User Avatar and Name */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {editingUser.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{editingUser.name}</p>
                      <p className="text-sm text-gray-600">{editingUser.email}</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </label>
                      <Input
                        name="name"
                        defaultValue={editingUser.name}
                        required
                        className="h-11"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </label>
                      <Input
                        name="email"
                        type="email"
                        defaultValue={editingUser.email}
                        required
                        className="h-11"
                        placeholder="Enter email address"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Department
                      </label>
                      <Input
                        name="department"
                        defaultValue={editingUser.department}
                        required
                        className="h-11"
                        placeholder="Enter department"
                      />
                    </div>

                    <div className='flex items-start gap-6 w-full'>
                      <div className="space-y-2 w-full">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Role
                        </label>
                        <Select name="role" defaultValue={editingUser.role}>
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                User
                              </div>
                            </SelectItem>
                            <SelectItem value="hod">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                Head of Department
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                Administrator
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Confidentiality Level
                        </label>
                        <ConfidentialityLevelSelect
                          value={editingConfidentialityLevel}
                          onValueChange={setEditingConfidentialityLevel}
                          userRole={user?.role}
                          placeholder="Select confidentiality level"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="flex-1 cursor-pointer bg-gray-100 hover:bg-red-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 cursor-pointer bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

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
                    <Badge className={ROLE_COLORS[activityUser?.role as keyof typeof ROLE_COLORS] || 'bg-gray-100'}>
                      {activityUser?.role}
                    </Badge>
                    <Badge className={STATUS_COLORS[activityUser?.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                      {activityUser?.status || 'active'}
                    </Badge>
                    {activityUser?.confidentialityLevel && (
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: {
                            public: '#10b981',
                            internal: '#3b82f6',
                            confidential: '#f59e0b',
                            highly_confidential: '#ef4444'
                          }[activityUser.confidentialityLevel] + '20',
                          color: {
                            public: '#065f46',
                            internal: '#1e40af',
                            confidential: '#92400e',
                            highly_confidential: '#991b1b'
                          }[activityUser.confidentialityLevel],
                          border: `1px solid ${{
                            public: '#10b981',
                            internal: '#3b82f6',
                            confidential: '#f59e0b',
                            highly_confidential: '#ef4444'
                          }[activityUser.confidentialityLevel]
                            }`
                        }}
                      >
                        {activityUser.confidentialityLevel.replace(/_/g, ' ')}
                      </Badge>
                    )}
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
                          {log.ipAddress} {log.location?.country && `• ${log.location.city}, ${log.location.country}`}
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
              </DialogTitle>
              <DialogDescription>
                {actionType === 'suspend' && `Are you sure you want to suspend ${actionUser?.name}? They will not be able to access the system.`}
                {actionType === 'activate' && `Are you sure you want to activate ${actionUser?.name}?`}
                {actionType === 'restore' && `Are you sure you want to restore ${actionUser?.name}?`}
                {actionType === 'delete' && `Are you sure you want to delete ${actionUser?.name}? This action cannot be undone.`}
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
              </Button>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)} className="flex-1 cursor-pointer">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Scanner Agent Setup Prompt */}
        <ScannerAgentSetupPrompt
          isOpen={isSetupPromptOpen}
          onComplete={() => {
            setIsSetupPromptOpen(false)
            router.push('/dashboard')
          }}
          onSkip={() => setIsSetupPromptOpen(false)}
        />
      </div>
    </ResponsiveContainer>
  )
}

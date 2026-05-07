'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { useAuditLogsQuery, useAuditActionsQuery, useExportAuditLogsMutation, useAuditLogStatsQuery } from '@/hooks/useAuditLog'
import type { AuditLog } from '@/services/api/audit'
import {
  Activity, Search, Download, ChevronLeft, ChevronRight,
  Eye, CalendarIcon, Monitor, Globe, User, FileText, LogIn, LogOut,
  Upload, Trash2, Share2, Edit, AlertCircle, LayoutList, Clock, Filter,
  X, Users, TrendingUp, Zap, Copy, Check
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format, isToday, isYesterday } from 'date-fns'
import { cn } from '@/lib/utils'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'

type ViewMode = 'table' | 'timeline'

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login: <LogIn className="h-4 w-4 text-purple-600" />,
  logout: <LogOut className="h-4 w-4 text-orange-600" />,
  upload: <Upload className="h-4 w-4 text-green-600" />,
  download: <Download className="h-4 w-4 text-blue-600" />,
  delete: <Trash2 className="h-4 w-4 text-red-600" />,
  soft_delete: <Trash2 className="h-4 w-4 text-red-500" />,
  restore: <Activity className="h-4 w-4 text-emerald-600" />,
  permission_grant: <Share2 className="h-4 w-4 text-green-600" />,
  permission_revoke: <Share2 className="h-4 w-4 text-red-600" />,
  user_create: <User className="h-4 w-4 text-blue-600" />,
  user_update: <Edit className="h-4 w-4 text-amber-600" />,
  user_suspend: <AlertCircle className="h-4 w-4 text-red-600" />,
  user_restore: <User className="h-4 w-4 text-green-600" />,
  file_share: <Share2 className="h-4 w-4 text-blue-600" />,
  file_update: <Edit className="h-4 w-4 text-amber-600" />,
  version_create: <FileText className="h-4 w-4 text-indigo-600" />,
  rollback: <Activity className="h-4 w-4 text-purple-600" />,
  profile_update: <User className="h-4 w-4 text-blue-600" />,
  password_change: <Edit className="h-4 w-4 text-amber-600" />,
  failed_login: <AlertCircle className="h-4 w-4 text-red-600" />,
  session_expired: <AlertCircle className="h-4 w-4 text-gray-600" />,
  default: <Activity className="h-4 w-4 text-gray-600" />,
}

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-orange-100 text-orange-700',
  upload: 'bg-green-100 text-green-700',
  download: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  soft_delete: 'bg-red-50 text-red-600',
  restore: 'bg-emerald-100 text-emerald-700',
  permission_grant: 'bg-green-100 text-green-700',
  permission_revoke: 'bg-red-100 text-red-700',
  user_create: 'bg-blue-100 text-blue-700',
  user_update: 'bg-amber-100 text-amber-700',
  user_suspend: 'bg-red-100 text-red-700',
  user_restore: 'bg-green-100 text-green-700',
  file_share: 'bg-blue-100 text-blue-700',
  file_update: 'bg-amber-100 text-amber-700',
  version_create: 'bg-indigo-100 text-indigo-700',
  rollback: 'bg-purple-100 text-purple-700',
  profile_update: 'bg-blue-100 text-blue-700',
  password_change: 'bg-amber-100 text-amber-700',
  failed_login: 'bg-red-100 text-red-700',
  session_expired: 'bg-gray-100 text-gray-700',
  default: 'bg-gray-100 text-gray-700',
}

const POPULAR_ACTIONS = ['login', 'logout', 'upload', 'download', 'delete', 'file_share', 'permission_grant']

const getHumanReadableActivity = (log: AuditLog): string => {
  const userName = log.userId?.name || log.userEmail.split('@')[0]
  const machineName = log.machine?.machineName || 'Unknown Device'

  switch (log.action) {
    case 'login':
      return `${userName} logged in using ${machineName}`
    case 'logout':
      return `${userName} logged out from ${machineName}`
    case 'upload':
      return `${userName} uploaded ${log.resource} from ${machineName}`
    case 'download':
      return `${userName} downloaded ${log.resource} using ${machineName}`
    case 'delete':
      return `${userName} deleted ${log.resource} from ${machineName}`
    case 'soft_delete':
      return `${userName} moved ${log.resource} to trash using ${machineName}`
    case 'restore':
      return `${userName} restored ${log.resource} from ${machineName}`
    case 'permission_grant':
      return `${userName} granted access to ${log.resource} using ${machineName}`
    case 'permission_revoke':
      return `${userName} revoked access to ${log.resource} from ${machineName}`
    case 'user_create':
      return `${userName} created user account using ${machineName}`
    case 'user_update':
      return `${userName} updated user profile using ${machineName}`
    case 'user_suspend':
      return `${userName} suspended user account using ${machineName}`
    case 'user_restore':
      return `${userName} restored user account using ${machineName}`
    case 'file_share':
      return `${userName} shared ${log.resource} using ${machineName}`
    case 'file_update':
      return `${userName} updated ${log.resource} from ${machineName}`
    case 'version_create':
      return `${userName} created new version of ${log.resource} using ${machineName}`
    case 'rollback':
      return `${userName} rolled back ${log.resource} to previous version using ${machineName}`
    case 'profile_update':
      return `${userName} updated profile using ${machineName}`
    case 'password_change':
      return `${userName} changed password using ${machineName}`
    case 'failed_login':
      return `${userName} failed login attempt using ${machineName}`
    case 'session_expired':
      return `${userName} session expired on ${machineName}`
    default:
      return `${userName} performed ${log.action.replace(/_/g, ' ')} on ${log.resource} using ${machineName}`
  }
}

export default function AuditLogPage() {
  const router = useRouter()
  const { canAccess } = useAuth()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [machineFilter, setMachineFilter] = useState<string>('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { data: actionsData } = useAuditActionsQuery()
  const exportMutation = useExportAuditLogsMutation()
  const { data: statsData, isLoading: statsLoading } = useAuditLogStatsQuery(30)

  const { data, isLoading } = useAuditLogsQuery({
    page,
    limit,
    action: actionFilter || undefined,
    fromDate: dateFrom || undefined,
    toDate: dateTo || undefined,
    search: search || undefined,
    machineId: machineFilter || undefined,
  })

  const filteredData = useMemo(() => {
    if (!data?.logs) return []
    if (!search) return data.logs
    return data.logs.filter(log =>
      log.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])

  const logsByDate = useMemo(() => {
    const grouped: Record<string, AuditLog[]> = {}
    filteredData.forEach(log => {
      const date = format(new Date(log.timestamp), 'yyyy-MM-dd')
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(log)
    })
    return grouped
  }, [filteredData])

  const groupedDates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a))

  const getActionIcon = (action: string) => ACTION_ICONS[action] || ACTION_ICONS.default
  const getActionColor = (action: string) => ACTION_COLORS[action] || ACTION_COLORS.default

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMMM d, yyyy')
  }

  const clearFilters = () => {
    setSearch('')
    setActionFilter('')
    setDateFrom('')
    setDateTo('')
    setMachineFilter('')
  }

  const hasActiveFilters = search || actionFilter || dateFrom || dateTo || machineFilter

  const handleExport = (format: 'csv' | 'json') => {
    exportMutation.mutate({
      fromDate: dateFrom || undefined,
      toDate: dateTo || undefined,
      format
    })
    setShowExportMenu(false)
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  if (!canAccess(['admin'])) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 mt-2">You do not have permission to view audit logs.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4 cursor-pointer">
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer>
      <div className="flex-1 p-8 bg-gray-50/50 overflow-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Track all system activities and user actions</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border shadow-sm">
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('timeline')}
            className={cn("cursor-pointer", viewMode === 'timeline' ? 'bg-gray-100 text-gray-600' : '')}
          >
            <Clock className="h-4 w-4 mr-1" />
            Timeline
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={cn("cursor-pointer", viewMode === 'table' ? 'bg-gray-100 text-gray-600' : '')}
          >
            <LayoutList className="h-4 w-4 mr-1" />
            Table
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total (30d)</p>
                {statsLoading ? <SkeletonLoader type="text" className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-gray-900">
                    {statsData?.dailyStats?.reduce((sum: number, d: { count: number }) => sum + d.count, 0) || 0}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Today's</p>
                {statsLoading ? <SkeletonLoader type="text" className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-gray-900">
                    {statsData?.dailyStats?.find(d => d._id === format(new Date(), 'yyyy-MM-dd'))?.count || 0}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Action Types</p>
                {statsLoading ? <SkeletonLoader type="text" className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-gray-900">
                    {statsData?.actionStats?.length || 0}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Top Action</p>
                {statsLoading ? <SkeletonLoader type="text" className="h-8 w-16" /> : (
                  <p className="text-xl font-bold text-gray-900 truncate max-w-full">
                    {statsData?.actionStats?.[0]?._id?.replace(/_/g, ' ') || '-'}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-amber-100">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-64">
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user, action, resource..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-40">
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Action Type</label>
              <Select value={actionFilter || 'all'} onValueChange={(value) => setActionFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {actionsData?.actions?.map((action) => (
                    <SelectItem key={action} value={action}>{action.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Machine</label>
              <Input
                placeholder="Machine name or ID"
                value={machineFilter}
                onChange={(e) => setMachineFilter(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="w-36">
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left font-normal cursor-pointer",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateFrom ? format(new Date(dateFrom), 'MMM d') : "Any"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom ? new Date(dateFrom) : undefined}
                    onSelect={(date) => setDateFrom(date ? format(date, 'yyyy-MM-dd') : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-36">
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left font-normal cursor-pointer",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateTo ? format(new Date(dateTo), 'MMM d') : "Any"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo ? new Date(dateTo) : undefined}
                    onSelect={(date) => setDateTo(date ? format(date, 'yyyy-MM-dd') : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="relative">
              <Button
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="cursor-pointer bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border p-2 z-50 min-w-28">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start cursor-pointer"
                    onClick={() => handleExport('csv')}
                  >
                    CSV
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start cursor-pointer"
                    onClick={() => handleExport('json')}
                  >
                    JSON
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-xs text-gray-500 mr-2">Quick filters:</span>
            {POPULAR_ACTIONS.slice(0, 5).map((action) => (
              <Button
                key={action}
                variant={actionFilter === action ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActionFilter(actionFilter === action ? '' : action)}
                className={cn(
                  "cursor-pointer text-xs h-6 px-2",
                  actionFilter === action ? getActionColor(action) + ' border-0' : ''
                )}
              >
                {action.replace(/_/g, ' ')}
              </Button>
            ))}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="cursor-pointer text-xs h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
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
          ) : filteredData && filteredData.length > 0 ? (
            viewMode === 'timeline' ? (
              /* Timeline View */
              <div className="divide-y divide-gray-100">
                {groupedDates.map((dateStr) => (
                  <div key={dateStr} className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="px-2 py-1 rounded-md bg-gray-100 text-xs font-semibold text-gray-600">
                        {getDateLabel(dateStr)}
                      </div>
                      <span className="text-xs text-gray-400">
                        {logsByDate[dateStr].length} event{logsByDate[dateStr].length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {logsByDate[dateStr].map((log, idx) => (
                        <div
                          key={log._id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                          onClick={() => setSelectedLog(log)}
                        >
                          <div className={cn('p-2 rounded-lg shrink-0', getActionColor(log.action))}>
                            {getActionIcon(log.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-900">
                                {log.userId?.name || log.userEmail}
                              </p>
                              <span className="text-xs text-gray-400">
                                {format(new Date(log.timestamp), 'h:mm a')}
                              </span>
                            </div>
                             <p className="text-xs text-gray-600 mt-0.5">
                               {getHumanReadableActivity(log)}
                             </p>
                            {log.location?.country && (
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {log.location.city}, {log.location.country}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Table View */
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                   <TableHead className="font-semibold">User</TableHead>
                   <TableHead className="font-semibold">Action</TableHead>
                   <TableHead className="font-semibold">Resource</TableHead>
                   <TableHead className="font-semibold">Machine</TableHead>
                   <TableHead className="font-semibold">Location</TableHead>
                   <TableHead className="font-semibold">Time</TableHead>
                   <TableHead className="font-semibold w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((log, index) => (
                    <TableRow
                      key={log._id}
                      className="hover:bg-blue-50/50 cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                            {log.userId?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{log.userId?.name || log.userEmail}</p>
                            <p className="text-xs text-gray-500">{log.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium', getActionColor(log.action))}>
                          <div className=''></div>
                          {getActionIcon(log.action)}
                          <span>{log.action.replace(/_/g, ' ')}</span>
                        </div>
                      </TableCell>
                       <TableCell>
                         <span className="text-sm text-gray-700">{log.resource}</span>
                       </TableCell>
                       <TableCell>
                         <div className="text-sm text-gray-700 font-medium">
                           {log.machine?.machineName || 'Unknown'}
                         </div>
                         <p className="text-xs text-gray-400">{log.machine?.hostname}</p>
                       </TableCell>
                       <TableCell>
                         <div className="text-sm text-gray-500">
                           {log.ipAddress}
                         </div>
                         {log.location?.country && (
                           <p className="text-xs text-gray-400">{log.location.city}, {log.location.country}</p>
                         )}
                       </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-500">
                          {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="cursor-pointer h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No audit logs found</p>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="mt-2 cursor-pointer">
                  Clear filters
                </Button>
              )}
            </div>
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
                  <ChevronLeft className="h-4 w-4" />
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
                  <ChevronRight className="h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl w-full max-h-[95vh] overflow-y-auto">
          {selectedLog && (
            <>
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className={cn('p-2 rounded-lg', getActionColor(selectedLog.action))}>
                    {getActionIcon(selectedLog.action)}
                  </div>
                  <span className="capitalize">{selectedLog.action.replace(/_/g, ' ')}</span>
                </DialogTitle>
              </DialogHeader>

               <div className="space-y-6 pt-4">
                 {/* User Information */}
                 <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                   <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                     <User className="h-4 w-4" />
                     User Information
                   </h3>
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-semibold">
                       {selectedLog.userId?.name?.charAt(0).toUpperCase() || 'U'}
                     </div>
                     <div className="flex-1">
                       <p className="font-semibold text-lg text-gray-900">{selectedLog.userId?.name || 'Unknown User'}</p>
                       <p className="text-sm text-gray-600">{selectedLog.userEmail}</p>
                       <p className="text-xs text-gray-500 mt-1">Role: {selectedLog.userId?.role || 'N/A'}</p>
                     </div>
                   </div>
                 </div>

                  {/* ACTIVITY INFORMATION */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Activity Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">User</p>
                        <p className="font-semibold text-sm">{selectedLog.userId?.name || selectedLog.userEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Action</p>
                        <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium', getActionColor(selectedLog.action))}>
                          {getActionIcon(selectedLog.action)}
                          <span>{selectedLog.action.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Resource</p>
                        <p className="font-semibold text-sm">{selectedLog.resource}</p>
                        {selectedLog.resourceId && (
                          <p className="text-xs text-gray-500 mt-1">Resource ID: {selectedLog.resourceId}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Result</p>
                        <p className="font-semibold text-sm text-green-600">Success</p>
                      </div>
                      {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Details</p>
                          <div className="bg-white p-2 rounded border text-xs">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.details, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DEVICE INFORMATION */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-100">
                    <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Device Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Machine Name</p>
                        <p className="font-semibold text-sm">{selectedLog.machine?.machineName || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Hostname</p>
                        <p className="font-semibold text-sm">{selectedLog.machine?.hostname || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Platform</p>
                        <p className="font-semibold text-sm">{selectedLog.machine?.platform || selectedLog.device?.platform || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Browser</p>
                        <p className="font-semibold text-sm">{selectedLog.machine?.browser || selectedLog.device?.browser} {selectedLog.machine?.browserVersion || selectedLog.device?.browserVersion}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Device Type</p>
                        <p className="font-semibold text-sm">{selectedLog.machine?.deviceType || selectedLog.device?.deviceType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">IP Address</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(selectedLog.ipAddress, 'ipAddress')}
                          >
                            {copiedField === 'ipAddress' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Location</p>
                        <p className="font-semibold text-sm">
                          {selectedLog.location?.city && selectedLog.location?.country
                            ? `${selectedLog.location.city}, ${selectedLog.location.country}`
                            : selectedLog.location?.country || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Source Channel</p>
                        <p className="font-semibold text-sm capitalize">{selectedLog.machine?.source || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Timestamp</p>
                        <p className="font-semibold text-sm">{format(new Date(selectedLog.timestamp), 'PPp')}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Machine ID</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs bg-white px-2 py-1 rounded border flex-1">{selectedLog.machine?.machineId || 'N/A'}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(selectedLog.machine?.machineId || '', 'machineId')}
                          >
                            {copiedField === 'machineId' ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                 {/* Scanner Information */}
                 {selectedLog.uploadSource && (
                   <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                     <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                       <FileText className="h-4 w-4" />
                       Scanner Information
                     </h3>
                     <div>
                       <p className="text-xs font-medium text-gray-600 mb-1">Upload Source</p>
                       <p className="font-semibold text-sm capitalize">{selectedLog.uploadSource}</p>
                     </div>
                   </div>
                 )}



                 {/* Additional Details */}
                 {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                   <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                     <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                       <AlertCircle className="h-4 w-4" />
                       Additional Details
                     </h3>
                     <div className="bg-white p-3 rounded-lg border">
                       <pre className="text-xs overflow-x-auto max-h-60 font-mono whitespace-pre-wrap">
                         {JSON.stringify(selectedLog.details, null, 2)}
                       </pre>
                     </div>
                   </div>
                 )}
               </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  </ResponsiveContainer>
)
}
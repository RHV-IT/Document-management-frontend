'use client'

import { Fragment, type ElementType, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/contexts/auth'
import { filesAPI, type FileItem } from '@/services/api/files'
import { usersAPI } from '@/services/api/users'
import { notificationsAPI, type Notification } from '@/services/api/notifications'
import { auditAPI, type AuditLog } from '@/services/api/audit'
import { dashboardAPI, type RecentActivity } from '@/services/api/dashboard'
import type { User as UserType } from '@/services/api/auth'
import { formatBytes } from '@/lib/utils'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Activity,
  Bell,
  ChevronRight,
  Command,
  FileText,
  Home,
  Loader2,
  Scan,
  Search,
  Settings,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import React from 'react'

type GlobalSearchCategory = 'file' | 'page' | 'user' | 'notification' | 'activity' | 'audit'

type GlobalSearchResult = {
  id: string
  category: GlobalSearchCategory
  title: string
  subtitle: string
  href: string
  score: number
}

type NavSearchItem = {
  label: string
  href: string
  icon: ElementType
  roles?: string[]
  description: string
}

const NAV_ITEMS: NavSearchItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home, roles: ['user', 'hod', 'admin'], description: 'Overview and recent activity' },
  { label: 'My Files', href: '/dashboard/files', icon: FileText, roles: ['user', 'hod', 'admin'], description: 'Manage and search documents' },
  { label: 'Upload', href: '/dashboard/upload', icon: Upload, roles: ['user', 'hod', 'admin'], description: 'Upload, bulk upload, or scan files' },
  { label: 'Scanner Guide', href: '/dashboard/scanner-user-guide', icon: Scan, roles: ['user', 'hod', 'admin'], description: 'Scanner setup instructions' },
  { label: 'Recycle Bin', href: '/dashboard/recycle-bin', icon: Trash2, roles: ['user', 'hod', 'admin'], description: 'Deleted files' },
  { label: 'Users', href: '/dashboard/admin/users', icon: Users, roles: ['admin', 'hod'], description: 'User administration' },
  { label: 'Audit Logs', href: '/dashboard/admin/audit-log', icon: Activity, roles: ['admin'], description: 'System audit trail' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'], description: 'System configuration' },
]

const CATEGORY_ORDER: Record<GlobalSearchCategory, number> = {
  file: 1,
  page: 2,
  user: 3,
  notification: 4,
  activity: 5,
  audit: 6,
}

const CATEGORY_LABEL: Record<GlobalSearchCategory, string> = {
  file: 'Files',
  page: 'Pages',
  user: 'Users',
  notification: 'Notifications',
  activity: 'Recent Activity',
  audit: 'Audit Logs',
}

const CATEGORY_ICON: Record<GlobalSearchCategory, ElementType> = {
  file: FileText,
  page: Home,
  user: Users,
  notification: Bell,
  activity: Activity,
  audit: Activity,
}

const normalize = (value = '') => value.toString().trim().toLowerCase()

const scoreMatch = (query: string, ...values: Array<string | undefined | null>) => {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return 10
  const haystack = normalize(values.filter(Boolean).join(' '))
  if (!haystack) return 10
  if (haystack === normalizedQuery) return 0
  if (haystack.startsWith(normalizedQuery)) return 1
  if (haystack.includes(normalizedQuery)) return 2
  return 10
}

const getId = (user?: UserType | null) => user?.id || user?._id || ''

const getUserName = (user?: { name?: string } | null) => user?.name || 'Unknown user'

const getDepartmentName = (department: unknown) => {
  if (!department) return 'No department'
  if (typeof department === 'string') return department
  return (department as { name?: string; _id?: string }).name || (department as { name?: string; _id?: string })._id || 'No department'
}

const getOwnerId = (file: FileItem) => file.owner?._id || file.uploadedBy?._id || ''

const getFileTab = (file: FileItem, userId: string) => {
  if (file.isScanned) return 'scanned'
  if (userId && getOwnerId(file) === userId) return 'myfiles'
  return 'received'
}

const getFileTabLabel = (tab: string) => {
  if (tab === 'scanned') return 'Scanned Files'
  if (tab === 'received') return 'Shared With Me'
  return 'My Files'
}

const getFileExtension = (file: FileItem) => {
  const name = file.name || ''
  const parts = name.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

const buildFileResult = (file: FileItem, query: string, userId: string): GlobalSearchResult => {
  const tab = getFileTab(file, userId)
  const owner = getUserName(file.owner || file.uploadedBy)
  const department = getDepartmentName(file.department)
  const extension = getFileExtension(file)
  const title = file.alias || file.name
  const subtitle = `${file.type || extension || 'File'} • ${formatBytes(file.size)} • ${owner} • ${department}`
  return {
    id: `file:${file.fileId}`,
    category: 'file',
    title,
    subtitle,
    href: `/dashboard/files?tab=${tab}&q=${encodeURIComponent(query)}&fileId=${encodeURIComponent(file.fileId)}`,
    score: scoreMatch(query, title, file.name, file.alias, file.tags?.join(' '), file.type, owner, department),
  }
}

const buildUserResult = (user: UserType, query: string): GlobalSearchResult => ({
  id: `user:${getId(user)}`,
  category: 'user',
  title: getUserName(user),
  subtitle: `${user.email || 'No email'} • ${user.role || 'No role'} • ${getDepartmentName(user.department)}`,
  href: `/dashboard/admin/users?search=${encodeURIComponent(getUserName(user))}`,
  score: scoreMatch(query, getUserName(user), user.email, user.role, getDepartmentName(user.department)),
})

const buildNotificationResult = (notification: Notification, query: string): GlobalSearchResult => ({
  id: `notification:${notification._id}`,
  category: 'notification',
  title: notification.message,
  subtitle: `${notification.isRead ? 'Read' : 'Unread'} • ${new Date(notification.createdAt).toLocaleString()}`,
  href: `/dashboard/notifications?notificationId=${encodeURIComponent(notification._id)}`,
  score: scoreMatch(query, notification.message, notification.type),
})

const buildActivityResult = (activity: RecentActivity, query: string): GlobalSearchResult => {
  const title = activity.resource || activity.action.replace(/_/g, ' ')
  const user = activity.user?.name || activity.user?.email || 'Unknown user'
  return {
    id: `activity:${activity.id || activity.resourceId || title}`,
    category: 'activity',
    title,
    subtitle: `${activity.action.replace(/_/g, ' ')} • ${user} • ${new Date(activity.timestamp).toLocaleString()}`,
    href: '/dashboard',
    score: scoreMatch(query, title, activity.action, user, activity.resourceId),
  }
}

const buildAuditResult = (log: AuditLog, query: string): GlobalSearchResult => {
  const title = log.resource || log.action.replace(/_/g, ' ')
  const user = log.userId?.name || log.userEmail || 'Unknown user'
  return {
    id: `audit:${log._id}`,
    category: 'audit',
    title,
    subtitle: `${log.action.replace(/_/g, ' ')} • ${user} • ${new Date(log.timestamp).toLocaleString()}`,
    href: `/dashboard/admin/audit-log?search=${encodeURIComponent(title)}`,
    score: scoreMatch(query, title, log.action, user, log.resourceId),
  }
}

const groupResults = (results: GlobalSearchResult[]) => {
  const groups = new Map<GlobalSearchCategory, GlobalSearchResult[]>()
  results.forEach((result) => {
    const group = groups.get(result.category) || []
    group.push(result)
    groups.set(result.category, group)
  })

  return Array.from(groups.entries())
    .sort(([a], [b]) => CATEGORY_ORDER[a] - CATEGORY_ORDER[b])
    .map(([category, items]) => ({
      category,
      label: CATEGORY_LABEL[category],
      Icon: CATEGORY_ICON[category],
      items: items
        .sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))
        .slice(0, 8),
    }))
}

export function GlobalSearch() {
  const router = useRouter()
  const { user, canAccess } = useAuthContext()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const normalizedQuery = normalize(query)
  const hasSearched = normalizedQuery.length > 0
  const userId = getId(user)

  const filesQuery = useQuery({
    queryKey: ['global-search', 'files', normalizedQuery],
    queryFn: () => filesAPI.getFiles({ page: 1, limit: 8, search: normalizedQuery || undefined }),
    select: (response) => response.data.files,
    enabled: hasSearched,
    retry: false,
    staleTime: 1000 * 60 * 2,
  })

  const usersQuery = useQuery({
    queryKey: ['global-search', 'users', normalizedQuery],
    queryFn: () => usersAPI.getUsers({ page: 1, limit: 8, search: normalizedQuery || undefined }),
    select: (response): UserType[] => response.data.users,
    enabled: hasSearched && canAccess(['admin', 'hod']),
    retry: false,
    staleTime: 1000 * 60 * 2,
  })

  const notificationsQuery = useQuery({
    queryKey: ['global-search', 'notifications', normalizedQuery],
    queryFn: () => notificationsAPI.getNotifications({ page: 1, limit: 8 }),
    select: (response) => response.data.notifications,
    enabled: hasSearched,
    retry: false,
    staleTime: 1000 * 30,
  })

  const activityQuery = useQuery({
    queryKey: ['global-search', 'activity', normalizedQuery],
    queryFn: () => dashboardAPI.getRecentActivity(),
    select: (response) => response.data,
    enabled: hasSearched,
    retry: false,
    staleTime: 1000 * 30,
  })

  const auditQuery = useQuery({
    queryKey: ['global-search', 'audit', normalizedQuery],
    queryFn: () => auditAPI.getLogs({ page: 1, limit: 8, search: normalizedQuery || undefined }),
    select: (response) => response.data.logs,
    enabled: hasSearched && canAccess(['admin']),
    retry: false,
    staleTime: 1000 * 30,
  })

  const isFetching = [filesQuery, usersQuery, notificationsQuery, activityQuery, auditQuery].some((item) => item.isFetching)

  const results = useMemo(() => {
    if (!hasSearched) return []

    const navResults: GlobalSearchResult[] = NAV_ITEMS
      .filter((item) => !item.roles || canAccess(item.roles))
      .map((item) => ({
        id: `page:${item.href}`,
        category: 'page' as const,
        title: item.label,
        subtitle: item.description,
        href: item.href,
        score: scoreMatch(normalizedQuery, item.label, item.description),
      }))

    const fileResults = (filesQuery.data || []).map((file) => buildFileResult(file, normalizedQuery, userId))
    const userResults = (usersQuery.data || []).map((userItem) => buildUserResult(userItem, normalizedQuery))
    const notificationResults = (notificationsQuery.data || []).map((notification) => buildNotificationResult(notification, normalizedQuery))
    const activityResults = (activityQuery.data || []).map((activity) => buildActivityResult(activity, normalizedQuery))
    const auditResults = (auditQuery.data || []).map((log) => buildAuditResult(log, normalizedQuery))

    return [
      ...fileResults,
      ...navResults,
      ...userResults,
      ...notificationResults,
      ...activityResults,
      ...auditResults,
    ]
      .filter((result) => result.score < 10)
      .sort((a, b) => a.score - b.score || CATEGORY_ORDER[a.category as GlobalSearchCategory] - CATEGORY_ORDER[b.category as GlobalSearchCategory] || a.title.localeCompare(b.title))
  }, [
    activityQuery.data,
    auditQuery.data,
    canAccess,
    filesQuery.data,
    hasSearched,
    normalizedQuery,
    notificationsQuery.data,
    userId,
    usersQuery.data,
  ])

  const groupedResults = useMemo(() => groupResults(results), [results])

  const selectResult = (result: GlobalSearchResult) => {
    setOpen(false)
    router.push(result.href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="relative group w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Global search..."
          className="h-10 w-full rounded-md border border-gray-200/70 bg-gray-50/70 pl-10 pr-10 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>

      <Command className="max-h-[min(70vh,680px)]">
        <CommandInput
          value={query}
          onValueChange={(value) => {
            setQuery(value)
            setOpen(true)
          }}
          placeholder="Search files, users, notifications, logs, or pages..."
        />
        <CommandList className="max-h-[560px]">
          {!hasSearched && (
            <CommandGroup heading="Search anything">
              <CommandItem value="global-search-help" className="cursor-default">
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-muted-foreground">Type to search files, users, notifications, audit logs, activity, and pages.</span>
              </CommandItem>
            </CommandGroup>
          )}

          {isFetching && (
            <CommandGroup>
              <CommandItem value="search-loading" className="cursor-default">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-muted-foreground">Searching across the application...</span>
              </CommandItem>
            </CommandGroup>
          )}

          {groupedResults.map((group) => (
            <Fragment key={group.category}>
              <CommandSeparator />
              <CommandGroup heading={
                <div className="flex items-center gap-2">
                  <group.Icon className="h-3.5 w-3.5 text-gray-500" />
                  <span>{group.label}</span>
                </div>
              }>
                {group.items.map((result) => {
                  const Icon = CATEGORY_ICON[result.category]
                  return (
                    <CommandItem
                      key={result.id}
                      value={result.id}
                      onSelect={() => selectResult(result)}
                      className="cursor-pointer"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{result.title}</p>
                        <p className="truncate text-xs text-gray-500">{result.subtitle}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </Fragment>
          ))}

          {hasSearched && !isFetching && groupedResults.length === 0 && (
            <CommandEmpty>No results found</CommandEmpty>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

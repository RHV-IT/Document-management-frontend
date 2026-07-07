'use client'

import { Fragment, type ElementType, useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/contexts/auth'
import { useAccessControl } from '@/hooks/useAccessControl'
import { filesAPI, type FileItem } from '@/services/api/files'
import { usersAPI } from '@/services/api/users'
import { notificationsAPI, type Notification } from '@/services/api/notifications'
import { auditAPI, type AuditLog } from '@/services/api/audit'
import { dashboardAPI, type RecentActivity } from '@/services/api/dashboard'
import type { User as UserType } from '@/services/api/auth'
import { formatBytes } from '@/lib/utils'
import {
  Command,
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
  FileText,
  Home,
  Loader2,
  Scan,
  Search,
  Settings,
  Trash2,
  Upload,
  Users,
  X,
  Command as CommandIcon,
  Sparkles,
  Archive,
  UserCheck,
} from 'lucide-react'

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
  category: 'page'
}

// Module registry — each searchable module declares its required roles.
// The global search uses this to gate both quick-nav and result categories.
const NAV_ITEMS: NavSearchItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home, roles: ['user', 'hod', 'admin'], description: 'Overview and recent activity', category: 'page' },
  { label: 'My Files', href: '/dashboard/files', icon: FileText, roles: ['user', 'hod', 'admin'], description: 'Manage and search documents', category: 'page' },
  { label: 'Upload', href: '/dashboard/upload', icon: Upload, roles: ['user', 'hod', 'admin'], description: 'Upload, bulk upload, or scan files', category: 'page' },
  { label: 'Scanner Guide', href: '/dashboard/scanner-user-guide', icon: Scan, roles: ['user', 'hod', 'admin'], description: 'Scanner setup instructions', category: 'page' },
  { label: 'Recycle Bin', href: '/dashboard/recycle-bin', icon: Trash2, roles: ['user', 'hod', 'admin'], description: 'Deleted files', category: 'page' },
  { label: 'Users', href: '/dashboard/admin/users', icon: Users, roles: ['admin', 'hod'], description: 'User administration', category: 'page' },
  { label: 'Audit Logs', href: '/dashboard/admin/audit-log', icon: Activity, roles: ['admin'], description: 'System audit trail', category: 'page' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'], description: 'System configuration', category: 'page' },
]

// Map each result category to the roles that can see it
const CATEGORY_ROLE_MAP: Record<GlobalSearchCategory, string[]> = {
  file: ['user', 'hod', 'admin'],
  page: ['user', 'hod', 'admin'],
  user: ['admin', 'hod'],
  notification: ['user', 'hod', 'admin'],
  activity: ['user', 'hod', 'admin'],
  audit: ['admin'],
}

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

const CATEGORY_COLORS: Record<GlobalSearchCategory, string> = {
  file: 'bg-blue-50 text-blue-600',
  page: 'bg-violet-50 text-violet-600',
  user: 'bg-emerald-50 text-emerald-600',
  notification: 'bg-amber-50 text-amber-600',
  activity: 'bg-cyan-50 text-cyan-600',
  audit: 'bg-rose-50 text-rose-600',
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
      color: CATEGORY_COLORS[category],
      items: items
        .sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))
        .slice(0, 8),
    }))
}

export function GlobalSearch() {
  const router = useRouter()
  const { user, canAccess } = useAuthContext()
  const { filterFiles } = useAccessControl()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const normalizedQuery = normalize(query)
  const hasSearched = normalizedQuery.length > 0
  const userId = getId(user)

  // Derive which result categories this user can see based on their role
  const allowedCategories = useMemo(() => {
    const cats: GlobalSearchCategory[] = []
    for (const [cat, roles] of Object.entries(CATEGORY_ROLE_MAP)) {
      if (canAccess(roles)) {
        cats.push(cat as GlobalSearchCategory)
      }
    }
    return cats
  }, [canAccess])

  // Whether each category is enabled (for query gating)
  const canSearchUsers = allowedCategories.includes('user')
  const canSearchAudit = allowedCategories.includes('audit')
  const canSearchFiles = allowedCategories.includes('file')
  const canSearchNotifications = allowedCategories.includes('notification')
  const canSearchActivity = allowedCategories.includes('activity')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !open)) {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          if (e.key === 'k' && (e.metaKey || e.ctrlKey)) return
          if (e.key === '/' && !open) return
        }
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open])

  // Only fetch data for categories the user can access
  const filesQuery = useQuery({
    queryKey: ['global-search', 'files', normalizedQuery],
    queryFn: () => filesAPI.getFiles({ page: 1, limit: 8, search: normalizedQuery || undefined }),
    select: (response) => response.data.files,
    enabled: hasSearched && canSearchFiles,
    retry: false,
    staleTime: 1000 * 60 * 2,
  })

  const usersQuery = useQuery({
    queryKey: ['global-search', 'users', normalizedQuery],
    queryFn: () => usersAPI.getUsers({ page: 1, limit: 8, search: normalizedQuery || undefined }),
    select: (response): UserType[] => response.data.users,
    enabled: hasSearched && canSearchUsers,
    retry: false,
    staleTime: 1000 * 60 * 2,
  })

  const notificationsQuery = useQuery({
    queryKey: ['global-search', 'notifications'],
    queryFn: () => notificationsAPI.getNotifications({ page: 1, limit: 8 }),
    select: (response) => response.data.notifications,
    enabled: hasSearched && canSearchNotifications,
    retry: false,
    staleTime: 1000 * 30,
  })

  const activityQuery = useQuery({
    queryKey: ['global-search', 'activity'],
    queryFn: () => dashboardAPI.getRecentActivity(),
    select: (response): RecentActivity[] => response.data,
    enabled: hasSearched && canSearchActivity,
    retry: false,
    staleTime: 1000 * 30,
  })

  const auditQuery = useQuery({
    queryKey: ['global-search', 'audit'],
    queryFn: () => auditAPI.getLogs({ page: 1, limit: 8 }),
    select: (response) => response.data.logs,
    enabled: hasSearched && canSearchAudit,
    retry: false,
    staleTime: 1000 * 60 * 2,
  })

  const isFetching = filesQuery.isLoading || usersQuery.isLoading || notificationsQuery.isLoading || activityQuery.isLoading || auditQuery.isLoading

  const results = useMemo(() => {
    const all: GlobalSearchResult[] = []
    if (canSearchFiles) {
      const raw = filesQuery.data || []
      const filtered = filterFiles(raw as any)
      all.push(...filtered.map((file: any) => buildFileResult(file, normalizedQuery, userId)))
    }
    if (canSearchUsers) {
      all.push(...(usersQuery.data || []).map((u) => buildUserResult(u, normalizedQuery)))
    }
    if (canSearchNotifications) {
      all.push(...(notificationsQuery.data || []).map((n) => buildNotificationResult(n, normalizedQuery)))
    }
    if (canSearchActivity) {
      all.push(...(activityQuery.data || []).map((a) => buildActivityResult(a, normalizedQuery)))
    }
    if (canSearchAudit) {
      all.push(...(auditQuery.data || []).map((log) => buildAuditResult(log, normalizedQuery)))
    }
    return all
  }, [filesQuery.data, usersQuery.data, notificationsQuery.data, activityQuery.data, auditQuery.data, normalizedQuery, userId, canSearchFiles, canSearchUsers, canSearchNotifications, canSearchActivity, canSearchAudit, filterFiles])

  const groupedResults = useMemo(() => groupResults(results), [results])

  // Filter quick-nav items to only modules the user can access
  const filteredNavItems = useMemo(() => {
    const accessible = NAV_ITEMS.filter((item) => !item.roles || canAccess(item.roles))
    if (!hasSearched) return accessible
    return accessible.filter(
      (item) => scoreMatch(normalizedQuery, item.label, item.description) < 10
    ).slice(0, 6)
  }, [hasSearched, normalizedQuery, canAccess])

  const selectResult = (result: GlobalSearchResult) => {
    setOpen(false)
    setQuery('')
    router.push(result.href)
  }

  const selectNavItem = (item: NavSearchItem) => {
    setOpen(false)
    setQuery('')
    router.push(item.href)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative w-full flex items-center gap-3 rounded-xl border border-gray-200/80 bg-white/60 px-4 py-2.5 text-sm text-gray-400 shadow-sm backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white/80 hover:shadow-md focus:outline-none focus:ring-0 focus:border-gray-300"
      >
        <Search className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-gray-500 transition-colors" />
        <span className="flex-1 text-left text-gray-400 group-hover:text-gray-500 transition-colors">
          Search anything...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-400 shadow-sm">
          <CommandIcon className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(''); }}>
        <Command className="rounded-2xl border-0 shadow-2xl shadow-black/10 overflow-hidden" shouldFilter={false}>
          <div className="relative">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search files, users, pages, notifications..."
              className="h-14 text-base pl-4 pr-10"
              wrapperClassName="h-12 px-3"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <CommandList className="max-h-105 scroll-smooth">
            {!hasSearched && (
              <div className="px-2 pt-3 pb-2">
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Navigation</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 p-1">
                  {filteredNavItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => selectNavItem(item)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-blue-50/80 focus:bg-blue-50/80 focus:outline-none group"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-gray-50 to-gray-100 border border-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 group-hover:border-blue-200 transition-all">
                        <item.icon className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{item.label}</p>
                        <p className="text-[11px] text-gray-400 group-hover:text-gray-500 truncate">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-3 py-2 mt-2 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400">Type to search across your accessible modules</span>
                </div>
              </div>
            )}

            {hasSearched && isFetching && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-2 border-gray-100 border-t-blue-500 animate-spin" />
                  <Search className="absolute inset-0 m-auto h-5 w-5 text-blue-500" />
                </div>
                <p className="mt-4 text-sm text-gray-500">Searching across the application...</p>
              </div>
            )}

            {hasSearched && !isFetching && groupedResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-4">
                  <Search className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">No results found</p>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {groupedResults.map((group, groupIndex) => (
              <Fragment key={group.category}>
                {groupIndex > 0 && <CommandSeparator className="mx-2" />}
                <CommandGroup
                  heading={
                    <div className="flex items-center gap-2 py-1">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-md ${group.color}`}>
                        <group.Icon className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.label}</span>
                      <span className="ml-auto text-[10px] font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                        {group.items.length}
                      </span>
                    </div>
                  }
                  className="px-2 pt-1 pb-2"
                >
                  {group.items.map((result, index) => {
                    const Icon = CATEGORY_ICON[result.category]
                    const colorClass = CATEGORY_COLORS[result.category]
                    return (
                      <CommandItem
                        key={result.id}
                        value={result.id}
                        onSelect={() => selectResult(result)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer data-[selected=true]:bg-blue-50/80 transition-all group"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass} transition-transform group-hover:scale-105`}>
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-900">
                            {result.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {result.subtitle}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors" />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </Fragment>
            ))}
          </CommandList>

          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <kbd className="inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[9px] shadow-sm">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <kbd className="inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[9px] shadow-sm">↵</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <kbd className="inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[9px] shadow-sm">esc</kbd>
                <span>Close</span>
              </div>
            </div>
            <div className="text-[10px] text-gray-400">
              {hasSearched && !isFetching ? (
                <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
              ) : (
                <span>⌘K to search</span>
              )}
            </div>
          </div>
        </Command>
      </CommandDialog>
    </>
  )
}

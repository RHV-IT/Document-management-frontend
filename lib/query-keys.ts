/**
 * RHV DMS - Query Key Factory
 * 
 * Centralized, type-safe query keys for TanStack Query.
 * 
 * Benefits:
 * - Prevents typos and mismatches between useQuery and invalidateQueries
 * - Easy to invalidate entire domains (e.g. all files)
 * - Consistent naming across the app
 * 
 * Usage:
 *   queryKey: queryKeys.files.list(params)
 *   invalidate: queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
 */

export const queryKeys = {
  // ==================== AUTH ====================
  auth: {
    all: () => ['auth'] as const,
    user: () => ['auth', 'user'] as const,
    session: () => ['auth', 'session'] as const,
    profile: () => ['auth', 'profile'] as const,
  },

  // ==================== FILES ====================
  files: {
    all: () => ['files'] as const,
    list: (params?: any) => ['files', 'list', params] as const,
    detail: (fileId: string) => ['files', 'detail', fileId] as const,
    archive: (params?: any) => ['files', 'archive', params] as const,
    deleted: (params?: any) => ['files', 'deleted', params] as const,
    versions: (fileId: string) => ['files', 'versions', fileId] as const,
    permissions: (fileId: string) => ['files', 'permissions', fileId] as const,
    myPermissions: () => ['files', 'my-permissions'] as const,
    mySentPermissions: () => ['files', 'my-sent-permissions'] as const,
    supportedTypes: () => ['files', 'supported-types'] as const,
  },

  // ==================== SCANNER / PENDING SCANS ====================
  scanner: {
    all: () => ['scanner'] as const,
    pending: {
      all: () => ['scanner', 'pending'] as const,
      list: (params?: any) => ['scanner', 'pending', 'list', params] as const,
      detail: (id: string) => ['scanner', 'pending', 'detail', id] as const,
      stats: () => ['scanner', 'pending', 'stats'] as const,
    },
    // Legacy aliases for gradual migration (prefer scanner.pending.*)
    legacyPending: () => ['pendingScans'] as const,
    legacyPendingDetail: (id: string) => ['pendingScan', id] as const,
  },

  // ==================== DASHBOARD ====================
  dashboard: {
    all: () => ['dashboard'] as const,
    stats: () => ['dashboard', 'stats'] as const,
    recentFiles: () => ['dashboard', 'recent-files'] as const,
    recentActivity: () => ['dashboard', 'recent-activity'] as const,
  },

  // ==================== USERS ====================
  users: {
    all: () => ['users'] as const,
    list: (params?: any) => ['users', 'list', params] as const,
    detail: (userId: string) => ['users', 'detail', userId] as const,
  },

  // ==================== SETTINGS ====================
  settings: {
    all: () => ['settings'] as const,
    departments: () => ['settings', 'departments'] as const,
  },

  // ==================== AGENT ====================
  agent: {
    all: () => ['agent'] as const,
    status: () => ['agent', 'status'] as const,
  },

  // ==================== AUDIT / LOGS ====================
  audit: {
    all: () => ['audit'] as const,
    logs: (params?: any) => ['audit', 'logs', params] as const,
  },

  // ==================== NOTIFICATIONS ====================
  notifications: {
    all: () => ['notifications'] as const,
  },
} as const

// Helper to get all keys for a domain (useful for broad invalidation)
export const getQueryKeyDomain = (domain: keyof typeof queryKeys) => {
  return queryKeys[domain].all?.() || []
}

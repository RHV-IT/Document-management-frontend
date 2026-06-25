export type BackendRole = 'admin' | 'hod' | 'user'

export const BACKEND_ROLES = ['admin', 'hod', 'user'] as const

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  hod: 'Manager',
  user: 'User',
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  hod: 'bg-purple-100 text-purple-700 border-purple-200',
  user: 'bg-gray-100 text-gray-700 border-gray-200',
}

export function normalizeRole(role?: string | null): string {
  return role?.toLowerCase() || ''
}

export function getRoleLabel(role?: string | null): string {
  return ROLE_LABELS[normalizeRole(role)] || role || 'User'
}

export function getRoleBadgeColor(role?: string | null): string {
  return ROLE_BADGE_COLORS[normalizeRole(role)] || ROLE_BADGE_COLORS.user
}

export function isHodRole(role?: string | null): boolean {
  const r = normalizeRole(role)
  return r === 'hod' || r === 'manager' || r === 'line_manager'
}

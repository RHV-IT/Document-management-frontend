export const CONFIDENTIALITY_LEVELS = ['public', 'internal', 'confidential', 'highly_confidential'] as const
export type ConfidentialityLevel = typeof CONFIDENTIALITY_LEVELS[number]

export interface AccessUser {
  role?: string
  department?: string | { name?: string; _id?: string }
  // confidentialityLevel?: string  -- LEGACY singular for user clearance (do NOT use for UI decisions or filtering)
  confidentialityLevels?: string[]
  id?: string
  _id?: string
}

export interface AccessFile {
  department?: string | { name?: string; _id?: string }
  confidentialityLevel?: string  // FILE's assigned level - required for classification vs user's array
  uploadedBy?: { _id?: string; id?: string; name?: string }
  owner?: { _id?: string; id?: string; name?: string }
  fileId?: string
  type?: string
  name?: string
  alias?: string
  createdAt?: string
  size?: number
  [key: string]: any
}

function getDept(d: any): string | null {
  if (!d) return null
  if (typeof d === 'string') return d
  return d.name || d._id || null
}

function getLevelIndex(l?: string): number {
  return CONFIDENTIALITY_LEVELS.indexOf((l || '') as any)
}

export function getAllowedLevels(user: AccessUser | null): ConfidentialityLevel[] {
  if (!user) return ['public']
  const fullList = [...CONFIDENTIALITY_LEVELS]

  if (user.role === 'admin') {
    if (Array.isArray(user.confidentialityLevels) && user.confidentialityLevels.length > 0) {
      return user.confidentialityLevels.filter((l): l is ConfidentialityLevel => fullList.includes(l as any))
    }
    return fullList
  }

  if (Array.isArray(user.confidentialityLevels) && user.confidentialityLevels.length > 0) {
    return user.confidentialityLevels.filter((l): l is ConfidentialityLevel => fullList.includes(l as any))
  }

  // Production default: no levels array from backend means minimal access
  return ['public']
}

// Exact reusable helpers per spec (use ONLY confidentialityLevels array)
export function getAllowedLevelsForUser(user: AccessUser | null): string[] {
  return getAllowedLevels(user)
}

export function canAccess(level: string, user: AccessUser | null = null): boolean {
  return getAllowedLevels(user).includes(level as ConfidentialityLevel)
}

export function canUpload(level: string, user: AccessUser | null = null): boolean {
  return canAccess(level, user)
}

export function canView(level: string, user: AccessUser | null = null): boolean {
  return canAccess(level, user)
}

export function canViewFile(user: AccessUser | null, file: AccessFile | null): boolean {
  if (!user || !file) return false

  const fLevel = file.confidentialityLevel
  const uDept = getDept(user.department)
  const fDept = getDept(file.department)

  // Admin bypasses dept but still limited by their confidentialityLevels array
  if (user.role === 'admin') {
    const allowed = getAllowedLevels(user)
    if (fLevel && !allowed.includes(fLevel as any)) return false
    return true
  }

  // Non-admin: ONLY files in same department (strict per spec)
  if (uDept && fDept && uDept !== fDept) return false

  // Level check: ONLY user's confidentialityLevels array (no singular ever)
  const allowed = getAllowedLevels(user)
  if (fLevel && !allowed.includes(fLevel as any)) return false

  // Highly confidential: ONLY uploader sees it (unless shared by uploader - backend may return via perms)
  if (fLevel === 'highly_confidential') {
    const upId = file.uploadedBy?._id || file.uploadedBy?.id || file.owner?._id || file.owner?.id
    const uId = user.id || user._id
    if (upId && uId && upId !== uId) return false
    return true
  }

  return true
}

export function canUploadLevel(user: AccessUser | null, level: string): boolean {
  return canUpload(level, user)
}

export function getClearanceLabel(level?: string): string {
  const labels: Record<string, string> = {
    public: 'Public',
    internal: 'Internal',
    confidential: 'Confidential',
    highly_confidential: 'Highly Confidential'
  }
  return labels[level || ''] || 'Public'
}

export function getClearanceColor(level?: string): string {
  const colors: Record<string, string> = {
    public: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    internal: 'bg-blue-100 text-blue-800 border-blue-200',
    confidential: 'bg-amber-100 text-amber-800 border-amber-200',
    highly_confidential: 'bg-red-100 text-red-800 border-red-200'
  }
  return colors[level || ''] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export function filterAllowedFiles<T extends AccessFile>(user: AccessUser | null, files: T[]): T[] {
  if (!user) return []
  return files.filter(f => canViewFile(user, f))
}

export function getUserClearanceBadge(user: AccessUser | null) {
  if (!user) return { label: 'Public', color: getClearanceColor('public') }
  const levels = getAllowedLevels(user)
  const highest = levels.length > 0 ? levels[levels.length - 1] : 'public'
  return {
    label: getClearanceLabel(highest),
    color: getClearanceColor(highest)
  }
}

export function getHighestConfidentialityLevel(levels?: string[]): ConfidentialityLevel {
  if (!levels || levels.length === 0) return 'public'
  const valid = levels.filter((l): l is ConfidentialityLevel => CONFIDENTIALITY_LEVELS.includes(l as any))
  if (valid.length === 0) return 'public'
  return valid.reduce((max, l) => getLevelIndex(l) > getLevelIndex(max) ? l : max)
}

// Backward-compat alias for existing imports (now powered by array-only logic)
export const getAllowedUploadLevels = getAllowedLevels

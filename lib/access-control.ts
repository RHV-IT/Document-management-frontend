export const CONFIDENTIALITY_LEVELS = ['public', 'internal', 'confidential', 'highly_confidential'] as const
export type ConfidentialityLevel = typeof CONFIDENTIALITY_LEVELS[number]

export interface AccessUser {
  role?: string
  department?: string | { name?: string; _id?: string }
  confidentialityLevel?: string
  id?: string
  _id?: string
}

export interface AccessFile {
  department?: string | { name?: string; _id?: string }
  confidentialityLevel?: string
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

export function canViewFile(user: AccessUser | null, file: AccessFile | null): boolean {
  if (!user || !file) return false
  if (user.role === 'admin') return true
  const uDept = getDept(user.department)
  const fDept = getDept(file.department)
  if (uDept && fDept && uDept !== fDept) return false
  const uIdx = getLevelIndex(user.confidentialityLevel)
  const fIdx = getLevelIndex(file.confidentialityLevel)
  if (uIdx === -1 || fIdx === -1) return false
  if (fIdx > uIdx) return false
  if (file.confidentialityLevel === 'highly_confidential') {
    const upId = file.uploadedBy?._id || file.uploadedBy?.id || file.owner?._id || file.owner?.id
    const uId = user.id || user._id
    if (upId && uId && upId !== uId) return false
    return true
  }
  return true
}

export function getAllowedUploadLevels(user: AccessUser | null): ConfidentialityLevel[] {
  if (!user) return ['public']
  if (user.role === 'admin') return [...CONFIDENTIALITY_LEVELS]
  const idx = getLevelIndex(user.confidentialityLevel)
  if (idx === -1) return ['public']
  return [...CONFIDENTIALITY_LEVELS].slice(0, idx + 1)
}

export function canUploadLevel(user: AccessUser | null, level: string): boolean {
  return getAllowedUploadLevels(user).includes(level as any)
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
  return {
    label: getClearanceLabel(user.confidentialityLevel),
    color: getClearanceColor(user.confidentialityLevel)
  }
}

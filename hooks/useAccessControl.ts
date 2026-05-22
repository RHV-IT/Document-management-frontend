'use client'

import { useMemo, useCallback } from 'react'
import { useAuthContext } from '@/contexts/auth'
import {
  canViewFile,
  canUploadLevel,
  getAllowedUploadLevels,
  getClearanceLabel,
  getClearanceColor,
  filterAllowedFiles,
  getUserClearanceBadge,
  AccessUser,
  AccessFile,
  ConfidentialityLevel
} from '@/lib/access-control'

export function useAccessControl() {
  const { user } = useAuthContext()

  const accessUser: AccessUser | null = useMemo(() => {
    if (!user) return null
    return {
      role: user.role,
      department: user.department,
      confidentialityLevel: user.confidentialityLevel,
      confidentialityLevels: user.confidentialityLevels,
      id: user.id,
      _id: user._id
    }
  }, [user])

  const canView = useCallback((file: AccessFile | null) => {
    return canViewFile(accessUser, file)
  }, [accessUser])

  const canUpload = useCallback((level: string) => {
    return canUploadLevel(accessUser, level)
  }, [accessUser])

  const allowedUploadLevels = useMemo(() => getAllowedUploadLevels(accessUser), [accessUser])

  const clearanceBadge = useMemo(() => getUserClearanceBadge(accessUser), [accessUser])

  const userDepartment = useMemo(() => {
    if (!accessUser?.department) return null
    if (typeof accessUser.department === 'string') return accessUser.department
    return accessUser.department.name || accessUser.department._id || null
  }, [accessUser])

  const isAdmin = accessUser?.role === 'admin'

  const filterFiles = useCallback(<T extends AccessFile>(files: T[]): T[] => {
    return filterAllowedFiles(accessUser, files)
  }, [accessUser])

  const getClearanceInfo = useCallback((level?: string) => ({
    label: getClearanceLabel(level),
    color: getClearanceColor(level)
  }), [])

  return {
    user: accessUser,
    canView,
    canUpload,
    allowedUploadLevels,
    clearanceBadge,
    userDepartment,
    isAdmin,
    filterFiles,
    getClearanceInfo,
    getClearanceLabel,
    getClearanceColor
  }
}

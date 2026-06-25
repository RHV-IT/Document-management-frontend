'use client'

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient, UseMutationResult } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authAPI, User, LoginRequest, AuthResponse, Profile } from '@/services/api/auth'
import { queryKeys } from '@/lib/query-keys'
import { addNotification } from '@/components/notifications/NotificationCenter'
import { agentService } from '@/services/agent'
import { useProfileStore } from '@/stores/useProfileStore'

interface AuthContextType {
  user: User | null
  profiles: Profile[]
  activeProfile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<{ success: boolean; user?: User; profiles?: Profile[]; activeProfile?: Profile; error?: string }>
  logout: (options?: { skipRedirect?: boolean; message?: string }) => Promise<void>
  setUser: (user: User | null) => void
  setProfiles: (profiles: Profile[]) => void
  setActiveProfile: (profile: Profile) => void
  switchProfile: (profileId: string) => Promise<{ success: boolean; error?: string }>
  canAccess: (requiredRoles?: string[]) => boolean
  loginCount: number
  incrementLoginCount: () => void
  resetLoginCount: () => void
  isFirstLogin: () => boolean
  loginMutation: UseMutationResult<AuthResponse, Error, LoginRequest>
  logoutMutation: UseMutationResult<{ success: boolean; message: string }, Error, { skipRedirect?: boolean; message?: string }>
  switchProfileMutation: UseMutationResult<any, Error, { profileId: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const getLoginCountKey = (userId: string) => `loginCount_${userId}`

const getLoginCount = (userId: string): number => {
  if (typeof window === 'undefined') return 0
  try {
    const count = localStorage.getItem(getLoginCountKey(userId))
    return count ? parseInt(count, 10) : 0
  } catch {
    return 0
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loginCount, setLoginCount] = useState<number>(0)
  const { profiles, activeProfile, setProfiles, setActiveProfile, setSwitchingProfile } = useProfileStore()

  const sessionQuery = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: () => authAPI.getCurrentUser(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
    throwOnError: false,
  })

  const user = sessionQuery.data?.data || null
  const isAuthenticated = !!user
  const isLoading = sessionQuery.isLoading

  useEffect(() => {
    if (user?.id || user?._id) {
      const userId = user.id || user._id || ''
      const count = getLoginCount(userId)
      setLoginCount(count)
    }
  }, [user])

  useEffect(() => {
    const handleSessionExpired = () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() })
      addNotification('error', 'Session Expired', 'Your session has expired. Please log in again.')
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [queryClient])

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authAPI.login(data),
    onSuccess: (response) => {
      const { user, profiles, activeProfile } = response.data
      queryClient.setQueryData(queryKeys.auth.user(), { data: user })

      if (profiles) {
        setProfiles(profiles)
      }
      if (activeProfile) {
        setActiveProfile(activeProfile)
        localStorage.setItem('activeProfileId', activeProfile.profileId)
      }

      const apiLoginCount = (response.data as any)?.loginCount ?? (user as any)?.loginCount ?? 1
      if (typeof window !== 'undefined') {
        const userId = user.id || user._id || ''
        const countKey = getLoginCountKey(userId)
        localStorage.setItem(countKey, apiLoginCount.toString())
      }
    },
  })

  const switchProfileMutation = useMutation({
    mutationFn: (data: { profileId: string }) => authAPI.switchProfile(data),
    onSuccess: async (response) => {
      const { user: responseUser, profiles: responseProfiles, activeProfile } = response.data

      if (responseUser) {
        queryClient.setQueryData(queryKeys.auth.user(), { data: responseUser })
      }

      if (responseProfiles) {
        setProfiles(responseProfiles)
      }

      if (activeProfile) {
        setActiveProfile(activeProfile)
        localStorage.setItem('activeProfileId', activeProfile.profileId)
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.scanner.all() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() })

      setSwitchingProfile(null)
      addNotification('success', 'Profile Switched', `Successfully switched to ${activeProfile?.department} profile`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to switch profile'
      addNotification('error', 'Switch Failed', message)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: (_: { skipRedirect?: boolean; message?: string } = {}) => authAPI.logout(),
    onSuccess: async (_, variables) => {
      const { skipRedirect, message } = variables || {}
      try {
        await agentService.setToken({ token: null, userId: null, machineId: null })
      } catch (e) {
        console.warn('Failed to clear agent token:', e)
      }
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() })
      setProfiles([])
      setActiveProfile(null)
      localStorage.removeItem('activeProfileId')
      addNotification('success', 'Logged Out', message || 'You have been successfully logged out.')
      if (!skipRedirect) {
        router.push('/login')
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Logout failed'
      addNotification('error', 'Logout Failed', message)
    },
  })

  const login = useCallback(async (data: LoginRequest) => {
    try {
      const response = await loginMutation.mutateAsync(data)
      const { user, profiles, activeProfile } = response.data

      const apiLoginCount = (response.data as any)?.loginCount ?? (user as any)?.loginCount ?? 1

      if (typeof window !== 'undefined') {
        const userId = user.id || user._id || ''
        const countKey = getLoginCountKey(userId)
        const currentStored = getLoginCount(userId)
        const effectiveCount = apiLoginCount > 0 ? apiLoginCount : (currentStored || 1)
        localStorage.setItem(countKey, effectiveCount.toString())
      }

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        const userId = user.id || user._id || ''
        const machineId = (await import('@/lib/utils')).getMachineId()
        if (token && userId) {
          agentService.setToken({ token, userId, machineId }).then(async () => {
            const maxRetries = 10
            let retryCount = 0
            const retryHealth = async () => {
              try {
                const health = await agentService.getHealth()
                const isHealthy = health.running || health.installed
                if (isHealthy) {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('agentConnected', 'true')
                  }
                  const updatedUser = { ...user, agentConnected: true, mustDownloadAgent: false }
                  queryClient.setQueryData(queryKeys.auth.user(), { data: updatedUser })
                  await queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() })
                  return true
                }
              } catch (e) {
                console.log("Agent health response:", { success: false })
              }
              retryCount++
              if (retryCount < maxRetries) {
                setTimeout(retryHealth, 2000)
              }
              return false
            }
            await retryHealth()
          })
        }
      }

      return { success: true, user, profiles, activeProfile }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid credentials'
      return { success: false, error: errorMessage }
    }
  }, [])

  const logout = useCallback(async (options?: { skipRedirect?: boolean; message?: string }) => {
    try {
      await logoutMutation.mutateAsync(options || {})
    } catch (error) {
    }
  }, [logoutMutation])

  const switchProfile = useCallback(async (profileId: string) => {
    try {
      await switchProfileMutation.mutateAsync({ profileId })
      return { success: true }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to switch profile'
      return { success: false, error: message }
    }
  }, [switchProfileMutation])

  const setUser = useCallback((newUser: User | null) => {
    if (newUser) {
      queryClient.setQueryData(queryKeys.auth.user(), { data: newUser })
    } else {
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() })
    }
  }, [])

  const canAccess = useCallback((requiredRoles?: string[]) => {
    if (!user) return false
    if (!requiredRoles || requiredRoles.length === 0) return true
    return requiredRoles.includes(user.role || '')
  }, [user])

  const incrementLoginCount = useCallback(() => {
    if (!user || typeof window === 'undefined') return
    const userId = user.id || user._id || ''
    const countKey = getLoginCountKey(userId)
    const currentCount = getLoginCount(userId)
    const newCount = currentCount + 1
    localStorage.setItem(countKey, newCount.toString())
    setLoginCount(newCount)
  }, [user])

  const resetLoginCount = useCallback((userId?: string) => {
    if (typeof window === 'undefined') return
    const targetUserId = userId || (user?.id || user?._id || '')
    if (targetUserId) {
      localStorage.removeItem(getLoginCountKey(targetUserId))
      if (targetUserId === (user?.id || user?._id)) {
        setLoginCount(0)
      }
    }
  }, [user])

  const isFirstLogin = useCallback(() => {
    return loginCount === 1 || loginCount === 0
  }, [loginCount])

const value: AuthContextType = {
     user,
     profiles,
     activeProfile,
     isAuthenticated,
     isLoading,
     login,
     logout,
     setUser,
     setProfiles,
     setActiveProfile,
     switchProfile,
     canAccess,
     loginCount,
     incrementLoginCount,
     resetLoginCount,
     isFirstLogin,
     loginMutation,
     logoutMutation,
     switchProfileMutation,
   }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export function useAuth() {
  const context = useAuthContext()

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    return await context.login({ email, password, rememberMe })
  }

  const logout = async () => {
    return await context.logout()
  }

  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    login,
    logout,
    canAccess: context.canAccess,
    loginCount: context.loginCount,
    incrementLoginCount: context.incrementLoginCount,
    isFirstLogin: context.isFirstLogin,
  }
}
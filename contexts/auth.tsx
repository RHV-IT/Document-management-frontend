'use client'

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient, UseMutationResult } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authAPI, User, LoginRequest, AuthResponse } from '@/services/api/auth'
import { addNotification } from '@/components/notifications/NotificationCenter'
import { agentService } from '@/services/agent'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<{ success: boolean; user?: User; error?: string }>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  canAccess: (requiredRoles?: string[]) => boolean
  loginCount: number
  incrementLoginCount: () => void
  resetLoginCount: () => void
  isFirstLogin: () => boolean
  loginMutation: UseMutationResult<AuthResponse, Error, LoginRequest>
  logoutMutation: UseMutationResult<{ success: boolean; message: string }, Error, void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Get login count key for current user
const getLoginCountKey = (userId: string) => `loginCount_${userId}`

// Get login count from localStorage
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

  // Session query - fetches current user on mount and when cache is stale
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: () => authAPI.getCurrentUser(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: false,
    throwOnError: false,
  })

  const user = sessionQuery.data?.data || null
  const isAuthenticated = !!user
  const isLoading = sessionQuery.isLoading

  // Update login count when user changes
  useEffect(() => {
    if (user?.id || user?._id) {
      const userId = user.id || user._id || ''
      const count = getLoginCount(userId)
      setLoginCount(count)
    }
  }, [user])

  // Handle session expired event from axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      queryClient.removeQueries({ queryKey: ['session'] })
      addNotification('error', 'Session Expired', 'Your session has expired. Please log in again.')
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [queryClient])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authAPI.login(data),
    onSuccess: (response, variables) => {
      const { user } = response.data
      // Update session cache
      queryClient.setQueryData(['session'], { data: user })
      
      // Initialize login count for this user if not exists
      if (typeof window !== 'undefined') {
        const userId = user.id || user._id || ''
        const countKey = getLoginCountKey(userId)
        if (!localStorage.getItem(countKey)) {
          localStorage.setItem(countKey, '0')
        }
      }
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: async () => {
      // Clear agent token
      try {
        await agentService.setToken({ token: null, userId: null, machineId: null })
      } catch (e) {
        console.warn('Failed to clear agent token:', e)
      }
      // Clear session cache
      queryClient.removeQueries({ queryKey: ['session'] })
      addNotification('success', 'Logged Out', 'You have been successfully logged out.')
      router.push('/login')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Logout failed'
      addNotification('error', 'Logout Failed', message)
    },
  })

  // Login wrapper
  const login = useCallback(async (data: LoginRequest) => {
    try {
      const response = await loginMutation.mutateAsync(data)
      const { user } = response.data

      // Initialize login count for this user if not exists
      if (typeof window !== 'undefined') {
        const userId = user.id || user._id || ''
        const countKey = getLoginCountKey(userId)
        if (!localStorage.getItem(countKey)) {
          localStorage.setItem(countKey, '0')
        }
      }

      // Sync token to scanner agent on user's machine (browser-only, direct localhost)
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        const userId = user.id || user._id || ''
         if (token && userId) {
            agentService.setToken({ token, userId, machineId: null }).then(() => {
              // After successful set-token: update state, cache, refetch
              localStorage.setItem('agentConnected', 'true')
              queryClient.setQueryData(['session'], { data: { ...user, agentConnected: true, mustDownloadAgent: false } })
              queryClient.invalidateQueries({ queryKey: ['session'] })
            })
          }
      }

      return { success: true, user }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid credentials'
      return { success: false, error: errorMessage }
    }
  }, [])

  // Logout wrapper
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync()
    } catch (error) {
      // Error already handled by mutation's onError
    }
  }, [logoutMutation])

  // Manual user setter (used by other hooks/mutations)
  const setUser = useCallback((newUser: User | null) => {
    if (newUser) {
      queryClient.setQueryData(['session'], { data: newUser })
    } else {
      queryClient.removeQueries({ queryKey: ['session'] })
    }
  }, [])

  // Access control
  const canAccess = useCallback((requiredRoles?: string[]) => {
    if (!user) return false
    if (!requiredRoles || requiredRoles.length === 0) return true
    return requiredRoles.includes(user.role || '')
  }, [user])

  // Login count utilities
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
    return loginCount === 0
  }, [loginCount])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    canAccess,
    loginCount,
    incrementLoginCount,
    resetLoginCount,
    isFirstLogin,
    loginMutation,
    logoutMutation,
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

// Convenience hook that maintains same API as before but uses TanStack Query internally
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
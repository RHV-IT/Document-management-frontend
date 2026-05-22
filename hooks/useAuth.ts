import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { authAPI, LoginRequest, RegisterRequest, User } from '@/services/api/auth'
import { useRouter } from 'next/navigation'
import { addNotification } from '@/components/notifications/NotificationCenter'
import { debug } from '@/lib/debug'

// Convenience hook that provides simplified API
export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  
  useEffect(() => {
    debug.render('useAuth', 'checking stored credentials')
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      try {
        debug.auth('credentials found, parsing user')
        setUser(JSON.parse(storedUser))
      } catch (err) {
        debug.error('Failed to parse stored user', err)
        setUser({})
      }
    } else {
      debug.render('useAuth', 'no stored credentials found')
    }
  }, [])

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch {
          setUser({})
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authAPI.login(data),
  })

  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
  })

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    debug.auth('login attempt', { email, rememberMe })
    try {
      const response: any = await loginMutation.mutateAsync({ email, password, rememberMe: rememberMe || false })
      const userData = response.data.user
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      debug.auth('login success', { userId: userData.id || userData._id, userName: userData.name })
      window.dispatchEvent(new Event('storage'))
      return { success: true, user: userData }
    } catch (error: any) {
      debug.error('login failed', error.response?.data?.message || error.message)
      return { success: false, error: error.response?.data?.message || 'Invalid credentials' }
    }
  }

  const logout = async () => {
    debug.auth('logout attempt')
    try {
      await logoutMutation.mutateAsync()
      setUser(null)
      localStorage.removeItem('user')
      debug.auth('logout success')
      return { success: true }
    } catch (error) {
      debug.error('logout failed', error)
      return { success: false }
    }
  }

  const canAccess = (requiredRoles?: string[]) => {
    if (!requiredRoles || requiredRoles.length === 0) {
      debug.render('canAccess', 'no roles required, returning true')
      return true
    }
    if (typeof window === 'undefined') {
      debug.render('canAccess', 'SSR mode, allowing access by default')
      return true // SSR: allow access by default to prevent render crashes
    }
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const hasAccess = !!token
    debug.render('canAccess', { requiredRoles, hasToken: !!token, hasAccess })
    return hasAccess
  }

  const isFirstLogin = () => {
    if (typeof window === 'undefined') {
      return false
    }
    const onboardingCompleted = localStorage.getItem('onboardingCompleted')
    return !onboardingCompleted
  }

  const isAuthenticated = () => {
    if (typeof window === 'undefined') {
      debug.render('isAuthenticated', 'SSR mode, returning false')
      return false
    }
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const authenticated = !!token || !!user
    debug.render('isAuthenticated', { hasToken: !!token, hasUser: !!user, result: authenticated })
    return authenticated
  }

  const isAuthenticatedValue = typeof window !== 'undefined' 
    ? !!(localStorage.getItem('token') || sessionStorage.getItem('token') || user)
    : false

  return {
    user: user || null,
    isAuthenticated: isAuthenticatedValue,
    isLoading: false,
    login,
    logout,
    canAccess,
    isFirstLogin,
  }
}

// Expose mutations directly for components that need mutation state
export function useLoginMutation() {
  return useMutation({
    mutationFn: (data: LoginRequest) => authAPI.login(data),
  })
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => authAPI.logout(),
  })
}

export function useRegisterMutation() {
  const router = useRouter()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authAPI.register(data),
    onSuccess: () => {
      addNotification('success', 'Account Created', 'Your account has been created successfully.')
      router.push('/dashboard')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed'
      addNotification('error', 'Registration Failed', message)
    },
  })
}

export function useProfileQuery() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authAPI.getProfile()
      console.log('DEBUG - useProfileQuery raw response:', response.data)
      return response.data || {}
    },
  })
}

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: (data: Partial<User>) => authAPI.updateProfile(data),
    onSuccess: (response) => {
      addNotification('success', 'Profile Updated', 'Your profile has been updated successfully.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update profile'
      addNotification('error', 'Update Failed', message)
    },
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authAPI.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      addNotification('success', 'Password Changed', 'Your password has been changed successfully.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to change password'
      addNotification('error', 'Password Change Failed', message)
    },
  })
}

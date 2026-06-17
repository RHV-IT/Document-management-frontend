import apiClient from './axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rhv-dms-backend.vercel.app'

export const authAPI = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/v1/auth/register', data)
    return response.data
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/api/v1/auth/login', {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe || false,
      })

      const { accessToken, refreshToken, user } = response.data.data

      if (data.rememberMe) {
        localStorage.setItem('token', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('userId', user.id || user._id || '')
      } else {
        sessionStorage.setItem('token', accessToken)
        sessionStorage.setItem('refreshToken', refreshToken)
        sessionStorage.setItem('userId', user.id || user._id || '')
      }

      try {
        await apiClient.post('/api/v1/auth/track-login', {
          userId: user.id || user._id,
          timestamp: new Date().toISOString(),
        })
      } catch (trackError) {
        console.warn('Login tracking failed:', trackError)
      }

      return response.data
    } catch (error: any) {
      if (error.response) {
        throw error
      }
      const wrappedError: any = new Error('Network error')
      wrappedError.response = { data: { message: 'Network error' }, status: 0 }
      throw wrappedError
    }
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('refreshToken')
    sessionStorage.removeItem('userId')
    const response = await apiClient.post('/api/v1/auth/logout')
    return response.data
  },

  refresh: async (refreshToken: string): Promise<{ success: boolean; data: { accessToken: string } }> => {
    const response = await apiClient.post('/api/v1/auth/refresh', { refreshToken })
    return response.data
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get('/api/v1/auth/profile')
    return response.data
  },

  getCurrentUser: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get('/api/v1/auth/me')
    return response.data
  },

  updateProfile: async (data: Partial<User>): Promise<ProfileResponse> => {
    const response = await apiClient.put('/api/v1/auth/profile', data)
    return response.data
  },

  changePassword: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/v1/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  },

  trackLogin: async (userId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post('/api/v1/auth/track-login', {
      userId,
      timestamp: new Date().toISOString(),
    })
    return response.data
  },
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  department?: string
  role?: string
  confidentialityLevel?: string
}

export interface User {
  id?: string
  _id?: string
  email: string
  name: string
  role: string
  department: string
  status: string
  createdAt?: string
  confidentialityLevel?: string
  confidentialityLevels?: string[]
  loginCount?: number
}

export interface AuthResponse {
  success: boolean
  message?: string
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
}

export interface ProfileResponse {
  success: boolean
  data: User
}

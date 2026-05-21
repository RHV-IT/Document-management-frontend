import axios, { AxiosInstance, AxiosError } from 'axios'
import { debug } from '@/lib/debug'
import { getMachineInfo } from '@/lib/machine'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rhv-dms-backend.vercel.app'

const getToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add Authorization header and ensure JSON
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      // Add machine metadata headers
      const machine = getMachineInfo()
      config.headers['x-machine-id'] = machine.machineId
      config.headers['x-machine-name'] = machine.machineName
      config.headers['x-hostname'] = machine.hostname
      config.headers['x-platform'] = machine.platform
      config.headers['x-browser'] = machine.browser
      config.headers['x-browser-version'] = machine.browserVersion
      config.headers['x-source'] = machine.source
    }
    // Only set Content-Type for non-FormData requests
    // FormData should use multipart/form-data with boundary auto-set by axios
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
      delete config.headers['content-type']
    } else {
      config.headers['Content-Type'] = 'application/json'
    }
    debug.api(config.method?.toUpperCase() || 'unknown', config.url || 'unknown')
    return config
  },
  (error) => {
    debug.error('Request interceptor error', error)
    return Promise.reject(error)
  }
)

// Response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response) => {
    debug.api(response.config.method?.toUpperCase() || 'unknown', response.config.url || 'unknown', response.status)
    return response
  },
  async (error: AxiosError) => {
    debug.api(
      error.config?.method?.toUpperCase() || 'unknown',
      error.config?.url || 'unknown',
      error.response?.status,
      (error.response?.data as any)?.message || error.message
    )
    const url = error.config?.url || ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me')

    if (error.response?.status === 401 && !isAuthEndpoint) {
      if (typeof window !== 'undefined') {
        debug.warn('Session expired - redirecting to login')
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

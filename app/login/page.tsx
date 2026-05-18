'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth'
import { useSyncAgentToken } from '@/hooks/useAgent'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Shield, 
  Sparkles, Zap, FileText, Database, Users, Globe 
} from 'lucide-react'
import { addNotification } from '@/components/notifications/NotificationCenter'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getUserFriendlyErrorMessage } from '@/lib/errorUtils'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

// Generate deterministic particle positions based on index
function generateParticle(index: number) {
  // Use a seeded random approach with index as seed
  const seed = (index * 9301 + 49297) % 233280;
  const rnd = () => seed / 233280;
  
  return {
    x: `${(rnd() * 100).toFixed(2)}%`,
    y: `${(rnd() * 100).toFixed(2)}%`,
    delay: `${(rnd() * 5).toFixed(2)}s`,
    duration: `${5 + rnd() * 10}s`,
    size: `${4 + rnd() * 4}px`,
  }
}

// Pre-generate particles on client only
function useParticles(count: number) {
  const [mounted, setMounted] = useState(false)
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => generateParticle(i))
  , [count])

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted ? particles : []
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const syncToken = useSyncAgentToken()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Trigger entrance animation
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Track mouse for gradient effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

const onSubmit = async (data: LoginFormData) => {
      console.log('Login form submitted with:', JSON.stringify(data, null, 2))
      setIsLoading(true)
      try {
        const response = await login(data.email, data.password, data.rememberMe)

        if (response.success) {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token')
          const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId')

          if (token && userId) {
            syncToken.mutate({ token, userId }, {
              onSuccess: () => {
                localStorage.setItem('agentConnected', 'true')
                localStorage.setItem('scanner_agent_setup_complete', 'true')
              }
            })
          } else {
            if (typeof window !== 'undefined') {
              localStorage.setItem('scanner_agent_setup_complete', 'true')
            }
          }

          addNotification('success', 'Welcome!', 'You have successfully logged in.')
          router.push('/dashboard')
        } else {
          addNotification('error', 'Login Failed', response.error || 'Invalid credentials')
        }
      } catch (error) {
        addNotification('error', 'Login Failed', getUserFriendlyErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    }

  const features = [
    { icon: <Database className="h-5 w-5" />, label: 'Secure Storage' },
    { icon: <FileText className="h-5 w-5" />, label: 'Smart Categorization' },
    { icon: <Users className="h-5 w-5" />, label: 'Team Collaboration' },
    { icon: <Globe className="h-5 w-5" />, label: 'Access Anywhere' },
  ]

  // Get particles (only on client)
  const particles = useParticles(20)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 opacity-40">
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-200/30 via-indigo-200/30 to-cyan-200/30 transition-all duration-1000"
          style={{
            backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
            backgroundSize: '200% 200%',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-300/40 animate-float"
            style={{
              left: particle.x,
              top: particle.y,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              width: particle.size,
              height: particle.size,
            }}
          />
        ))}
      </div>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Glowing orbs - lighter for light theme */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-300/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-cyan-300/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '4s' }} />

      <div className="relative w-full max-w-6xl flex items-center justify-center gap-8">
        {/* Left side - Branding */}
        <div className={cn(
          "hidden lg:flex flex-col justify-center flex-1 text-gray-900 relative transition-all duration-1000",
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
        )}>
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-20 h-20 border border-gray-200/60 rounded-full animate-spin-slow" />
          <div className="absolute bottom-20 right-10 w-32 h-32 border border-gray-200/40 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }} />

          <div className="space-y-8 relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-blue-200 shadow-lg overflow-hidden group">
                <Image
                  src="/images/rhv-logo.png"
                  alt="DMS Logo"
                  width={48}
                  height={48}
                  className="object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  DMS Portal
                </h1>
                <p className="text-gray-600 text-sm tracking-wide">Document Management System</p>
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-4">
              <h2 className="text-5xl font-bold leading-tight text-gray-900">
                Manage Your<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600">
                  Documents
                </span><br />
                Intelligently
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-md">
                Streamline your document workflow with AI-powered organization,
                secure cloud storage, and seamless team collaboration.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-gray-200 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 group-hover:text-blue-700 transition-colors">
                    {feature.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className={cn(
          "w-full max-w-md lg:max-w-lg transition-all duration-1000 delay-200",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <div className="relative">
            {/* Clean white card */}
            <div className="relative bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Gradient header */}
              <div className="relative h-28 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-16 -mb-16" />
                  <div className="absolute top-1/2 right-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl" />
                </div>

                {/* Animated sparkles */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Sparkles className="w-12 h-12 text-white/20 animate-pulse" />
                </div>

                {/* Logo and title */}
                <div className="absolute bottom-4 left-8 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <Image
                      src="/images/rhv-logo.png"
                      alt="DMS Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">DMS Portal</h1>
                    <p className="text-white/80 text-xs">Document Management System</p>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="px-8 py-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                  <p className="text-gray-600 text-sm mt-2">
                    Sign in to access your documents and workspace
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      Email Address
                    </label>
                    <div className={cn(
                      'relative rounded-xl border-2 transition-all duration-300 bg-white',
                      errors.email
                        ? 'border-red-300 focus:border-red-300'
                        : 'border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    )}>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Mail className={cn(
                          'w-5 h-5 transition-colors',
                          errors.email ? 'text-red-400' : 'text-gray-400'
                        )} />
                      </div>
                      <input
                        type="email"
                        placeholder="name@company.com"
                        {...register('email')}
                        className="w-full pl-11 pr-4 py-3.5 bg-transparent rounded-xl focus:outline-none text-gray-900 placeholder:text-gray-400 transition-all"
                      />
                      {errors.email && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Zap className="w-5 h-5 text-red-400 animate-pulse" />
                        </div>
                      )}
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500 font-medium animate-slide-in-up">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-500" />
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className={cn(
                      'relative rounded-xl border-2 transition-all duration-300 bg-white',
                      errors.password
                        ? 'border-red-300 focus:border-red-300'
                        : 'border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    )}>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Lock className={cn(
                          'w-5 h-5 transition-colors',
                          errors.password ? 'text-red-400' : 'text-gray-400'
                        )} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('password')}
                        className="w-full pl-11 pr-12 py-3.5 bg-transparent rounded-xl focus:outline-none text-gray-900 placeholder:text-gray-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors p-1 hover:bg-blue-50 rounded-lg"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500 font-medium animate-slide-in-up">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      {...register('rememberMe')}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer select-none">
                      Remember me on this device
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_200%] hover:bg-right-bottom text-white font-bold py-4 rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6 group relative overflow-hidden"
                  >
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />

                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                        <span className="relative z-10">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10">Sign In</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                      </>
                    )}
                  </button>
                </form>

                {/* Sign up link */}
                <div className="mt-6 text-center text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/signup"
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                  >
                    Request Access
                  </Link>
                </div>
              </div>

              {/* Security badge */}
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Secure • RHV • Document Management</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

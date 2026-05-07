'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Shield, 
  Sparkles, User, Building, Phone, MessageSquare, Check,
  AlertTriangle, Clock, Users, FileText 
} from 'lucide-react'
import { addNotification } from '@/components/notifications/NotificationCenter'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Generate deterministic particle positions based on index
function generateParticle(index: number) {
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

type SignupFormData = {
  fullName: string
  email: string
  company: string
  phone?: string
  reason: string
}

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [submittedData, setSubmittedData] = useState<SignupFormData | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const particles = useParticles(15)

  const formRef = useRef<HTMLFormElement>(null)

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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data: SignupFormData = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string,
      reason: formData.get('reason') as string,
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setSubmittedData(data)
    setStep('success')
    setIsLoading(false)

    addNotification('success', 'Request Submitted', 'An admin will review your access request.')
  }

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
            className="absolute rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-300/30 animate-float"
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

      {/* Glowing orbs - light theme */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-300/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-6xl flex items-center justify-center gap-8">
        {/* Left side - Branding & Info */}
        <div className={cn(
          "hidden lg:flex flex-col justify-center flex-1 text-gray-900 relative transition-all duration-1000",
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
        )}>
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-20 h-20 border border-gray-200/60 rounded-full animate-spin-slow" />
          <div className="absolute bottom-20 right-10 w-32 h-32 border border-gray-200/40 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }} />
          
          <div className="space-y-8 relative z-10">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-blue-200 shadow-lg overflow-hidden">
                <Image 
                  src="/images/rhv-logo.png" 
                  alt="DMS Logo" 
                  width={48} 
                  height={48} 
                  className="object-contain hover:scale-110 transition-transform duration-300" 
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  DMS Portal
                </h1>
                <p className="text-gray-600 text-sm tracking-wide">Document Management System</p>
              </div>
            </div>

            {/* Main message */}
            <div className="space-y-6">
              <h2 className="text-5xl font-bold leading-tight text-gray-900">
                Request{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600">
                  Access
                </span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-md">
                Complete the form to request access to the DMS platform. 
                An administrator will review your application and create your account.
              </p>
            </div>

            {/* Info cards */}
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/70 border border-gray-200 hover:bg-white hover:border-blue-200 transition-all">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Review Process</h3>
                  <p className="text-gray-600 text-sm">Admin typically responds within 24-48 hours during business days.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/70 border border-gray-200 hover:bg-white hover:border-blue-200 transition-all">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">What to Expect</h3>
                  <p className="text-gray-600 text-sm">Once approved, you&apos;ll receive login credentials via email.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/70 border border-gray-200 hover:bg-white hover:border-blue-200 transition-all">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Secure Access</h3>
                  <p className="text-gray-600 text-sm">Your data is protected with enterprise-grade encryption.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Signup Form */}
        <div className={cn(
          "w-full max-w-lg transition-all duration-1000 delay-200",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <div className="relative">
            {/* Clean white card */}
            <div className="relative bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Gradient header */}
              <div className="relative h-28 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-16 -mb-16" />
                </div>
                
                {/* Icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Sparkles className="w-12 h-12 text-white/20 animate-pulse" />
                </div>

                {/* Title */}
                <div className="absolute bottom-4 left-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-white">Request Access</h1>
                      <p className="text-white/80 text-xs">DMS Portal</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="px-8 py-8 -mt-2">
                {step === 'form' ? (
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-gray-900">Get Started</h2>
                      <p className="text-gray-600 text-sm mt-2">
                        Fill out the form below. An admin will contact you.
                      </p>
                    </div>

                    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          Full Name
                        </label>
                        <input
                          name="fullName"
                          placeholder="John Doe"
                          required
                          className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          Email Address
                        </label>
                        <input
                          name="email"
                          type="email"
                          placeholder="john@company.com"
                          required
                          className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                        />
                      </div>

                      {/* Company */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-500" />
                          Company / Organization
                        </label>
                        <input
                          name="company"
                          placeholder="Acme Corp"
                          required
                          className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                          name="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                        />
                      </div>

                      {/* Reason */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          Reason for Access
                        </label>
                        <textarea
                          name="reason"
                          placeholder="Briefly describe why you need access to the DMS..."
                          required
                          rows={3}
                          className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white resize-none"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-[length:200%_200%] hover:bg-right-bottom text-white font-bold py-4 rounded-xl hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6 group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                        
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                            <span className="relative z-10">Submitting...</span>
                          </>
                        ) : (
                          <>
                            <span className="relative z-10">Submit Request</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  /* Success State */
                  <div className="text-center py-8">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                      <Check className="w-10 h-10 text-emerald-600" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Request Submitted!
                    </h3>
                    <p className="text-gray-600 mb-8">
                      Thank you, {submittedData?.fullName}. Your access request has been received.
                    </p>

                    {/* Request summary */}
                    <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-3">
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-900">{submittedData?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Company</p>
                          <p className="text-sm font-medium text-gray-900">{submittedData?.company}</p>
                        </div>
                      </div>
                      {submittedData?.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm font-medium text-gray-900">{submittedData.phone}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Reason</p>
                          <p className="text-sm font-medium text-gray-900">{submittedData?.reason}</p>
                        </div>
                      </div>
                    </div>

                    {/* Admin info card */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-semibold text-amber-800 text-sm">Next Steps</p>
                          <p className="text-amber-700 text-sm mt-1">
                            An administrator will review your request. You&apos;ll receive an email with your login credentials once approved.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setStep('form')
                        setSubmittedData(null)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Submit another request
                    </button>
                  </div>
                )}

                {/* Back to login */}
                {step === 'form' ? (
                  <div className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link 
                      href="/login" 
                      className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors flex items-center justify-center gap-1 inline-flex"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Sign In
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6 text-center text-sm text-gray-600">
                    <Link 
                      href="/login" 
                      className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Back to Login
                    </Link>
                  </div>
                )}
              </div>

              {/* Security badge */}
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4 text-green-600" />
                <span>256-bit SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

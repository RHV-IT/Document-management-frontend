'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface IdleDetectorProps {
  children: React.ReactNode
  idleTimeout?: number // in milliseconds, default 15 minutes
}

// Generate deterministic particle positions
function generateParticle(index: number) {
  const seed = (index * 9301 + 49297) % 233280;
  const rnd = () => seed / 233280;
  
  return {
    x: `${(rnd() * 100).toFixed(2)}%`,
    y: `${(rnd() * 100).toFixed(2)}%`,
    delay: `${(rnd() * 5).toFixed(2)}s`,
    duration: `${5 + rnd() * 10}s`,
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

export function IdleDetector({ children, idleTimeout = 15 * 60 * 1000 }: IdleDetectorProps) {
  const [isIdle, setIsIdle] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [mounted, setMounted] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const particles = useParticles(20)

  // Mark as mounted after first render
  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now

    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }

    // If currently idle, immediately hide overlay and reset state
    if (isIdle || showOverlay) {
      setShowOverlay(false)
      setIsIdle(false)
    }

    // Set new timer for idle detection
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true)
      // Small delay before showing overlay for smooth transition
      setTimeout(() => {
        setShowOverlay(true)
      }, 100)
    }, idleTimeout)
  }, [idleTimeout, isIdle, showOverlay])

  useEffect(() => {
    // Don't start idle detection until component is mounted
    if (!mounted) return

    // Start the idle timer
    resetIdleTimer()

    // Event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'keydown', 'scroll', 'touchstart', 'click', 'wheel']

    const handleActivity = (event: Event) => {
      // Prevent unnecessary calls for repeated events
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current

      // Throttle to prevent excessive calls (except for important events like click)
      if (timeSinceLastActivity < 100 && event.type !== 'click' && event.type !== 'keydown') return

      // If overlay is showing, hide it immediately on any activity
      if (showOverlay) {
        setShowOverlay(false)
        setIsIdle(false)
        return
      }

      resetIdleTimer()
    }

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [resetIdleTimer, mounted, showOverlay])

  return (
    <div className="relative">
      {children}
      
      {/* Idle overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 transition-opacity duration-300"
        >
          {/* Floating animated shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Morphing blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-64 h-64 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full animate-blob" />
                <div 
                  className="w-64 h-64 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full animate-blob absolute top-0 left-0"
                  style={{ animationDelay: '2s' }}
                />
                <div 
                  className="w-64 h-64 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full animate-blob absolute top-0 left-0"
                  style={{ animationDelay: '4s' }}
                />
              </div>
            </div>

            {/* Floating particles */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-gradient-to-br from-blue-300/40 to-indigo-300/40 animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 10}s`,
                  width: `${4 + Math.random() * 8}px`,
                  height: `${4 + Math.random() * 8}px`,
                }}
              />
            ))}
          </div>

          {/* Center content */}
          <div className="relative z-10 text-center space-y-6 px-8">
            {/* Animated icon */}
            <div className="mx-auto w-24 h-24 relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-xl animate-pulse" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl animate-pulse-slow">
                <svg
                  className="w-12 h-12 text-white animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
                Paused for Inactivity
              </h2>
              <p className="text-gray-600 text-lg">
                Move your mouse or press any key to continue
              </p>
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>System waiting for activity...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

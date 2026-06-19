'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthContext } from '@/contexts/auth'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Clock, LogOut } from 'lucide-react'

interface IdleDetectorProps {
  children: React.ReactNode
  idleTimeout?: number
}

export function IdleDetector({ children, idleTimeout = 30 * 60 * 1000 }: IdleDetectorProps) {
  const { logout } = useAuthContext()
  const router = useRouter()
  const [sessionExpired, setSessionExpired] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef(Date.now())
  const isLoggingOut = useRef(false)

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const handleSessionExpired = useCallback(async () => {
    if (isLoggingOut.current) return
    isLoggingOut.current = true
    clearIdleTimer()

    await logout({
      skipRedirect: true,
      message: 'Your session expired because the page has been inactive for 30 minutes. Please log in again.',
    })

    setSessionExpired(true)
  }, [clearIdleTimer, logout])

  const resetIdleTimer = useCallback(() => {
    if (sessionExpired) return
    clearIdleTimer()
    lastActivityRef.current = Date.now()
    idleTimerRef.current = setTimeout(() => {
      void handleSessionExpired()
    }, idleTimeout)
  }, [clearIdleTimer, handleSessionExpired, idleTimeout, sessionExpired])

  useEffect(() => {
    if (sessionExpired) return

    resetIdleTimer()

    const events = ['mousedown', 'mousemove', 'keydown', 'keypress', 'scroll', 'touchstart', 'click', 'wheel']
    const handleActivity = () => {
      if (sessionExpired) return
      const now = Date.now()
      if (now - lastActivityRef.current < 100) return
      resetIdleTimer()
    }

    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }))

    return () => {
      clearIdleTimer()
      events.forEach((event) => window.removeEventListener(event, handleActivity))
    }
  }, [clearIdleTimer, resetIdleTimer, sessionExpired])

  return (
    <>
      {children}
      <AlertDialog open={sessionExpired}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Clock className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-center">Session expired</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your session expired because the page has been inactive for 30 minutes. Please log in again to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <Button onClick={() => router.push('/login')} className="gap-2">
              <LogOut className="h-4 w-4" />
              Log in again
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

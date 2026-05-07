'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { debug } from '@/lib/debug'
import { Button } from '@/components/ui/button'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  debug.render('HomePage', `isLoading=${isLoading}, isAuthenticated=${isAuthenticated}`)

  useEffect(() => {
    if (!isLoading) {
      debug.render('HomePage', `navigating: ${isAuthenticated ? 'to dashboard' : 'to login'}`)
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">

      <SkeletonLoader count={3} type="card" />
    </div>
  )
}

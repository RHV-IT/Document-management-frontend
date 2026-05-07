'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/auth'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { debug } from '@/lib/debug'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthContext()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  debug.render('DashboardLayout', `initial: isLoading=${isLoading}, isAuthenticated=${isAuthenticated}`)

  useEffect(() => {
    setMounted(true)
    debug.render('DashboardLayout', 'mounted to client')
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      debug.render('DashboardLayout', 'not authenticated, redirecting to login')
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router, mounted])

  useEffect(() => {
    const handleStorageChange = () => {
      if (!isAuthenticated) {
        router.push('/login')
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isAuthenticated, router])

  if (!mounted || isLoading) {
    debug.render('DashboardLayout', 'loading state')
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-sidebar border-r p-4 space-y-4">
          <SkeletonLoader count={1} type="circle" />
          <SkeletonLoader count={5} type="text" />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b p-4">
            <SkeletonLoader count={1} type="text" />
          </div>
          <div className="flex-1 p-6">
            <SkeletonLoader count={3} type="card" />
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    debug.render('DashboardLayout', 'not authenticated, showing null')
    return null
  }

  debug.render('DashboardLayout', 'rendering dashboard')
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

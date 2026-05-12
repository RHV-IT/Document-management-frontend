'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthContext } from '@/contexts/auth'
import { useScannerAgentDetection } from '@/hooks/useScannerAgentDetection'
import { ScannerAgentModal } from '@/components/scanner/ScannerAgentModal'
import { addNotification } from '@/components/notifications/NotificationCenter'

export function ScannerAgentFlow() {
  const { isAuthenticated } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  const { isConnected, isChecking, checkHealth, reset } = useScannerAgentDetection()
  const [showModal, setShowModal] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  const isOnDashboard = pathname?.startsWith('/dashboard')

  // Check if agent setup is already complete
  const isSetupComplete = typeof window !== 'undefined' && localStorage.getItem('scanner_agent_setup_complete') === 'true'

  useEffect(() => {
    if (!isAuthenticated || hasChecked) return

    // Skip check if we're already on dashboard (means we've already checked)
    if (isOnDashboard) {
      setHasChecked(true)
      return
    }

    // Skip check if agent setup is already complete
    if (isSetupComplete) {
      setHasChecked(true)
      return
    }

    const performCheck = async () => {
      try {
        await checkHealth()
        setHasChecked(true)
      } catch (error) {
        console.warn('Initial scanner agent check failed:', error)
        setHasChecked(true)
      }
    }

    performCheck()
  }, [isAuthenticated, checkHealth, hasChecked, isOnDashboard, isSetupComplete])

  useEffect(() => {
    if (!hasChecked) return

    if (isConnected || isSetupComplete) {
      // Agent is connected or setup is complete, close modal
      setShowModal(false)
      if (isConnected && !isOnDashboard) {
        addNotification('success', 'Scanner Agent Connected', 'Your scanner agent is running and ready to use.')
        router.push('/dashboard')
      }
    } else if (!isChecking) {
      // Agent is not connected and not currently checking, show modal
      // But don't show modal if we're already on dashboard pages
      if (!isOnDashboard) {
        setShowModal(true)
      }
    }
  }, [isConnected, isChecking, hasChecked, router, isOnDashboard, isSetupComplete, pathname])

  const handleAgentDetected = () => {
    setShowModal(false)
    addNotification('success', 'Scanner Agent Connected', 'Your scanner agent is now running and connected.')
    // Redirect to dashboard after agent is detected
    router.push('/dashboard')
  }

  const handleRetry = async () => {
    reset()
    setHasChecked(false)
    try {
      await checkHealth()
    } catch (error) {
      console.warn('Retry scanner agent check failed:', error)
    }
  }

  // Don't render anything if user is not authenticated or already on dashboard
  if (!isAuthenticated || isOnDashboard) return null

  return (
    <ScannerAgentModal
      isOpen={showModal}
      onAgentDetected={handleAgentDetected}
      onRetry={handleRetry}
    />
  )
}
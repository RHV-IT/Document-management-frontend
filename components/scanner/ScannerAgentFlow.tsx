'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/auth'
import { useScannerAgentDetection } from '@/hooks/useScannerAgentDetection'
import { ScannerAgentModal } from '@/components/scanner/ScannerAgentModal'
import { addNotification } from '@/components/notifications/NotificationCenter'

export function ScannerAgentFlow() {
  const { isAuthenticated } = useAuthContext()
  const router = useRouter()
  const { isConnected, isChecking, checkHealth, reset } = useScannerAgentDetection()
  const [showModal, setShowModal] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || hasChecked) return

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
  }, [isAuthenticated, checkHealth, hasChecked])

  useEffect(() => {
    if (!hasChecked) return

    if (isConnected) {
      // Agent is connected, show success notification and redirect
      addNotification('success', 'Scanner Agent Connected', 'Your scanner agent is running and ready to use.')
      setShowModal(false)
      router.push('/dashboard')
    } else if (!isChecking) {
      // Agent is not connected and not currently checking, show modal
      setShowModal(true)
    }
  }, [isConnected, isChecking, hasChecked, router])

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

  // Don't render anything if user is not authenticated
  if (!isAuthenticated) return null

  return (
    <ScannerAgentModal
      isOpen={showModal}
      onAgentDetected={handleAgentDetected}
      onRetry={handleRetry}
    />
  )
}
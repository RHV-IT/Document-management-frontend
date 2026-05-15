'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/auth'
import { useScannerAgentDetection } from '@/hooks/useScannerAgentDetection'
import { ScannerAgentModal } from '@/components/scanner/ScannerAgentModal'

export function AgentEnforcement() {
  const { isAuthenticated } = useAuthContext()
  const { isConnected, isChecking, checkHealth } = useScannerAgentDetection()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return

    // Check agent health every 30 seconds
    const interval = setInterval(async () => {
      try {
        await checkHealth()
      } catch (error) {
        // Silently handle errors to avoid spamming
        console.debug('Agent health check failed:', error)
      }
    }, 30000)

    // Initial check
    checkHealth().catch(error => {
      console.debug('Initial agent health check failed:', error)
    })

    return () => clearInterval(interval)
  }, [isAuthenticated, checkHealth])

  useEffect(() => {
    // Show modal if not connected and not checking
    if (isAuthenticated && !isConnected && !isChecking) {
      setShowModal(true)
    } else if (isConnected) {
      setShowModal(false)
    }
  }, [isConnected, isChecking, isAuthenticated])

  const handleAgentDetected = () => {
    setShowModal(false)
  }

  const handleRetry = async () => {
    try {
      await checkHealth()
    } catch (error) {
      console.debug('Retry agent health check failed:', error)
    }
  }

  if (!isAuthenticated || isConnected) return null

  return (
    <ScannerAgentModal
      isOpen={showModal}
      onAgentDetected={handleAgentDetected}
      onRetry={handleRetry}
    />
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/auth'
import { useScannerAgentDetection } from '@/hooks/useScannerAgentDetection'
import { ScannerAgentModal } from '@/components/scanner/ScannerAgentModal'

export function AgentEnforcement() {
  const { isAuthenticated } = useAuthContext()
  const { isConnected, isChecking, checkHealth, healthSuccess, setTokenSuccess, agentConnected, mustDownloadAgent } = useScannerAgentDetection()
  const [showModal, setShowModal] = useState(false)

  const shouldShowAgentDialog =
    !agentConnected ||
    mustDownloadAgent ||
    !healthSuccess ||
    !setTokenSuccess

  const isSetupComplete = typeof window !== 'undefined' && (localStorage.getItem('scanner_agent_setup_complete') === 'true' || localStorage.getItem('agentConnected') === 'true')

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
    // Show modal ONLY if health/set-token fail (per spec). Hide automatically if healthy or local success
    if (isAuthenticated && shouldShowAgentDialog && !isSetupComplete && !isConnected && !isChecking) {
      setShowModal(true)
    } else if (isConnected || isSetupComplete || healthSuccess || setTokenSuccess) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('agentConnected', 'true')
      }
      setShowModal(false)
    }
  }, [isConnected, isChecking, isAuthenticated, shouldShowAgentDialog, isSetupComplete, healthSuccess, setTokenSuccess])

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

  if (!isAuthenticated || isConnected || isSetupComplete || !shouldShowAgentDialog) return null

  return (
    <ScannerAgentModal
      isOpen={showModal}
      onAgentDetected={handleAgentDetected}
      onRetry={handleRetry}
    />
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/auth'
import { useScannerAgentDetection } from '@/hooks/useScannerAgentDetection'
import { ScannerAgentModal } from '@/components/scanner/ScannerAgentModal'

export function AgentEnforcement() {
  const { isAuthenticated } = useAuthContext()
  const { isConnected, isChecking, checkHealth, healthSuccess, setTokenSuccess, agentConnected, mustDownloadAgent } = useScannerAgentDetection()
  const [showModal, setShowModal] = useState(false)

  const isSetupComplete = typeof window !== 'undefined' && (localStorage.getItem('scanner_agent_setup_complete') === 'true' || localStorage.getItem('agentConnected') === 'true')

  // Prioritize LIVE health: if healthy, NEVER show dialog
  const shouldShowAgentDialog = isAuthenticated && !isConnected && !healthSuccess && mustDownloadAgent && !isSetupComplete

  useEffect(() => {
    if (!isAuthenticated) return

    // Check agent health every 30 seconds
    const interval = setInterval(async () => {
      try {
        await checkHealth()
      } catch (error) {
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
    // Close immediately if health succeeds (live check overrides stale mustDownloadAgent)
    if (healthSuccess || isConnected || isSetupComplete) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('agentConnected', 'true')
      }
      setShowModal(false)
    } else if (isAuthenticated && shouldShowAgentDialog && !isChecking) {
      setShowModal(true)
    }
  }, [isConnected, isChecking, isAuthenticated, shouldShowAgentDialog, isSetupComplete, healthSuccess])

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

  if (!isAuthenticated || isConnected || isSetupComplete || healthSuccess) return null

  return (
    <ScannerAgentModal
      isOpen={showModal}
      onAgentDetected={handleAgentDetected}
      onRetry={handleRetry}
    />
  )
}
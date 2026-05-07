'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/auth'
import { PasswordChangeDialog } from '@/components/tutorial/PasswordChangeDialog'
import { FirstLoginTutorial } from '@/components/tutorial/FirstLoginTutorial'
import { FirstLoginPasswordPrompt } from './FirstLoginPasswordPrompt'
import { ScannerAgentSetupPrompt } from './ScannerAgentSetupPrompt'

type OnboardingPhase = 'password-prompt' | 'change-password' | 'tutorial' | 'scanner-setup' | 'completed'

interface OnboardingFlowProps {
  isFirstLogin: boolean
  onComplete: () => void
}

export function OnboardingFlow({ isFirstLogin, onComplete }: OnboardingFlowProps) {
  const { incrementLoginCount } = useAuthContext()
  const [phase, setPhase] = useState<OnboardingPhase>('password-prompt')

  // Reset when component mounts or when isFirstLogin becomes true
  useEffect(() => {
    if (isFirstLogin) {
      setPhase('password-prompt')
    }
  }, [isFirstLogin])

  // Handle completing the entire flow
  const handleComplete = () => {
    incrementLoginCount()
    setPhase('completed')
    onComplete()
  }

  // Handle password prompt response
  const handlePasswordPromptClose = (changePassword: boolean) => {
    if (changePassword) {
      setPhase('change-password')
    } else {
      setPhase('tutorial')
    }
  }

  // Handle successful password change
  const handlePasswordChangeSuccess = () => {
    setPhase('tutorial')
  }

  // Handle tutorial completion - move to scanner setup
  const handleTutorialComplete = () => {
    setPhase('scanner-setup')
  }

  // If not first login or completed, don't render anything
  if (!isFirstLogin || phase === 'completed') {
    return null
  }

  return (
    <>
      {/* Phase 1: Ask if user wants to change password */}
      {phase === 'password-prompt' && (
        <FirstLoginPasswordPrompt
          isOpen={true}
          onClose={handlePasswordPromptClose}
        />
      )}

      {/* Phase 2: Show password change form */}
      {phase === 'change-password' && (
        <PasswordChangeDialog
          isOpen={true}
          onClose={() => setPhase('tutorial')}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}

      {/* Phase 3: Show tutorial */}
      {phase === 'tutorial' && (
        <FirstLoginTutorial
          isOpen={true}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialComplete}
        />
      )}

      {/* Phase 4: Scanner Agent Setup */}
      {phase === 'scanner-setup' && (
        <ScannerAgentSetupPrompt
          isOpen={true}
          onComplete={handleComplete}
          onSkip={handleComplete}
        />
      )}
    </>
  )
}

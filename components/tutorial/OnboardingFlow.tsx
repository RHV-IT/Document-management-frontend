'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/auth'
import { PasswordChangeDialog } from '@/components/tutorial/PasswordChangeDialog'
import { FirstLoginTutorial } from '@/components/tutorial/FirstLoginTutorial'
import { FirstLoginPasswordPrompt } from './FirstLoginPasswordPrompt'

type OnboardingPhase = 'tutorial' | 'password-choice' | 'password-form' | 'completed'

interface OnboardingFlowProps {
  isFirstLogin: boolean
  onComplete: () => void
}

export function OnboardingFlow({ isFirstLogin, onComplete }: OnboardingFlowProps) {
  const { incrementLoginCount } = useAuthContext()
  const [phase, setPhase] = useState<OnboardingPhase>('tutorial')
  const [sessionCompleted, setSessionCompleted] = useState(false)

  // Session guard to never reopen in same session even if count not yet persisted
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionFlag = localStorage.getItem('onboardingSessionCompleted')
      if (sessionFlag) setSessionCompleted(true)
    }
  }, [])

  useEffect(() => {
    if (isFirstLogin && !sessionCompleted) {
      setPhase('tutorial')
    }
  }, [isFirstLogin, sessionCompleted])

  const markSessionComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboardingSessionCompleted', Date.now().toString())
    }
    setSessionCompleted(true)
  }

  const completeOnboarding = () => {
    incrementLoginCount()
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboardingCompleted', 'true')
    }
    markSessionComplete()
    setPhase('completed')
    onComplete()
  }

  // Tutorial done -> show professional change password choice
  const handleTutorialComplete = () => {
    setPhase('password-choice')
  }

  // From choice: later = complete all and unlock forever (for count)
  // change = open the secure form
  const handlePasswordChoice = (wantsToChange: boolean) => {
    if (wantsToChange) {
      setPhase('password-form')
    } else {
      // I Will Do This Later: close everything, unlock dashboard, no overlay, no auto reopen same session
      completeOnboarding()
    }
  }

  const handlePasswordFormClose = () => {
    completeOnboarding()
  }

  const handlePasswordFormSuccess = () => {
    completeOnboarding()
  }

  if (!isFirstLogin || phase === 'completed' || sessionCompleted) {
    return null
  }

  return (
    <>
      {/* STEP 1: Welcome Tutorial Modal - Professional fullscreen style, non-technical explanations, PDF guide generator, NO skip */}
      {phase === 'tutorial' && (
        <FirstLoginTutorial
          isOpen={true}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialComplete}
        />
      )}

      {/* STEP 2a: Change Password choice - modern centered professional modal */}
      {phase === 'password-choice' && (
        <FirstLoginPasswordPrompt
          isOpen={true}
          onClose={handlePasswordChoice}
        />
      )}

      {/* STEP 2b: Actual secure Change Password form (when user chooses to change now) */}
      {phase === 'password-form' && (
        <PasswordChangeDialog
          isOpen={true}
          onClose={handlePasswordFormClose}
          onSuccess={handlePasswordFormSuccess}
        />
      )}
    </>
  )
}

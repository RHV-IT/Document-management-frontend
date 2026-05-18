import { useState, useEffect, useCallback } from 'react'
import { agentService, AgentHealthResponse } from '@/services/agent'

export interface ScannerAgentState {
  isChecking: boolean
  isConnected: boolean
  health: AgentHealthResponse | null
  error: string | null
}

export function useScannerAgentDetection() {
  const [state, setState] = useState<ScannerAgentState>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('agentConnected') === 'true'
      return {
        isChecking: false,
        isConnected: cached,
        health: null,
        error: null,
      }
    }
    return {
      isChecking: false,
      isConnected: false,
      health: null,
      error: null,
    }
  })

  const checkHealth = useCallback(async (): Promise<AgentHealthResponse> => {
    setState(prev => ({ ...prev, isChecking: true, error: null }))

    try {
      const health = await agentService.getHealth()
      const isConnected = health.running || health.installed // Consider connected if either running or installed

      if (isConnected && typeof window !== 'undefined') {
        localStorage.setItem('agentConnected', 'true')
      }

      setState({
        isChecking: false,
        isConnected,
        health,
        error: null,
      })

      return health
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState({
        isChecking: false,
        isConnected: false,
        health: null,
        error: errorMessage,
      })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isChecking: false,
      isConnected: false,
      health: null,
      error: null,
    })
  }, [])

  return {
    ...state,
    checkHealth,
    reset,
  }
}
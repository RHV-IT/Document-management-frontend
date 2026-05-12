// Direct browser-to-agent communication on user's local machine
const getAgentUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:4001'
  // Always use localhost for scanner agent communication
  return 'http://localhost:4001'
}
const AGENT_LOCAL_URL = getAgentUrl()

export interface AgentSetTokenRequest {
  token: string | null
  userId: string | null
  machineId: string | null
}

export interface AgentDeleteFileRequest {
  filePath: string
}

export interface AgentStatusResponse {
  status: string
  version?: string
  connected?: boolean
}

export interface AgentHealthResponse {
  installed: boolean
  running: boolean
  version: string
  machineId: string
}

export const agentService = {
  setToken: async (request: AgentSetTokenRequest): Promise<{ success: boolean }> => {
    // Browser-only: send directly to user's local agent
    if (typeof window === 'undefined') {
      console.warn('setToken called on server - skipping')
      return { success: true } // Allow SSR to pass
    }

    // Try localhost first, then current hostname as fallback
    const urls = [
      'http://localhost:4001/set-token',
      `http://${window.location.hostname}:4001/set-token`
    ]

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
        if (response.ok) {
          return { success: true }
        }
      } catch (error) {
        // Continue to next URL
      }
    }

    console.warn('Scanner Agent not running on this machine (tried multiple URLs)')
    // Don't throw - agent being offline is acceptable
    return { success: false }
  },

  deleteFile: async (request: AgentDeleteFileRequest): Promise<{ success: boolean }> => {
    if (typeof window === 'undefined') {
      return { success: true }
    }
    try {
      const response = await fetch(`${AGENT_LOCAL_URL}/delete-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
      if (!response.ok) {
        throw new Error('Failed to delete file')
      }
      return { success: true }
    } catch (error) {
      console.warn('Scanner Agent not running:', error)
      return { success: false }
    }
  },

  getStatus: async (): Promise<AgentStatusResponse> => {
    if (typeof window === 'undefined') {
      return { status: 'offline', connected: false }
    }
    try {
      const response = await fetch(`${AGENT_LOCAL_URL}/status`)
      if (!response.ok) {
        throw new Error('Failed to get status')
      }
      return await response.json()
    } catch (error) {
      console.warn('Scanner Agent not running:', error)
      return { status: 'offline', connected: false }
    }
  },

  getHealth: async (): Promise<AgentHealthResponse> => {
    if (typeof window === 'undefined') {
      return { installed: false, running: false, version: '', machineId: '' }
    }
    // Try localhost first, then current hostname as fallback
    const urls = [
      'http://localhost:4001/health',
      `http://${window.location.hostname}:4001/health`
    ]

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })
        if (response.ok) {
          try {
            const data = await response.json()

            // Handle different response formats
            if (data && typeof data === 'object' && data.status === 'okay') {
              return {
                installed: true,
                running: true,
                version: '1.0.0',
                machineId: 'localhost'
              }
            } else if (typeof data === 'string' && data === 'okay') {
              return {
                installed: true,
                running: true,
                version: '1.0.0',
                machineId: 'localhost'
              }
            } else if (data && typeof data === 'object' && typeof data.running === 'boolean') {
              return data
            }

            return { installed: false, running: false, version: '', machineId: '' }
          } catch (parseError) {
            // If JSON parsing fails, try to read as text
            try {
              const text = await response.text()
              if (text && (text.trim() === 'okay' || text.includes('okay'))) {
                return {
                  installed: true,
                  running: true,
                  version: '1.0.0',
                  machineId: 'localhost'
                }
              }
            } catch (textError) {
              // Ignore
            }
            return { installed: false, running: false, version: '', machineId: '' }
          }
        }
      } catch (error) {
        // Continue to next URL
      }
    }

    console.warn('Scanner Agent not running on any available URL')
    return { installed: false, running: false, version: '', machineId: '' }
  },
}
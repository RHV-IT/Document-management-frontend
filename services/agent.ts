// Direct browser-to-agent communication on user's local machine
const getAgentUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:4001'
  return `http://${window.location.hostname}:4001`
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

    try {
      const response = await fetch(`${AGENT_LOCAL_URL}/set-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
      if (!response.ok) {
        throw new Error('Failed to set token')
      }
      return { success: true }
    } catch (error) {
      console.warn('Scanner Agent not running on this machine:', error)
      // Don't throw - agent being offline is acceptable
      return { success: false }
    }
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
    // Try current hostname first, then localhost as fallback
    const urls = [
      `http://${window.location.hostname}:4001/health`,
      'http://localhost:4001/health'
    ]

    for (const url of urls) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        // Continue to next URL
      }
    }

    console.warn('Scanner Agent not running on any available URL')
    return { installed: false, running: false, version: '', machineId: '' }
  },
}
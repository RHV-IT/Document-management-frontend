import { getMachineId } from './utils'

// URL of the scanner agent running on the user's local machine
const AGENT_LOCAL_URL = 'http://localhost:4001'

interface AgentTokenPayload {
  token: string | null
  userId: string | null
  machineId: string | null
}

async function syncToAgent(payload: AgentTokenPayload): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    const response = await fetch(`${AGENT_LOCAL_URL}/set-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function syncTokenToAgent(): Promise<{ success: boolean; agentRunning: boolean }> {
  if (typeof window === 'undefined') {
    return { success: false, agentRunning: false }
  }

  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId')
  const machineId = getMachineId()

  if (!token || !userId) {
    return { success: false, agentRunning: false }
  }

  const success = await syncToAgent({ token, userId, machineId })
  return { success, agentRunning: success }
}

export async function clearAgentToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const machineId = getMachineId()
  const success = await syncToAgent({ token: null, userId: null, machineId })
  return success
}

export async function checkAgentStatus(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    const response = await fetch(`${AGENT_LOCAL_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}
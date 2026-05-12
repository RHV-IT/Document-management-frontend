export interface MachineInfo {
  machineId: string
  machineName: string
  hostname: string
  platform: string
  browser: string
  browserVersion: string
  source: 'web'
  deviceType?: string
}

const MACHINE_STORAGE_KEY = 'dms_machine_info'

function generateMachineId(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback: generate a UUID-like string using Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function getMachineInfo(): MachineInfo {
  // Try to get from localStorage first
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(MACHINE_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to read machine info from localStorage:', error)
    }
  }

  // Generate new machine info
  const machineInfo: MachineInfo = {
    machineId: generateMachineId(),
    machineName: generateMachineName(),
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
    browser: detectBrowser(),
    browserVersion: detectBrowserVersion(),
    source: 'web',
    deviceType: detectDeviceType(),
  }

  // Store in localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MACHINE_STORAGE_KEY, JSON.stringify(machineInfo))
    } catch (error) {
      console.warn('Failed to store machine info in localStorage:', error)
    }
  }

  return machineInfo
}

function generateMachineName(): string {
  const adjectives = ['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Gray', 'Black', 'White']
  const nouns = ['Falcon', 'Eagle', 'Tiger', 'Lion', 'Wolf', 'Bear', 'Shark', 'Dragon', 'Phoenix', 'Unicorn']

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 9999) + 1000

  return `${adjective}${noun}${number}`
}

export function updateMachineName(newName: string): void {
  if (typeof window === 'undefined') return

  try {
    const currentInfo = getMachineInfo()
    const updatedInfo = { ...currentInfo, machineName: newName }
    localStorage.setItem(MACHINE_STORAGE_KEY, JSON.stringify(updatedInfo))
  } catch (error) {
    console.warn('Failed to update machine name:', error)
  }
}

function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'unknown'

  const ua = navigator.userAgent

  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera'

  return 'unknown'
}

function detectBrowserVersion(): string {
  if (typeof navigator === 'undefined') return 'unknown'

  const ua = navigator.userAgent

  // Simple regex to extract version
  const match = ua.match(/(Chrome|Firefox|Safari|Edg|OPR|Opera)\/(\d+)/)
  if (match) return match[2]

  return 'unknown'
}

function detectDeviceType(): string {
  if (typeof navigator === 'undefined') return 'unknown'

  const ua = navigator.userAgent

  if (ua.includes('Mobile')) return 'mobile'
  if (ua.includes('Tablet')) return 'tablet'

  return 'desktop'
}
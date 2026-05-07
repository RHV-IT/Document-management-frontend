/**
 * Simple debug utility - replaced with direct console calls
 * Use these helpers to maintain consistent logging format
 */

const LOG_PREFIX = '[DMS Debug]'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function formatMessage(level: LogLevel, ...args: any[]): string {
  const timestamp = new Date().toISOString()
  return `${timestamp} ${LOG_PREFIX} [${level.toUpperCase()}] ${args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ')}`
}

// Check if debug logging is enabled
const shouldLog = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_LOG_LEVEL === 'debug'

// Individual log functions
function logDebug(...args: any[]) {
  if (shouldLog) console.log(formatMessage('debug', ...args))
}

function logInfo(...args: any[]) {
  if (shouldLog) console.info(formatMessage('info', ...args))
}

function logWarn(...args: any[]) {
  if (shouldLog) console.warn(formatMessage('warn', ...args))
}

function logError(...args: any[]) {
  if (shouldLog) console.error(formatMessage('error', ...args))
}

// Convenience wrappers
export const debug = {
  log: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
  auth: (action: string, data?: any) => logInfo(`Auth: ${action}`, data || ''),
  api: (method: string, url: string, status?: number, error?: any) => {
    const msg = `API: ${method} ${url}` + (status !== undefined ? ` → ${status}` : '') + (error ? ` | Error: ${error}` : '')
    logInfo(msg)
  },
  render: (component: string, reason?: string | object) => {
    const msg = typeof reason === 'object' ? `Render: ${component}` + JSON.stringify(reason) : `Render: ${component} ${reason || ''}`
    logDebug(msg)
  },
}

// Initialize
if (shouldLog) {
  logInfo('Logger initialized')
  logInfo('Environment:', process.env.NODE_ENV)
  logInfo('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL)
}

'use client'

import { useScannerAgentDetection } from '@/hooks/useScannerAgentDetection'

interface ScannerStatusProps {
  collapsed?: boolean
}

export function ScannerStatus({ collapsed = false }: ScannerStatusProps) {
  const { isConnected, isChecking } = useScannerAgentDetection()

  const statusColor = isChecking ? 'bg-yellow-500' : isConnected ? 'bg-emerald-500' : 'bg-red-500'
  const label = isChecking ? 'Waiting' : isConnected ? 'Connected' : 'Offline'

  if (collapsed) {
    return (
      <div className="flex justify-center py-1" title={label}>
        <div className={`w-2.5 h-2.5 rounded-full ${statusColor} ${isChecking ? 'animate-pulse' : ''}`} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
      <div className={`w-2 h-2 rounded-full ${statusColor} ${isChecking ? 'animate-pulse' : ''}`} />
      <span className="font-medium">{label}</span>
    </div>
  )
}

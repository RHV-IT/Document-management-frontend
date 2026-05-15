'use client'

import { useScannerAgentDetection } from '@/hooks/useScannerAgentDetection'

export function ScannerStatus() {
  const { isConnected, isChecking } = useScannerAgentDetection()

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        <span>Waiting for Agent</span>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span>Connected</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="w-2 h-2 rounded-full bg-red-500" />
      <span>Not Connected</span>
    </div>
  )
}
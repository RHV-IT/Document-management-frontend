'use client'

import { useAgentStatusQuery } from '@/hooks/useAgent'

export function ScannerStatus() {
  const { data, isError } = useAgentStatusQuery()

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span>Scanner not connected</span>
      </div>
    )
  }

  if (data?.connected) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>Scanner ready</span>
      </div>
    )
  }

  return null
}
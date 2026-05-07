'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePendingScans } from '@/hooks/useScanner'
import { useConfirmScan, useCancelScan } from '@/hooks/useScannerActions'
import { useSyncAgentToken } from '@/hooks/useAgent'
import { useAuthContext } from '@/contexts/auth'
import { ScannerModal } from '@/components/ScannerModal'
import type { PendingScan } from '@/services/scanner'

function ScannerListenerContent() {
  const { user } = useAuthContext()
  const syncToken = useSyncAgentToken()
  const { data: pendingScans = [], isLoading } = usePendingScans()
  const confirmScan = useConfirmScan()
  const cancelScan = useCancelScan()

  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const [currentScan, setCurrentScan] = useState<PendingScan | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const processedIdsRef = useRef<Set<string>>(new Set())
  const initialSyncDoneRef = useRef(false)

  const syncAgentToken = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId')
    
    if (token && userId) {
      syncToken.mutate({ token, userId })
    }
  }, [syncToken])

  useEffect(() => {
    if (!initialSyncDoneRef.current && (user?.id || user?._id)) {
      initialSyncDoneRef.current = true
      syncAgentToken()
    }
  }, [user, syncAgentToken])

  const detectNewScans = useCallback(() => {
    if (!pendingScans.length) return

    for (const scan of pendingScans) {
      if (!processedIdsRef.current.has(scan.id)) {
        processedIdsRef.current.add(scan.id)
        setSeenIds((prev) => new Set(prev).add(scan.id))
        setCurrentScan(scan)
        setModalOpen(true)
        break
      }
    }
  }, [pendingScans])

  useEffect(() => {
    if (!isLoading && pendingScans.length > 0) {
      detectNewScans()
    }
  }, [pendingScans, isLoading, detectNewScans])

  const handleOpenChange = (open: boolean) => {
    setModalOpen(open)
    if (!open) {
      setCurrentScan(null)
    }
  }

  const handleConfirm = (data: {
    id: string
    alias: string
    confidentialityLevel: string
    description: string
    format: string
  }) => {
    confirmScan.mutate(data, {
      onSuccess: () => {
        setModalOpen(false)
        setCurrentScan(null)
      },
    })
  }

  const handleCancel = (id: string) => {
    cancelScan.mutate(id, {
      onSuccess: () => {
        setModalOpen(false)
        setCurrentScan(null)
      },
    })
  }

  return (
    <ScannerModal
      open={modalOpen}
      onOpenChange={handleOpenChange}
      scan={currentScan}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      isConfirming={confirmScan.isPending}
      isCancelling={cancelScan.isPending}
    />
  )
}

export function ScannerListener() {
  const { isAuthenticated } = useAuthContext()

  if (typeof window === 'undefined') return null

  if (!isAuthenticated) return null

  return <ScannerListenerContent />
}
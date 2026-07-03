'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScanLine, X, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { formatBytes } from '@/lib/utils'
import type { PendingScan } from '@/hooks/useScanner'

interface PendingScansViewProps {
  scans: PendingScan[]
  onReview: (scan: PendingScan) => void
  onCancel: (scan: PendingScan) => void
  isMutating?: boolean
}

const STATUS_LABEL: Record<PendingScan['status'], string> = {
  pending: 'Pending Review',
  confirming: 'Confirming',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  failed: 'Failed',
}

export function PendingScansView({ scans, onReview, onCancel, isMutating }: PendingScansViewProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead className="sticky top-0 bg-card z-10 border-b">
        <tr>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Name</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Department</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Size</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Scanned</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Status</th>
          <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {scans.map((scan) => (
          <tr key={scan.id} className="border-b border-border/40 hover:bg-accent/40 transition-colors">
            <td className="px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <ScanLine className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate font-medium">{scan.originalName || scan.fileName}</span>
              </div>
            </td>
            <td className="px-3 py-2 text-muted-foreground truncate">{scan.department || '—'}</td>
            <td className="px-3 py-2 text-muted-foreground">{formatBytes(scan.fileSize)}</td>
            <td className="px-3 py-2 text-muted-foreground">
              {scan.createdAt ? `${formatDistanceToNow(new Date(scan.createdAt))} ago` : '—'}
            </td>
            <td className="px-3 py-2">
              <Badge variant="outline" className="text-[10px]">
                {STATUS_LABEL[scan.status] || scan.status}
              </Badge>
            </td>
            <td className="px-3 py-2">
              <div className="flex items-center justify-end gap-1.5">
                <Button variant="outline" size="sm" className="h-7 gap-1.5" disabled={isMutating} onClick={() => onReview(scan)}>
                  <Eye className="h-3.5 w-3.5" />
                  Review
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isMutating}
                  onClick={() => onCancel(scan)}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default PendingScansView

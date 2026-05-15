// File status utilities for scanner workflow
export function getFileStatusInfo(status: string) {
  const statusMap: Record<string, { label: string; color: string; icon: string; description: string }> = {
    pending: {
      label: 'Waiting for confirmation',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: '⏳',
      description: 'Document scanned and waiting for your review'
    },
    confirming: {
      label: 'Uploading',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '⬆️',
      description: 'Document is being uploaded to your files'
    },
    confirmed: {
      label: 'Uploaded successfully',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅',
      description: 'Document has been saved successfully'
    },
    cancelled: {
      label: 'Upload cancelled',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '❌',
      description: 'Upload was cancelled by user'
    },
    failed: {
      label: 'Upload failed',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '⚠️',
      description: 'Upload failed - please try again'
    }
  }

  return statusMap[status] || {
    label: 'Unknown status',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '❓',
    description: 'Status unknown'
  }
}

export function getFileStatusBadge(status: string) {
  const info = getFileStatusInfo(status)
  return {
    label: info.label,
    className: `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${info.color}`,
    icon: info.icon
  }
}
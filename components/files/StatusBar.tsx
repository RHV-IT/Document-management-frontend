'use client'

import React from 'react'
import { Separator } from '@/components/ui/separator'
import { formatBytes } from '@/lib/utils'
import { ViewMode } from './Toolbar'

interface StatusBarProps {
    folderCount: number
    fileCount: number
    totalSize: number
    selectedCount: number
    viewMode: ViewMode
}

const VIEW_LABELS: Record<ViewMode, string> = {
    grid: 'Large Icons',
    list: 'List',
    details: 'Details',
}

export function StatusBar({ folderCount, fileCount, totalSize, selectedCount, viewMode }: StatusBarProps) {
    const totalItems = folderCount + fileCount
    return (
        <div className="border-t bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4">
                    <span>{totalItems} item{totalItems === 1 ? '' : 's'}</span>
                    <span>
                        {folderCount} folder{folderCount === 1 ? '' : 's'}
                    </span>
                    <span>
                        {fileCount} file{fileCount === 1 ? '' : 's'}
                    </span>
                    {selectedCount > 0 && (
                        <>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="font-medium text-foreground">Selected: {selectedCount}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <span>Size: {formatBytes(totalSize)}</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>Current View: {VIEW_LABELS[viewMode]}</span>
                </div>
            </div>
        </div>
    )
}
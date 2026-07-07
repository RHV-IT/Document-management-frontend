'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    File,
    Folder,
    User,
    Building2,
    Calendar,
    Shield,
    Eye,
    Download,
    Share2,
    Copy,
    Move,
    Trash2,
    Tag,
    ScanLine,
    History,
} from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { FileItem } from '@/services/api/files'
import { FolderItem } from '@/services/api/folders'
import { getFileIconElement, getConfidentialityLabel, getConfidentialityColor, getDepartmentName } from '@/lib/file-utils'

type SelectedItem = ({ _type: 'file' } & FileItem) | ({ _type: 'folder' } & FolderItem) | null

interface PropertiesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: SelectedItem
    onPreview: () => void
    onDownload: () => void
    onShare: () => void
    onCopy: () => void
    onMove: () => void
    onDelete: () => void
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '—'
    try {
        return new Date(dateStr).toLocaleString()
    } catch {
        return '—'
    }
}

export function PropertiesDialog({ open, onOpenChange, item, onPreview, onDownload, onShare, onCopy, onMove, onDelete }: PropertiesDialogProps) {
    if (!item) return null
    const isFile = item._type === 'file'
    const file = isFile ? (item as FileItem) : null
    const folder = !isFile ? (item as FolderItem) : null
    const isRestricted = isFile && file?.restricted === true

    const name = isFile ? file!.alias || file!.name : folder!.name
    const confidentiality = isFile ? file!.confidentialityLevel : folder?.confidentialityLevel
    const owner = isFile
      ? file!.owner?.name || file!.uploadedBy?.name
      : typeof folder?.createdBy === 'object'
        ? folder.createdBy?.name
        : undefined
    const department = getDepartmentName(isFile ? file!.department : folder?.department)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b bg-muted/30">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        {isFile ? getFileIconElement(file!, 'h-5 w-5') : <Folder className="h-5 w-5 text-amber-500" />}
                        <span className="truncate">{name}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Type</p>
                            <p className="font-medium">{isFile ? file!.type || 'File' : 'Folder'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Size</p>
                            <p className="font-medium">
                                {isFile ? formatBytes(file!.size) : folder?.stats ? formatBytes(folder.stats.totalSize) : '—'}
                            </p>
                        </div>
                    </div>

                    {!isFile && folder?.stats && (
                        <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contents</p>
                            <p className="font-medium">
                                {folder.stats.totalFolders} {folder.stats.totalFolders === 1 ? 'folder' : 'folders'}, {folder.stats.totalFiles} {folder.stats.totalFiles === 1 ? 'file' : 'files'}
                            </p>
                        </div>
                    )}

                    {isFile && file!.currentVersion && (
                        <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Version</p>
                            <p className="font-medium flex items-center gap-1">
                                <History className="h-3.5 w-3.5 text-muted-foreground" />v{file!.currentVersion}
                            </p>
                        </div>
                    )}

                    {confidentiality && (
                        <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Confidentiality</p>
                            <Badge className={cn('max-w-full truncate', getConfidentialityColor(confidentiality))} title={getConfidentialityLabel(confidentiality)}>
                                <Shield className="h-2.5 w-2.5 mr-1.5 shrink-0" />
                                {getConfidentialityLabel(confidentiality)}
                            </Badge>
                        </div>
                    )}

                    {department && department !== '-' && (
                        <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Department</p>
                            <p className="font-medium flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                {department}
                            </p>
                        </div>
                    )}

                    {owner && (
                        <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Owner</p>
                            <p className="font-medium flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                {owner}
                            </p>
                        </div>
                    )}

                    <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                            <p className="font-medium flex items-center gap-1 text-sm">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                {formatDate(isFile ? file!.createdAt : folder!.createdAt)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Modified</p>
                            <p className="font-medium flex items-center gap-1 text-sm">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                {formatDate(isFile ? file!.updatedAt || file!.createdAt : folder!.updatedAt || folder!.createdAt)}
                            </p>
                        </div>
                    </div>

                    {isFile && file!.isScanned && (
                        <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Source</p>
                            <p className="font-medium flex items-center gap-1">
                                <ScanLine className="h-3.5 w-3.5 text-muted-foreground" />
                                Scanner
                            </p>
                        </div>
                    )}

                    {isFile && file!.tags && file!.tags.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tags</p>
                            <div className="flex flex-wrap gap-1">
                                {file!.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                        <Tag className="h-2.5 w-2.5 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isFile && folder?.description && (
                        <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                            <p className="text-sm text-foreground">{folder.description}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t grid grid-cols-2 gap-2">
                    {isFile && !isRestricted && (
                        <Button variant="outline" className="gap-2 justify-start" onClick={onPreview}>
                            <Eye className="h-4 w-4" />
                            Preview
                        </Button>
                    )}
                    {isFile && !isRestricted && (
                        <Button variant="outline" className="gap-2 justify-start" onClick={onDownload}>
                            <Download className="h-4 w-4" />
                            Download
                        </Button>
                    )}
                    {isFile && (
                        <Button variant="outline" className="gap-2 justify-start" onClick={onShare}>
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                    )}
                    <Button variant="outline" className="gap-2 justify-start" onClick={onCopy}>
                        <Copy className="h-4 w-4" />
                        Copy
                    </Button>
                    <Button variant="outline" className="gap-2 justify-start" onClick={onMove}>
                        <Move className="h-4 w-4" />
                        Move
                    </Button>
                    <Button variant="destructive" className="gap-2 justify-start" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
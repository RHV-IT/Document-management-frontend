'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useFolderTreeQuery } from '@/hooks/useFolders'
import {
    Home,
    Folder,
    FolderOpen,
    Share2,
    ScanLine,
    Inbox,
    Archive,
    Trash2,
    Clock,
    Star,
    ChevronRight,
    ChevronDown,
} from 'lucide-react'

export type FilterView = 'myfiles' | 'received' | 'sent' | 'scanned' | 'scanner' | 'archive' | 'recycle' | 'recent' | 'starred'

interface ExplorerPanelProps {
    isOpen: boolean
    onClose: () => void
    activeView: FilterView
    onViewChange: (view: FilterView) => void
    selectedFolderId: string | null
    onFolderSelect: (folderId: string | null) => void
    favoriteFolders: Set<string>
    counts?: Partial<Record<FilterView, number>>
}

const PRIMARY_FILTERS: { id: FilterView; label: string; icon: any }[] = [
    { id: 'myfiles', label: 'My Drive', icon: Home },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
]

const SHARING_FILTERS: { id: FilterView; label: string; icon: any }[] = [
    { id: 'received', label: 'Shared With Me', icon: Share2 },
    { id: 'sent', label: 'Shared By Me', icon: Share2 },
]

const SCAN_FILTERS: { id: FilterView; label: string; icon: any }[] = [
    { id: 'scanned', label: 'Scanned Files', icon: ScanLine },
    { id: 'scanner', label: 'Pending Scans', icon: Inbox },
]

const SYSTEM_FILTERS: { id: FilterView; label: string; icon: any }[] = [
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'recycle', label: 'Recycle Bin', icon: Trash2 },
]

function FilterRow({
    icon: Icon,
    label,
    active,
    onClick,
    count,
}: {
    icon: any
    label: string
    active: boolean
    onClick: () => void
    count?: number
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-sm transition-colors',
                active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent/50 text-foreground'
            )}
        >
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" style={active ? { color: 'currentColor' } : undefined} />
            <span className="flex-1 text-left truncate">{label}</span>
            {typeof count === 'number' && count > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
            )}
        </button>
    )
}

function FolderTreeNode({
    node,
    depth,
    selectedFolderId,
    onSelect,
    expanded,
    onToggle,
}: {
    node: any
    depth: number
    selectedFolderId: string | null
    onSelect: (id: string) => void
    expanded: Set<string>
    onToggle: (id: string) => void
}) {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expanded.has(node._id)

    return (
        <div>
            <div
                className={cn(
                    'flex items-center gap-1 w-full px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors',
                    selectedFolderId === node._id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent/50 text-foreground'
                )}
                style={{ paddingLeft: 8 + depth * 16 }}
                onClick={() => onSelect(node._id)}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggle(node._id)
                        }}
                        className="p-0.5 hover:bg-accent rounded"
                    >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                ) : (
                    <span className="w-4" />
                )}
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{node.name}</span>
                {node.isSystemFolder && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 font-medium shrink-0">Sys</span>
                )}
            </div>
            {hasChildren && isExpanded && (
                <div>
                    {node.children.map((child: any) => (
                        <FolderTreeNode
                            key={child._id}
                            node={child}
                            depth={depth + 1}
                            selectedFolderId={selectedFolderId}
                            onSelect={onSelect}
                            expanded={expanded}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function ExplorerPanel({
    isOpen,
    onClose,
    activeView,
    onViewChange,
    selectedFolderId,
    onFolderSelect,
    favoriteFolders,
    counts,
}: ExplorerPanelProps) {
    const { data: folderTree } = useFolderTreeQuery()
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

    const toggleFolder = useCallback((id: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }, [])

    const tree = useMemo(() => {
        const map = new Map<string, any>()
        const roots: any[] = []
        const folders = folderTree || []
        folders.forEach((folder: any) => {
            map.set(folder._id, { ...folder, children: [] })
        })
        folders.forEach((folder: any) => {
            const node = map.get(folder._id)!
            if (folder.parentFolderId && map.has(folder.parentFolderId)) {
                map.get(folder.parentFolderId)!.children.push(node)
            } else {
                roots.push(node)
            }
        })
        return roots
    }, [folderTree])

    const body = (
        <div className="p-3">
            <div className="space-y-0.5">
                {PRIMARY_FILTERS.map((f) => (
                    <FilterRow
                        key={f.id}
                        icon={f.icon}
                        label={f.label}
                        active={activeView === f.id && !selectedFolderId}
                        onClick={() => {
                            onViewChange(f.id)
                            onFolderSelect(null)
                            onClose()
                        }}
                        count={counts?.[f.id]}
                    />
                ))}
            </div>

            <Separator className="my-3" />
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground">Sharing</div>
            <div className="space-y-0.5">
                {SHARING_FILTERS.map((f) => (
                    <FilterRow
                        key={f.id}
                        icon={f.icon}
                        label={f.label}
                        active={activeView === f.id}
                        onClick={() => {
                            onViewChange(f.id)
                            onClose()
                        }}
                        count={counts?.[f.id]}
                    />
                ))}
            </div>

            <Separator className="my-3" />
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground">Scanner</div>
            <div className="space-y-0.5">
                {SCAN_FILTERS.map((f) => (
                    <FilterRow
                        key={f.id}
                        icon={f.icon}
                        label={f.label}
                        active={activeView === f.id}
                        onClick={() => {
                            onViewChange(f.id)
                            onClose()
                        }}
                        count={counts?.[f.id]}
                    />
                ))}
            </div>

            <Separator className="my-3" />
            <div className="space-y-0.5">
                {SYSTEM_FILTERS.map((f) => (
                    <FilterRow
                        key={f.id}
                        icon={f.icon}
                        label={f.label}
                        active={activeView === f.id}
                        onClick={() => {
                            onViewChange(f.id)
                            onClose()
                        }}
                        count={counts?.[f.id]}
                    />
                ))}
            </div>

            <Separator className="my-3" />
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <FolderOpen className="w-3 h-3" />
                Folders
            </div>
            <div className="mt-1 space-y-0.5">
                {tree.map((node) => (
                    <FolderTreeNode
                        key={node._id}
                        node={node}
                        depth={0}
                        selectedFolderId={selectedFolderId}
                        onSelect={(id) => {
                            onFolderSelect(id)
                            onViewChange('myfiles')
                            onClose()
                        }}
                        expanded={expandedFolders}
                        onToggle={toggleFolder}
                    />
                ))}
            </div>
        </div>
    )

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="px-4 py-3 border-b bg-muted/30">
                    <SheetTitle className="text-base font-semibold">Explorer</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto h-[calc(100%-56px)]">{body}</div>
            </SheetContent>
        </Sheet>
    )
}
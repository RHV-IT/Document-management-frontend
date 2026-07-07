'use client'

import React, { useState, useCallback, useRef } from 'react'
import { cn, formatBytes } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FilterOptionList } from './FilterPopover'
import { Folder, Check, ChevronUp, ChevronDown, ListFilter, Share2, Star, Lock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  getFileIconElement,
  getConfidentialityLabel,
  getConfidentialityColor,
  getDepartmentName,
  FILE_TYPE_DISPLAY_NAMES,
  CONFIDENTIALITY_LEVELS,
  CONFIDENTIALITY_LABEL_MAP,
  DATE_BUCKETS,
  DATE_BUCKET_LABELS,
  DateBucket,
} from '@/lib/file-utils'
import { FileItem } from '@/services/api/files'
import { FolderItem } from '@/services/api/folders'
import { FileContextMenu, FolderContextMenu } from './ContextMenus'

export type SortKey = 'name' | 'type' | 'owner' | 'department' | 'confidentiality' | 'size' | 'modified'
export type SortDir = 'asc' | 'desc'

interface DetailsViewProps {
  folders: FolderItem[]
  files: FileItem[]
  isSelected: (id: string, type: 'file' | 'folder') => boolean
  isFavorite: (id: string) => boolean
  canPaste: boolean
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
  typeFilters: Set<string>
  onTypeFiltersChange: (next: Set<string>) => void
  confidentialityFilters: Set<string>
  onConfidentialityFiltersChange: (next: Set<string>) => void
  modifiedFilters: Set<DateBucket>
  onModifiedFiltersChange: (next: Set<DateBucket>) => void
  onSelectFile: (file: FileItem, e: React.MouseEvent) => void
  onSelectFolder: (folder: FolderItem, e: React.MouseEvent) => void
  onOpenFile: (file: FileItem) => void
  onOpenFolder: (folder: FolderItem) => void
  onOpenFolderNewTab?: (folder: FolderItem) => void
  onPreviewFile: (file: FileItem) => void
  onDownloadFile: (file: FileItem) => void
  onShareFile: (file: FileItem) => void
  onRenameFile: (file: FileItem) => void
  onRenameFolder: (folder: FolderItem) => void
  onMoveFile: (file: FileItem) => void
  onMoveFolder: (folder: FolderItem) => void
  onCopyFile: (file: FileItem) => void
  onCopyFolder: (folder: FolderItem) => void
  onCutFile: (file: FileItem) => void
  onCutFolder: (folder: FolderItem) => void
  onPaste: () => void
  onDeleteFile: (file: FileItem) => void
  onDeleteFolder: (folder: FolderItem) => void
  onVersions: (file: FileItem) => void
  onToggleFavoriteFile: (file: FileItem) => void
  onToggleFavoriteFolder: (folder: FolderItem) => void
  onProperties: (item: FileItem | FolderItem, type: 'file' | 'folder') => void
}

const DEFAULT_WIDTHS: Record<string, number> = {
  name: 320,
  type: 140,
  owner: 150,
  department: 140,
  confidentiality: 170,
  size: 100,
  modified: 160,
  shared: 90,
}

/** Windows-11-style column filter: click the funnel to open a checkbox list. */
function ColumnFilter<T extends string>({
  options,
  active,
  onChange,
}: {
  options: { value: T; label: string }[]
  active: Set<T>
  onChange: (next: Set<T>) => void
}) {
  const hasActive = active.size > 0
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'p-0.5 rounded hover:bg-accent transition-colors shrink-0',
            hasActive ? 'text-primary' : 'text-muted-foreground'
          )}
          aria-label="Filter this column"
        >
          <ListFilter className="w-3 h-3" fill={hasActive ? 'currentColor' : 'none'} fillOpacity={hasActive ? 0.15 : 0} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2" onClick={(e) => e.stopPropagation()}>
        <FilterOptionList options={options} active={active} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  activeDir,
  onSort,
  width,
  onResize,
  filter,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  activeDir: SortDir
  onSort: (key: SortKey) => void
  width: number
  onResize: (delta: number) => void
  filter?: React.ReactNode
}) {
  const resizing = useRef(false)
  const startX = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    resizing.current = true
    startX.current = e.clientX
    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return
      onResize(ev.clientX - startX.current)
      startX.current = ev.clientX
    }
    const onUp = () => {
      resizing.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <th
      className="relative text-left text-xs font-medium text-muted-foreground select-none group/th px-3 py-2"
      style={{ width }}
    >
      <div className="flex items-center gap-1">
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => onSort(sortKey)}
        >
          {label}
          {activeKey === sortKey &&
            (activeDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </button>
        {filter}
      </div>
      <div
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 group-hover/th:opacity-100 hover:bg-primary/40"
        onMouseDown={handleMouseDown}
      />
    </th>
  )
}

const TYPE_OPTIONS = Object.entries(FILE_TYPE_DISPLAY_NAMES).map(([value, label]) => ({ value, label }))
const CONFIDENTIALITY_OPTIONS = CONFIDENTIALITY_LEVELS.map((value) => ({ value, label: CONFIDENTIALITY_LABEL_MAP[value] }))
const MODIFIED_OPTIONS = DATE_BUCKETS.map((value) => ({ value, label: DATE_BUCKET_LABELS[value] }))

export function DetailsView(props: DetailsViewProps) {
  const {
    folders,
    files,
    isSelected,
    isFavorite,
    canPaste,
    sortKey,
    sortDir,
    onSort,
    typeFilters,
    onTypeFiltersChange,
    confidentialityFilters,
    onConfidentialityFiltersChange,
    modifiedFilters,
    onModifiedFiltersChange,
    onSelectFile,
    onSelectFolder,
    onOpenFile,
    onOpenFolder,
    onOpenFolderNewTab,
    onPreviewFile,
    onDownloadFile,
    onShareFile,
    onRenameFile,
    onRenameFolder,
    onMoveFile,
    onMoveFolder,
    onCopyFile,
    onCopyFolder,
    onCutFile,
    onCutFolder,
    onPaste,
    onDeleteFile,
    onDeleteFolder,
    onVersions,
    onToggleFavoriteFile,
    onToggleFavoriteFolder,
    onProperties,
  } = props

  const [widths, setWidths] = useState(DEFAULT_WIDTHS)
  const resize = useCallback(
    (col: string) => (delta: number) => {
      setWidths((prev) => ({ ...prev, [col]: Math.max(60, prev[col] + delta) }))
    },
    []
  )

  return (
    <table className="w-full border-collapse text-sm">
      <thead className="sticky top-0 bg-card z-10 border-b">
        <tr>
          <th className="w-10 px-3 py-2" />
          <SortableHeader label="Name" sortKey="name" activeKey={sortKey} activeDir={sortDir} onSort={onSort} width={widths.name} onResize={resize('name')} />
          <SortableHeader
            label="Type"
            sortKey="type"
            activeKey={sortKey}
            activeDir={sortDir}
            onSort={onSort}
            width={widths.type}
            onResize={resize('type')}
            filter={<ColumnFilter options={TYPE_OPTIONS} active={typeFilters} onChange={onTypeFiltersChange} />}
          />
          <SortableHeader label="Owner" sortKey="owner" activeKey={sortKey} activeDir={sortDir} onSort={onSort} width={widths.owner} onResize={resize('owner')} />
          <SortableHeader label="Department" sortKey="department" activeKey={sortKey} activeDir={sortDir} onSort={onSort} width={widths.department} onResize={resize('department')} />
          <SortableHeader
            label="Confidentiality"
            sortKey="confidentiality"
            activeKey={sortKey}
            activeDir={sortDir}
            onSort={onSort}
            width={widths.confidentiality}
            onResize={resize('confidentiality')}
            filter={
              <ColumnFilter
                options={CONFIDENTIALITY_OPTIONS}
                active={confidentialityFilters}
                onChange={onConfidentialityFiltersChange}
              />
            }
          />
          <SortableHeader label="Size" sortKey="size" activeKey={sortKey} activeDir={sortDir} onSort={onSort} width={widths.size} onResize={resize('size')} />
          <SortableHeader
            label="Modified"
            sortKey="modified"
            activeKey={sortKey}
            activeDir={sortDir}
            onSort={onSort}
            width={widths.modified}
            onResize={resize('modified')}
            filter={<ColumnFilter options={MODIFIED_OPTIONS} active={modifiedFilters} onChange={onModifiedFiltersChange} />}
          />
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2" style={{ width: widths.shared }}>
            Shared
          </th>
        </tr>
      </thead>
      <tbody>
        {folders.map((folder) => (
          <FolderContextMenu
            key={folder._id}
            isSystemFolder={!!folder.isSystemFolder}
            isFavorite={isFavorite(folder._id)}
            onOpen={() => onOpenFolder(folder)}
            onOpenNewTab={onOpenFolderNewTab ? () => onOpenFolderNewTab(folder) : undefined}
            onRename={() => onRenameFolder(folder)}
            onCopy={() => onCopyFolder(folder)}
            onCut={() => onCutFolder(folder)}
            onPaste={onPaste}
            canPaste={canPaste}
            onDelete={() => onDeleteFolder(folder)}
            onMove={() => onMoveFolder(folder)}
            onToggleFavorite={() => onToggleFavoriteFolder(folder)}
            onProperties={() => onProperties(folder, 'folder')}
          >
            <tr
              className={cn(
                'border-b border-border/40 hover:bg-accent/40 cursor-pointer transition-colors',
                isSelected(folder._id, 'folder') && 'bg-primary/5'
              )}
              onClick={(e) => onSelectFolder(folder, e)}
              onDoubleClick={() => onOpenFolder(folder)}
            >
              <td className="px-3 py-1.5">
                <SelectCheckbox checked={isSelected(folder._id, 'folder')} />
              </td>
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="truncate font-medium">{folder.name}</span>
                  {isFavorite(folder._id) && <Star className="w-3 h-3 text-yellow-500 shrink-0" fill="currentColor" />}
                  {folder.isSystemFolder && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium shrink-0">
                      System
                    </span>
                  )}
                  {folder.stats && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({folder.stats.totalFolders} folders, {folder.stats.totalFiles} files)
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">Folder</td>
              <td className="px-3 py-1.5 text-muted-foreground truncate">
                {typeof folder.createdBy === 'object' ? folder.createdBy?.name || '—' : '—'}
              </td>
              <td className="px-3 py-1.5 text-muted-foreground truncate">{getDepartmentName(folder.department) || '—'}</td>
              <td className="px-3 py-1.5">
                {folder.confidentialityLevel ? (
                  <Badge
                    className={cn('max-w-full truncate text-[10px]', getConfidentialityColor(folder.confidentialityLevel))}
                    title={getConfidentialityLabel(folder.confidentialityLevel)}
                  >
                    {getConfidentialityLabel(folder.confidentialityLevel)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">
                {folder.stats ? formatBytes(folder.stats.totalSize) : '—'}
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">
                {folder.updatedAt ? formatDistanceToNow(new Date(folder.updatedAt)) + ' ago' : '—'}
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">
                {folder.sharedCount ? <Share2 className="w-3.5 h-3.5" /> : ''}
              </td>
            </tr>
          </FolderContextMenu>
        ))}

        {files.map((file) => {
          const isRestricted = file.restricted === true
          return (
            <FileContextMenu
              key={file.fileId}
              isRestricted={isRestricted}
              onOpen={() => onOpenFile(file)}
              onPreview={() => onPreviewFile(file)}
              onCopy={() => onCopyFile(file)}
              onCut={() => onCutFile(file)}
              onPaste={onPaste}
              canPaste={canPaste}
              onDownload={() => onDownloadFile(file)}
              onShare={() => onShareFile(file)}
              onDelete={() => onDeleteFile(file)}
              onMove={() => onMoveFile(file)}
              onRename={() => onRenameFile(file)}
              onVersions={() => onVersions(file)}
              onProperties={() => onProperties(file, 'file')}
            >
              <tr
                data-file-id={file.fileId}
                className={cn(
                  'border-b border-border/40 hover:bg-accent/40 cursor-pointer transition-colors',
                  isSelected(file.fileId, 'file') && 'bg-primary/5',
                  isRestricted && 'opacity-60'
                )}
                onClick={(e) => onSelectFile(file, e)}
                onDoubleClick={() => !isRestricted && onOpenFile(file)}
              >
                <td className="px-3 py-1.5">
                  <SelectCheckbox checked={isSelected(file.fileId, 'file')} />
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {getFileIconElement(file, 'h-4 w-4')}
                    <span className="truncate font-medium">{file.alias || file.name}</span>
                    {isFavorite(file.fileId) && <Star className="w-3 h-3 text-yellow-500 shrink-0" fill="currentColor" />}
                    {isRestricted && <Lock className="w-3 h-3 text-red-500 shrink-0" />}
                  </div>
                </td>
                <td className="px-3 py-1.5 text-muted-foreground truncate">{file.type || '—'}</td>
                <td className="px-3 py-1.5 text-muted-foreground truncate">
                  {file.owner?.name || file.uploadedBy?.name || '—'}
                </td>
                <td className="px-3 py-1.5 text-muted-foreground truncate">{getDepartmentName(file.department) || '—'}</td>
                <td className="px-3 py-1.5">
                  {file.confidentialityLevel ? (
                    <Badge
                      className={cn('max-w-full truncate text-[10px]', getConfidentialityColor(file.confidentialityLevel))}
                      title={getConfidentialityLabel(file.confidentialityLevel)}
                    >
                      {getConfidentialityLabel(file.confidentialityLevel)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">{formatBytes(file.size)}</td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {file.updatedAt ? formatDistanceToNow(new Date(file.updatedAt)) + ' ago' : '—'}
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">{file.sharedCount ? <Share2 className="w-3.5 h-3.5" /> : ''}</td>
              </tr>
            </FileContextMenu>
          )
        })}
      </tbody>
    </table>
  )
}

function SelectCheckbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={cn(
        'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
        checked ? 'bg-primary border-primary text-white' : 'border-gray-300'
      )}
    >
      {checked && <Check className="w-2.5 h-2.5" />}
    </div>
  )
}

/** Client-side sort helper shared by the page for details/list/grid views. */
export function sortItems<T>(
  items: T[],
  sortKey: SortKey,
  sortDir: SortDir,
  getters: Record<SortKey, (item: T) => string | number>
): T[] {
  const sorted = [...items].sort((a, b) => {
    const av = getters[sortKey](a)
    const bv = getters[sortKey](b)
    if (av < bv) return -1
    if (av > bv) return 1
    return 0
  })
  return sortDir === 'asc' ? sorted : sorted.reverse()
}

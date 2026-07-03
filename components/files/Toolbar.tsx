'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FilterOptionList } from './FilterPopover'
import {
  FILE_TYPE_DISPLAY_NAMES,
  CONFIDENTIALITY_LEVELS,
  CONFIDENTIALITY_LABEL_MAP,
  DATE_BUCKETS,
  DATE_BUCKET_LABELS,
  DateBucket,
  GridIconSize,
} from '@/lib/file-utils'
import type { SortKey, SortDir } from './DetailsView'
import {
  FolderPlus,
  Upload,
  Copy,
  Scissors,
  Trash2,
  Download,
  Share2,
  FileText,
  Search,
  X,
  Grid2x2,
  Grid3x3,
  List,
  Rows3,
  Move,
  ChevronDown,
  PanelLeft,
  Edit3,
  LayoutGrid,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListFilter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'grid' | 'list' | 'details'

interface ToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  gridIconSize: GridIconSize
  onGridIconSizeChange: (size: GridIconSize) => void
  sortKey: SortKey
  sortDir: SortDir
  onSortKeyChange: (key: SortKey) => void
  onSortDirChange: (dir: SortDir) => void
  typeFilters: Set<string>
  onTypeFiltersChange: (next: Set<string>) => void
  confidentialityFilters: Set<string>
  onConfidentialityFiltersChange: (next: Set<string>) => void
  modifiedFilters: Set<DateBucket>
  onModifiedFiltersChange: (next: Set<DateBucket>) => void
  onNewFolder: () => void
  onUpload: () => void
  onBulkUpload: () => void
  onToggleExplorer: () => void
  onPaste: () => void
  canPaste: boolean
  onMove: () => void
  onCopy: () => void
  onCut: () => void
  onRename: () => void
  onDelete: () => void
  onDownload: () => void
  onShare: () => void
  onProperties: () => void
  searchQuery: string
  onSearch: (query: string) => void
  selectedCount: number
  disabled?: boolean
}

const SORT_FIELDS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'type', label: 'Type' },
  { value: 'owner', label: 'Owner' },
  { value: 'department', label: 'Department' },
  { value: 'confidentiality', label: 'Confidentiality' },
  { value: 'size', label: 'Size' },
  { value: 'modified', label: 'Date modified' },
]

type ViewSelection = GridIconSize | 'list' | 'details'

const VIEW_MENU_OPTIONS: { value: ViewSelection; label: string; icon: React.ElementType }[] = [
  { value: 'small', label: 'Small icons', icon: Grid3x3 },
  { value: 'medium', label: 'Medium icons', icon: Grid2x2 },
  { value: 'large', label: 'Large icons', icon: LayoutGrid },
  { value: 'list', label: 'List', icon: List },
  { value: 'details', label: 'Details', icon: Rows3 },
]

const TYPE_OPTIONS = Object.entries(FILE_TYPE_DISPLAY_NAMES).map(([value, label]) => ({ value, label }))
const CONFIDENTIALITY_OPTIONS = CONFIDENTIALITY_LEVELS.map((value) => ({ value, label: CONFIDENTIALITY_LABEL_MAP[value] }))
const MODIFIED_OPTIONS = DATE_BUCKETS.map((value) => ({ value, label: DATE_BUCKET_LABELS[value] }))

function IconButton({
  label,
  onClick,
  disabled,
  destructive,
  active,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'secondary' : 'ghost'}
          size="icon"
          onClick={onClick}
          disabled={disabled}
          className={cn('h-8 w-8', destructive && 'text-destructive hover:text-destructive hover:bg-destructive/10')}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  gridIconSize,
  onGridIconSizeChange,
  sortKey,
  sortDir,
  onSortKeyChange,
  onSortDirChange,
  typeFilters,
  onTypeFiltersChange,
  confidentialityFilters,
  onConfidentialityFiltersChange,
  modifiedFilters,
  onModifiedFiltersChange,
  onNewFolder,
  onUpload,
  onBulkUpload,
  onToggleExplorer,
  onPaste,
  canPaste,
  onMove,
  onCopy,
  onCut,
  onRename,
  onDelete,
  onDownload,
  onShare,
  onProperties,
  searchQuery,
  onSearch,
  selectedCount,
  disabled = false,
}: ToolbarProps) {
  const hasSelection = selectedCount > 0
  const activeFilterCount = typeFilters.size + confidentialityFilters.size + modifiedFilters.size
  const viewSelection: ViewSelection = viewMode === 'grid' ? gridIconSize : viewMode
  const ActiveViewIcon = VIEW_MENU_OPTIONS.find((v) => v.value === viewSelection)?.icon || LayoutGrid

  return (
    <div className="h-11 px-2 flex items-center gap-1 border-b bg-card/80 backdrop-blur-xl">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onToggleExplorer} className="h-8 w-8" aria-label="Toggle explorer panel">
            <PanelLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle explorer panel</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" disabled={disabled} className="h-8 gap-1.5">
            <FolderPlus className="h-3.5 w-3.5" />
            New
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onClick={onNewFolder}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onBulkUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={onUpload} disabled={disabled} className="h-8 w-8">
            <Upload className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Upload files</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <IconButton label="Copy" onClick={onCopy} disabled={disabled || !hasSelection}>
        <Copy className="h-4 w-4" />
      </IconButton>
      <IconButton label="Cut" onClick={onCut} disabled={disabled || !hasSelection}>
        <Scissors className="h-4 w-4" />
      </IconButton>
      <IconButton label="Paste" onClick={onPaste} disabled={disabled || !canPaste}>
        <Copy className="h-4 w-4 opacity-60" />
      </IconButton>
      <IconButton label="Move to" onClick={onMove} disabled={disabled || !hasSelection}>
        <Move className="h-4 w-4" />
      </IconButton>
      <IconButton label="Rename" onClick={onRename} disabled={disabled || selectedCount !== 1}>
        <Edit3 className="h-4 w-4" />
      </IconButton>
      <IconButton label="Download" onClick={onDownload} disabled={disabled || !hasSelection}>
        <Download className="h-4 w-4" />
      </IconButton>
      <IconButton label="Share" onClick={onShare} disabled={disabled || !hasSelection}>
        <Share2 className="h-4 w-4" />
      </IconButton>
      <IconButton label="Delete" onClick={onDelete} disabled={disabled || !hasSelection} destructive>
        <Trash2 className="h-4 w-4" />
      </IconButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <IconButton label="Properties" onClick={onProperties} disabled={disabled || !hasSelection}>
        <FileText className="h-4 w-4" />
      </IconButton>

      {hasSelection && (
        <span className="text-xs font-medium text-muted-foreground px-2 tabular-nums">{selectedCount} selected</span>
      )}

      <div className="flex-1" />

      {/* Sort by */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Sort by">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Sort by</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => onSortKeyChange(v as SortKey)}>
            {SORT_FIELDS.map((f) => (
              <DropdownMenuRadioItem key={f.value} value={f.value}>
                {f.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sortDir} onValueChange={(v) => onSortDirChange(v as SortDir)}>
            <DropdownMenuRadioItem value="asc">
              <ArrowUp className="h-3.5 w-3.5 mr-1.5" />
              Ascending
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="desc">
              <ArrowDown className="h-3.5 w-3.5 mr-1.5" />
              Descending
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filter */}
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant={activeFilterCount > 0 ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 relative" aria-label="Filter">
                <ListFilter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[9px] leading-3.5 font-semibold text-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Filter</TooltipContent>
        </Tooltip>
        <PopoverContent align="end" className="w-64 p-2 space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground px-1.5 mb-1">Type</p>
            <FilterOptionList options={TYPE_OPTIONS} active={typeFilters} onChange={onTypeFiltersChange} />
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground px-1.5 mb-1">Confidentiality</p>
            <FilterOptionList options={CONFIDENTIALITY_OPTIONS} active={confidentialityFilters} onChange={onConfidentialityFiltersChange} />
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground px-1.5 mb-1">Modified</p>
            <FilterOptionList options={MODIFIED_OPTIONS} active={modifiedFilters} onChange={onModifiedFiltersChange} />
          </div>
        </PopoverContent>
      </Popover>

      <div className="relative w-56 lg:w-72">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search files, folders, tags..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-8 pr-8 h-8 w-full bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* View */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 ml-2" aria-label="Change view">
                <ActiveViewIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>View</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>View</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={viewSelection}
            onValueChange={(v) => {
              if (v === 'small' || v === 'medium' || v === 'large') {
                onGridIconSizeChange(v)
                onViewModeChange('grid')
              } else {
                onViewModeChange(v as ViewMode)
              }
            }}
          >
            {VIEW_MENU_OPTIONS.map((v) => (
              <DropdownMenuRadioItem key={v.value} value={v.value} className="gap-2">
                <v.icon className="h-4 w-4" />
                {v.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

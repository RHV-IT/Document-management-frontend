import React from 'react'
import {
    File,
    Image as ImageIcon,
    FileText,
    FileSpreadsheet,
    Presentation,
    FileArchive,
    FileCode,
} from 'lucide-react'
import { FileItem } from '@/services/api/files'

export const CONFIDENTIALITY_LEVELS = ['public', 'internal', 'confidential', 'highly_confidential'] as const
export type ConfidentialityLevel = (typeof CONFIDENTIALITY_LEVELS)[number]

/** Grid view tile size, matching Windows Explorer's Small/Medium/Large icons. */
export type GridIconSize = 'small' | 'medium' | 'large'

/** Some list endpoints are typed as `{ files: FileItem[] }`; unwrap defensively in case a bare array ever comes back. */
export function unwrapFilesList(data: unknown): FileItem[] {
    if (!data) return []
    if (Array.isArray(data)) return data as FileItem[]
    const wrapped = (data as { files?: FileItem[] }).files
    return Array.isArray(wrapped) ? wrapped : []
}

export const CONFIDENTIALITY_LABEL_MAP: Record<string, string> = {
    public: 'Everyone Can See',
    internal: 'Company Only',
    confidential: 'Limited Access Only',
    highly_confidential: 'Very Secret - Few People Only',
}

export const CONFIDENTIALITY_BADGE_CLASS: Record<string, string> = {
    public: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    internal: 'bg-blue-100 text-blue-700 border-blue-200',
    confidential: 'bg-amber-100 text-amber-700 border-amber-200',
    highly_confidential: 'bg-red-100 text-red-700 border-red-200',
}

export function getConfidentialityLabel(level?: string | null): string {
    if (!level) return 'Unknown'
    return CONFIDENTIALITY_LABEL_MAP[level] || 'Unknown'
}

export function getConfidentialityColor(level?: string | null): string {
    if (!level) return 'bg-gray-100 text-gray-700 border-gray-200'
    return CONFIDENTIALITY_BADGE_CLASS[level] || 'bg-gray-100 text-gray-700 border-gray-200'
}

export type FileCategory = 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'image' | 'zip' | 'other'

export function getFileExtension(file: Pick<FileItem, 'name'>): string {
    const name = file.name || ''
    const parts = name.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

export function getFileCategory(file: Pick<FileItem, 'name' | 'type'>): FileCategory {
    const ext = getFileExtension(file)
    const type = (file.type || '').toLowerCase()

    if (ext === 'pdf' || type.includes('pdf')) return 'pdf'
    if (
        ['doc', 'docx', 'odt', 'txt', 'rtf'].includes(ext) ||
        type.includes('word') ||
        type.includes('msword') ||
        type.includes('opendocument.text') ||
        type.includes('plain') ||
        type.includes('rtf')
    )
        return 'document'
    if (['xls', 'xlsx', 'ods', 'csv'].includes(ext) || type.includes('excel') || type.includes('spreadsheet'))
        return 'spreadsheet'
    if (['ppt', 'pptx', 'odp'].includes(ext) || type.includes('powerpoint') || type.includes('presentation'))
        return 'presentation'
    if (
        ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif', 'bmp', 'webp', 'svg'].includes(ext) ||
        type.includes('image')
    )
        return 'image'
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || type.includes('zip') || type.includes('archive'))
        return 'zip'
    return 'other'
}

const CATEGORY_ICON_CLASS: Record<FileCategory, { icon: any; className: string }> = {
    image: { icon: ImageIcon, className: 'text-blue-500' },
    pdf: { icon: FileText, className: 'text-red-500' },
    spreadsheet: { icon: FileSpreadsheet, className: 'text-green-500' },
    document: { icon: FileText, className: 'text-blue-600' },
    presentation: { icon: Presentation, className: 'text-orange-500' },
    zip: { icon: FileArchive, className: 'text-purple-500' },
    other: { icon: File, className: 'text-gray-400' },
}

/** Returns a lucide icon element sized via the `size` className, colored by file category. */
export function getFileIconElement(file: Pick<FileItem, 'name' | 'type'>, size: string = 'h-5 w-5'): React.ReactElement {
    const category = getFileCategory(file)
    const { icon: Icon, className } = CATEGORY_ICON_CLASS[category]
    return React.createElement(Icon, { className: `${size} ${className}` })
}

export function getFileCategoryIcon(category: FileCategory) {
    return CATEGORY_ICON_CLASS[category]?.icon || File
}

function normalizeSearch(value: string) {
    return value.trim().toLowerCase()
}

export function getDepartmentName(department: any) {
    if (!department) return ''
    return typeof department === 'object' ? department.name || department._id || '' : department
}

export function getFileName(file: FileItem) {
    return file.alias || file.name || ''
}

export function getSearchableFileText(file: FileItem) {
    return [
        getFileName(file),
        file.name,
        file.alias,
        file.type,
        file.tags?.join(' '),
        getDepartmentName(file.department),
        file.owner?.name,
        file.uploadedBy?.name,
        file.confidentialityLevel ? getConfidentialityLabel(file.confidentialityLevel) : '',
    ]
        .filter(Boolean)
        .join(' ')
}

export function fileMatchesSearch(file: FileItem, searchTerm: string) {
    const query = normalizeSearch(searchTerm)
    if (!query) return true
    return normalizeSearch(getSearchableFileText(file)).includes(query)
}

export const FILE_TYPE_DISPLAY_NAMES: Record<FileCategory, string> = {
    pdf: 'PDF Document',
    document: 'Document',
    spreadsheet: 'Spreadsheet',
    presentation: 'Presentation',
    image: 'Image',
    zip: 'Archive',
    other: 'Other',
}

// ---- Windows-Explorer-style multi-select column filters (Type / Confidentiality / Modified) ----

/** Empty set = no filter applied on that facet (matches everything). */
export function fileMatchesTypeSet(file: Pick<FileItem, 'name' | 'type'>, types: Set<string>): boolean {
    if (!types || types.size === 0) return true
    return types.has(getFileCategory(file))
}

export function fileMatchesConfidentialitySet(item: { confidentialityLevel?: string }, levels: Set<string>): boolean {
    if (!levels || levels.size === 0) return true
    return !!item.confidentialityLevel && levels.has(item.confidentialityLevel)
}

export type DateBucket = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'older'

export const DATE_BUCKETS: DateBucket[] = ['today', 'yesterday', 'week', 'month', 'year', 'older']

export const DATE_BUCKET_LABELS: Record<DateBucket, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    week: 'Earlier this week',
    month: 'Earlier this month',
    year: 'Earlier this year',
    older: 'A long time ago',
}

export function getDateBucket(dateStr?: string | null): DateBucket | null {
    if (!dateStr) return null
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000)

    if (diffDays <= 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays <= 7) return 'week'
    if (diffDays <= 31) return 'month'
    if (diffDays <= 365) return 'year'
    return 'older'
}

export function fileMatchesModifiedSet(item: { updatedAt?: string; createdAt?: string }, buckets: Set<DateBucket>): boolean {
    if (!buckets || buckets.size === 0) return true
    const bucket = getDateBucket(item.updatedAt || item.createdAt)
    return !!bucket && buckets.has(bucket)
}
'use client'

import { useState, useEffect, useRef } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Image,
  Loader2,
  X,
  Scan,
  Clock,
  FileCheck,
  Shield,
  FileType,
  Info,
  Check,
  Upload,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScannerPendingItem } from '@/services/api/files'
import { ConfidentialityLevelSelect } from '@/components/ui/ConfidentialityLevelSelect'
import { useAuth } from '@/hooks/useAuth'
import { DESIGN, designModal } from '@/lib/design-system'

export interface ScannerPendingFile {
  _id: string
  id: string
  fileName: string
  originalName: string
  filePath: string
  fileSize: number
  mimeType: string
  previewUrl?: string
  isImage: boolean
  status: 'pending' | 'confirming' | 'confirmed' | 'cancelled' | 'failed'
  assignedTo?: {
    _id: string
    name: string
    email: string
  }
  scannerMetadata?: {
    scannerId: string
    scannedAt: string
  }
  createdAt: string
}

interface ScannerConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingFile: ScannerPendingFile | null
  onConfirm: (data: {
    id: string
    alias: string
    confidentiality: string
    description: string
    format: string
  }) => void
  onCancel: (id: string) => void
  isConfirming: boolean
  isCancelling: boolean
}



const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF', description: 'Portable Document Format' },
  { value: 'jpg', label: 'JPG', description: 'JPEG Image' },
  { value: 'png', label: 'PNG', description: 'PNG Image' },
]

// Professional file type icon renderer (used in preview)
function getProfessionalFileIcon(mimeType: string, fileName: string, size: number = 48) {
  const ext = (fileName.split('.').pop() || '').toLowerCase()
  const mt = mimeType.toLowerCase()

  if (mt.includes('pdf') || ext === 'pdf') {
    return <FileType className={`text-red-600`} size={size} />
  }
  if (mt.includes('image') || ['jpg','jpeg','png','gif','webp'].includes(ext)) {
    return <Image className={`text-blue-600`} size={size} />
  }
  if (['doc','docx'].includes(ext) || mt.includes('word')) {
    return <FileText className={`text-indigo-600`} size={size} />
  }
  if (['xls','xlsx'].includes(ext) || mt.includes('sheet')) {
    return <FileText className={`text-emerald-600`} size={size} />
  }
  if (['ppt','pptx'].includes(ext)) {
    return <FileText className={`text-orange-600`} size={size} />
  }
  return <FileText className={`text-gray-600`} size={size} />
}

export function ScannerConfirmModal({
  open,
  onOpenChange,
  pendingFile,
  onConfirm,
  onCancel,
  isConfirming,
  isCancelling,
}: ScannerConfirmModalProps) {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const [alias, setAlias] = useState('')
  const [confidentiality, setConfidentiality] = useState('')
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const isProcessing = isConfirming || isCancelling
  const canSubmit = confidentiality && format

  useEffect(() => {
    if (open && pendingFile) {
      const name = pendingFile.originalName || pendingFile.fileName || ''
      setAlias(name.replace(/\.[^/.]+$/, '') || name)
      setConfidentiality('internal')
      setDescription('')
      setFormat('pdf')
    }
  }, [open, pendingFile])

  const handleConfirm = () => {
    if (!pendingFile || !confidentiality || !format) return
    onConfirm({
      id: pendingFile._id,
      alias: alias || pendingFile.originalName || pendingFile.fileName,
      confidentiality,
      description,
      format,
    })
  }

  const handleCancel = () => {
    if (!pendingFile) return
    onCancel(pendingFile._id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={designModal("max-w-2xl flex flex-col")} 
        showCloseButton={false}
      >
        {/* Header - Fixed */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shrink-0">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
          <DialogHeader className="relative px-8 py-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                <Scan className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white m-0">
                  Confirm Scanned Document
                </DialogTitle>
                <DialogDescription className="text-emerald-100 mt-1.5 text-sm font-medium">
                  Review and save your scan to documents
                </DialogDescription>
              </div>
            </div>
            <DialogClose className="cursor-pointer rounded-xl p-2.5 bg-white/15 hover:bg-white/25 transition-all border border-white/20 hover:border-white/40 text-white">
              <X className="h-5 w-5" />
            </DialogClose>
          </DialogHeader>
        </div>

        {/* Main Content - Scrollable */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-6 min-h-0">
          {/* FILE PREVIEW CARD */}
          {pendingFile && (
            <div className="animate-content-slide-up stagger-2">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="relative bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50 rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center gap-6">
                      {/* Professional Document Thumbnail (clean & enterprise style) */}
                      <div className="relative flex-shrink-0">
                        <div className="w-36 h-36 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm flex flex-col items-center justify-center overflow-hidden relative">
                          <div className="flex flex-col items-center justify-center text-center p-4">
                            <div className="mb-2 opacity-95">
                              {getProfessionalFileIcon(pendingFile.mimeType, pendingFile.originalName, 52)}
                            </div>
                            <div className="text-[10px] font-semibold text-gray-500 tracking-[1px] uppercase">
                              {pendingFile.mimeType.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
                            </div>
                          </div>
                          
                          {/* Professional extension badge */}
                          <div className="absolute bottom-2 right-2 text-[9px] font-mono font-semibold text-gray-500 bg-white/90 px-1.5 py-0.5 rounded border border-gray-200">
                            {pendingFile.originalName.split('.').pop()?.toUpperCase()}
                          </div>
                          
                          {/* Subtle scanned watermark */}
                          <div className="absolute top-2 left-2 text-[8px] font-bold tracking-[1.5px] text-gray-400/70 bg-white/80 px-1 rounded">
                            SCANNED
                          </div>
                        </div>

                        {/* Professional Status Badge */}
                        <div className="absolute -bottom-2 -right-2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold tracking-wider rounded-full shadow-md flex items-center gap-1.5 border border-amber-300">
                          <Clock className="h-3 w-3" /> PENDING REVIEW
                        </div>
                      </div>

                     {/* File Information - Clean Professional */}
                     <div className="flex-1 min-w-0">
                       <h3 className="font-semibold text-gray-900 text-xl leading-tight truncate pr-2 mb-1 tracking-[-0.3px]">
                         {pendingFile.originalName}
                       </h3>
                       <p className="text-sm text-gray-500 mb-4">
                         Scanned document ready for approval
                       </p>

                       <div className="flex items-center gap-2 flex-wrap">
                         <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                           <span className="text-emerald-600">●</span> {(pendingFile.fileSize / (1024 * 1024)).toFixed(1)} MB
                         </div>
                         <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                           {pendingFile.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                         </div>
                         {pendingFile.scannerMetadata && (
                           <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700" title={new Date(pendingFile.scannerMetadata.scannedAt).toLocaleString()}>
                             {new Date(pendingFile.scannerMetadata.scannedAt).toLocaleDateString()}
                           </div>
                         )}
                       </div>

                       {pendingFile.scannerMetadata && (
                         <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1.5">
                           <Clock className="h-3 w-3" /> 
                           Scanned at {new Date(pendingFile.scannerMetadata.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORM FIELDS SECTION */}
          <div className="animate-content-slide-up stagger-3 space-y-5">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Document Details</h3>

            {/* Alias Field */}
            <div className="space-y-2.5 animate-form-field-in stagger-1">
               <Label htmlFor="alias" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  Rename document
                  <span className="text-xs font-normal text-gray-400">(optional)</span>
                </Label>
              <Input
                id="alias"
                placeholder="Give it a memorable name (e.g., Invoice-Jan-2024)..."
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                disabled={isProcessing}
                className="h-12 bg-gradient-to-r from-gray-50 to-teal-50 border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all rounded-xl shadow-sm hover:shadow-md"
              />
            </div>

            {/* Two Column - Confidentiality & Format */}
            <div className="grid grid-cols-2 gap-5">
              {/* Confidentiality */}
              <div className="space-y-2.5 animate-form-field-in stagger-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  Confidentiality
                  <span className="text-red-500 font-bold">*</span>
                </Label>
                <ConfidentialityLevelSelect
                  value={confidentiality}
                  onValueChange={setConfidentiality}
                  userLevel={user?.confidentialityLevel}
                  placeholder="Select level"
                  className="h-12 bg-gradient-to-r from-gray-50 to-teal-50 border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl shadow-sm hover:shadow-md transition-all"
                  disabled={isProcessing}
                />

              </div>

              {/* Format */}
              <div className="space-y-2.5 animate-form-field-in stagger-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Output Format
                  <span className="text-red-500 font-bold">*</span>
                </Label>
                <Select
                  value={format}
                  onValueChange={setFormat}
                  disabled={isProcessing}
                >
                  <SelectTrigger className="h-12 bg-gradient-to-r from-gray-50 to-teal-50 border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {FORMAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <FileText className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{opt.label}</div>
                            <div className="text-xs text-gray-500">{opt.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {format && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg border border-cyan-200 animate-scale-in">
                    <FileText className="h-4 w-4 text-cyan-600" />
                    <span className="text-xs font-semibold text-gray-700 uppercase">{format}</span>
                    <Check className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
                  </div>
                )}
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-2.5 animate-form-field-in stagger-4">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="text-lg">💬</span>
                Notes & Description
                <span className="text-xs font-normal text-gray-400">(Optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Add any notes about this document (tags, references, etc.)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isProcessing}
                className="min-h-[90px] bg-gradient-to-r from-gray-50 to-teal-50 border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none rounded-xl shadow-sm hover:shadow-md transition-all"
              />
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 animate-content-slide-up stagger-4">
              <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Ready to save?</p>
                <p className="text-gray-600 text-xs mt-1">Fill in the required fields and click "Confirm & Save" to complete the process.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <DialogFooter className="px-8 py-5 bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 border-t border-gray-200 shrink-0">
          <div className="flex items-center justify-between w-full gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isProcessing}
              className="h-12 px-6 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-semibold"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Scan
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || !canSubmit}
              className={cn(
                "h-12 px-8 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2",
                canSubmit && !isProcessing
                  ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white shadow-emerald-500/30 hover:shadow-emerald-500/40"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  Confirm & Save
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
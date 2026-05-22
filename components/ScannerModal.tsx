'use client'

import { useState, useEffect, useRef } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { X, FileText, Image, FileIcon, Upload, Loader2, CheckCircle2, AlertCircle, Shield, FileCheck, Smartphone } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { PendingScan } from '@/hooks/useScanner'
import { designModal } from '@/lib/design-system'

interface ScannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scan: PendingScan | null
  onConfirm: (data: {
    id: string
    alias: string
    confidentialityLevel: string
    description: string
    format: string
  }) => void
  onCancel: (id: string) => void
  isConfirming: boolean
  isCancelling: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileType(mimeType: string): string {
  const types: Record<string, string> = {
    'image/jpeg': 'JPG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'application/pdf': 'PDF',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
  }
  return types[mimeType] || mimeType
}

function FilePreview({ scan }: { scan: PendingScan }) {
  // Professional thumbnail only - no raw screen/iframe previews (keeps dialog clean & enterprise-grade)
  const ext = (scan.fileName.split('.').pop() || '').toUpperCase()
  const isPdf = scan.mimeType === 'application/pdf' || ext === 'PDF'
  const isImage = scan.mimeType.startsWith('image/')

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-slate-50 to-white p-5 border border-slate-200 shadow-sm flex items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3">
          {isPdf ? (
            <FileText className="size-14 text-red-600" />
          ) : isImage ? (
            <Image className="size-14 text-blue-600" />
          ) : (
            <FileIcon className="size-14 text-gray-600" />
          )}
        </div>
        <div className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
          {ext || 'FILE'}
        </div>
        <div className="mt-1 text-[9px] text-gray-400 font-medium">SCANNED DOCUMENT</div>
      </div>
      <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-white/90 border border-gray-200 px-1.5 rounded text-gray-500">
        {ext}
      </div>
    </div>
  )
}
            ) : (
              <FileIcon className={`size-16 ${getIconColor(scan.mimeType)}`} />
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium tracking-wider">PREVIEW UNAVAILABLE</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{scan.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</p>
        </div>
      </div>
    </div>
  )
}

type ConfirmationPhase = 'initial' | 'upload-confirm' | 'cancel-confirm' | 'details'

export function ScannerModal({
  open,
  onOpenChange,
  scan,
  onConfirm,
  onCancel,
  isConfirming,
  isCancelling,
}: ScannerModalProps) {
  const isMobile = useIsMobile()
  const [phase, setPhase] = useState<ConfirmationPhase>('initial')
  const [alias, setAlias] = useState('')
  const [confidentialityLevel, setConfidentialityLevel] = useState<string>('')
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState<string>('')
  const contentRef = useRef<HTMLDivElement>(null)
  const isSubmitting = isConfirming || isCancelling
  const isFormValid = alias.trim() && confidentialityLevel && format

  useEffect(() => {
    if (scan) {
      setPhase('initial')
      setAlias(scan.originalName.replace(/\.[^/.]+$/, ''))
      setConfidentialityLevel('')
      setDescription('')
      setFormat(scan.mimeType === 'application/pdf' ? 'pdf' : scan.mimeType.startsWith('image/') ? 'jpg' : '')
    }
  }, [scan])

  const handleConfirm = () => {
    if (!scan || !alias.trim() || !confidentialityLevel || !format) return
    onConfirm({
      id: scan.id,
      alias: alias.trim(),
      confidentialityLevel,
      description: description.trim(),
      format,
    })
  }

  const handleCancel = () => {
    if (!scan) return
    onCancel(scan.id)
  }

  if (!scan) return null

  // Mobile breakpoint - show message instead of modal
  if (isMobile && open) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onOpenChange(false)}>
        <DialogContent 
          className={designModal("sm:max-w-[480px] p-0")} 
          showCloseButton={false}
        >
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Smartphone className="size-8 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">Screen Too Small</DialogTitle>
            <DialogDescription className="text-gray-600 max-w-sm">
              The scanner confirmation dialog requires a larger screen. Please open this page on a tablet, laptop, or desktop computer.
            </DialogDescription>
            <Button
              onClick={() => onOpenChange(false)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const handleUploadClick = () => {
    setPhase('upload-confirm')
  }

  const handleCancelClick = () => {
    setPhase('cancel-confirm')
  }

  const handleUploadConfirm = () => {
    setPhase('details')
  }

  const handleCancelConfirm = () => {
    if (!scan) return
    onCancel(scan.id)
  }

  const renderPhaseContent = () => {
    switch (phase) {
      case 'initial':
        return (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 px-8 py-6 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
              <div className="relative z-10 text-center">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl w-fit mx-auto mb-4">
                  <FileText className="size-8 text-white" strokeWidth={1.5} />
                </div>
                <DialogTitle className="text-3xl font-bold text-white">New Scanned Document</DialogTitle>
                <DialogDescription className="text-blue-100 mt-2 text-lg">
                  Do you want to upload this scanned document?
                </DialogDescription>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 min-h-0">
              <FilePreview scan={scan} />
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">File: {scan.originalName}</p>
                <p className="text-sm text-gray-600">Size: {formatFileSize(scan.fileSize)}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 flex items-center justify-center gap-4 shrink-0">
              <Button
                variant="outline"
                onClick={handleCancelClick}
                className="rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 h-12 px-8 font-medium transition-all"
              >
                <X className="size-5 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleUploadClick}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 px-8 font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Upload className="size-5" />
                Upload
              </Button>
            </div>
          </>
        )

      case 'upload-confirm':
        return (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-8 py-6 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
              <div className="relative z-10 text-center">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl w-fit mx-auto mb-4">
                  <AlertCircle className="size-8 text-white" strokeWidth={1.5} />
                </div>
                <DialogTitle className="text-3xl font-bold text-white">Confirm Upload</DialogTitle>
                <DialogDescription className="text-orange-100 mt-2 text-lg">
                  Are you sure you want to upload this file?
                </DialogDescription>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 min-h-0">
              <FilePreview scan={scan} />
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 flex items-center justify-center gap-4 shrink-0">
              <Button
                variant="outline"
                onClick={() => setPhase('initial')}
                className="rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 h-12 px-8 font-medium transition-all"
              >
                Back
              </Button>
              <Button
                onClick={handleUploadConfirm}
                className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-12 px-8 font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <CheckCircle2 className="size-5" />
                Yes, Upload
              </Button>
            </div>
          </>
        )

      case 'cancel-confirm':
        return (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-600 via-slate-600 to-gray-700 px-8 py-6 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
              <div className="relative z-10 text-center">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl w-fit mx-auto mb-4">
                  <AlertCircle className="size-8 text-white" strokeWidth={1.5} />
                </div>
                <DialogTitle className="text-3xl font-bold text-white">Confirm Cancellation</DialogTitle>
                <DialogDescription className="text-gray-100 mt-2 text-lg">
                  This file will remain in your scan folder and will not be uploaded. Are you sure?
                </DialogDescription>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 min-h-0">
              <FilePreview scan={scan} />
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 flex items-center justify-center gap-4 shrink-0">
              <Button
                variant="outline"
                onClick={() => setPhase('initial')}
                className="rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 h-12 px-8 font-medium transition-all"
              >
                Back
              </Button>
              <Button
                onClick={handleCancelConfirm}
                disabled={isCancelling}
                className="rounded-lg bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white h-12 px-8 font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-5" />
                    Yes, Cancel
                  </>
                )}
              </Button>
            </div>
          </>
        )

      case 'details':
        return (
          <>
            {/* Header - Fixed at top */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 px-8 py-6 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Upload className="size-6 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white">Confirm Scan Upload</DialogTitle>
                    <DialogDescription className="text-blue-100 mt-2 text-sm">
                      Review document details and provide information
                    </DialogDescription>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 shrink-0"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Main Content - Scrollable area */}
            <div ref={contentRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-6 min-h-0">
              {/* FILE PREVIEW SECTION */}
              <div className="animate-content-slide-up stagger-1">
                <FilePreview scan={scan} />
              </div>

              {/* FILE INFORMATION - ORGANIZED GRID */}
              <div className="animate-content-slide-up stagger-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">File Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-badge-pop stagger-1">
                    <p className="text-xs text-slate-500 font-medium mb-2">File Name</p>
                    <p className="text-sm font-semibold text-slate-900 truncate" title={scan.originalName}>
                      {scan.originalName.length > 20 ? scan.originalName.substring(0, 17) + '...' : scan.originalName}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-badge-pop stagger-2">
                    <p className="text-xs text-slate-500 font-medium mb-2">File Size</p>
                    <p className="text-sm font-semibold text-slate-900">{formatFileSize(scan.fileSize)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-badge-pop stagger-3">
                    <p className="text-xs text-slate-500 font-medium mb-2">File Type</p>
                    <p className="text-sm font-semibold text-slate-900">{getFileType(scan.mimeType)}</p>
                  </div>
                </div>
              </div>

              {/* FORM SECTION */}
              <div className="animate-content-slide-up stagger-3 space-y-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Document Details</h3>

                {/* Document Alias - Full Width */}
                <div className="space-y-2 animate-form-field-in stagger-1">
                    <Label htmlFor="alias" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Rename document
                      <span className="text-xs font-normal text-slate-400">(optional)</span>
                    </Label>
                  <Input
                    id="alias"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                     placeholder="Give it a memorable name (e.g. Invoice-Jan-2024)"
                    required
                    disabled={isSubmitting}
                    className="h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white placeholder:text-slate-400 text-sm"
                  />
                </div>

                {/* Confidentiality Level & Format - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 animate-form-field-in stagger-2">
                    <Label htmlFor="confidentiality" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Shield className="size-4" />
                      Confidentiality Level
                      <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={confidentialityLevel}
                      onValueChange={setConfidentialityLevel}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="confidentiality" className="h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-sm">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-green-500 block" />
                            Everyone Can See
                          </div>
                        </SelectItem>
                        <SelectItem value="internal">
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-blue-500 block" />
                            Company Only
                          </div>
                        </SelectItem>
                        <SelectItem value="confidential">
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-amber-500 block" />
                            Limited Access Only
                          </div>
                        </SelectItem>
                        <SelectItem value="highly_confidential">
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-red-500 block" />
                            Very Secret - Few People Only
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 animate-form-field-in stagger-3">
                    <Label htmlFor="format" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <FileText className="size-4" />
                      Format
                      <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={format}
                      onValueChange={setFormat}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="format" className="h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-sm">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="pdf">PDF</SelectItem>
                         <SelectItem value="jpg">JPG / JPEG</SelectItem>
                         <SelectItem value="png">PNG</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description - Full Width Optional */}
                <div className="space-y-2 animate-form-field-in stagger-4">
                   <Label htmlFor="description" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                     Description
                     <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                   </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes or details about this document..."
                    disabled={isSubmitting}
                    className="h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white placeholder:text-slate-400 text-sm"
                  />
                </div>
              </div>

              {/* INFO BANNER */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex gap-3 animate-content-slide-up stagger-4">
                <CheckCircle2 className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold">All set?</p>
                  <p className="text-blue-600 text-xs mt-0.5">Fill in the required fields marked with * and click upload.</p>
                </div>
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 flex items-center justify-end gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setPhase('initial')}
                disabled={isSubmitting}
                className="rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 h-10 px-5 font-medium transition-all disabled:opacity-50"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting || !isFormValid}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-10 px-6 font-medium transition-all disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Confirm Upload
                  </>
                )}
              </Button>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !isSubmitting && onOpenChange(open)}>
      <DialogContent
        className="sm:max-w-[650px] border-0 shadow-2xl p-0 overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        {renderPhaseContent()}
      </DialogContent>
    </Dialog>
  )
}
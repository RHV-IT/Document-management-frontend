'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield, Lock } from 'lucide-react'

interface FirstLoginPasswordPromptProps {
  isOpen: boolean
  onClose: (changePassword: boolean) => void
}

export function FirstLoginPasswordPrompt({ isOpen, onClose }: FirstLoginPasswordPromptProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent
        className="sm:max-w-lg bg-white rounded-3xl border-gray-200 shadow-2xl p-0 overflow-hidden"
        showCloseButton={false}
      >
        <div className="p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl mb-6">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <DialogTitle className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">
            Secure Your Account
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-[15px] max-w-sm mx-auto leading-relaxed">
            As this is your first login, please change your temporary password now.
            This is the best way to keep all hospital documents safe.
          </DialogDescription>
        </div>

        {/* Clean professional benefits */}
        <div className="px-8 pb-8 space-y-2.5">
          <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm">
            <div className="text-emerald-600"><Shield className="h-5 w-5" /></div>
            <div className="text-gray-700">Your new password protects every patient record and hospital file</div>
          </div>
          <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm">
            <div className="text-blue-600"><Lock className="h-5 w-5" /></div>
            <div className="text-gray-700">Strong passwords stop unauthorized access to confidential documents</div>
          </div>
        </div>

        <div className="border-t bg-gray-50 px-8 py-5 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            className="flex-1 h-12 text-base border-gray-300 hover:bg-white hover:border-gray-400 text-gray-700"
          >
            I Will Do This Later
          </Button>
          <Button
            onClick={() => onClose(true)}
            className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <Shield className="mr-2 h-5 w-5" />
            Change Password Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

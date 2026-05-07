'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

interface FirstLoginPasswordPromptProps {
  isOpen: boolean
  onClose: (changePassword: boolean) => void
}

export function FirstLoginPasswordPrompt({ isOpen, onClose }: FirstLoginPasswordPromptProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent
        className="sm:max-w-lg bg-white/98 backdrop-blur-xl border-blue-100 shadow-2xl"
        showCloseButton={true}
      >
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Shield className="h-10 w-10 text-blue-600" />
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              First Login Security Check
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-base leading-relaxed">
              For your account security, we recommend changing your password now.
              This helps protect your documents and data.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Security features list */}
        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-0.5">Enhanced Security</p>
              <p className="text-gray-500">Protects your sensitive documents</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50/50 border border-green-100">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-0.5">Peace of Mind</p>
              <p className="text-gray-500">Prevents unauthorized access</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-0.5">Best Practice</p>
              <p className="text-gray-500">Recommended on first login</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            className="border-gray-200 hover:bg-gray-50 hover:text-gray-500 text-gray-700"
          >
            <span>I'll do it later</span>
          </Button>
          <Button
            onClick={() => onClose(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25"
          >
            <Shield className="mr-2 h-4 w-4" />
            Change Password Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

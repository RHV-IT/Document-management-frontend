'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw, Copy } from 'lucide-react'
import { useResendWelcomeEmailMutation } from '@/hooks/useUsers'
import { addNotification } from '@/components/notifications/NotificationCenter'

export interface CreatedUserInfo {
  userId?: string
  name: string
  email: string
  tempPassword: string
  department: string
  role: string
  emailSent: boolean
}

interface UserCreatedDialogProps {
  result: CreatedUserInfo | null
  onCreateAnother: () => void
  onClose: () => void
}

export function UserCreatedDialog({ result, onCreateAnother, onClose }: UserCreatedDialogProps) {
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const { mutateAsync: resendWelcomeEmail } = useResendWelcomeEmailMutation()

  if (!result) return null

  const handleResend = async () => {
    if (!result.userId) return
    setResendState('sending')
    try {
      await resendWelcomeEmail(result.userId)
      setResendState('sent')
    } catch {
      setResendState('error')
    }
  }

  const handleCopy = async () => {
    const details = [
      `Name: ${result.name}`,
      `Email: ${result.email}`,
      `Temporary Password: ${result.tempPassword}`,
      `Department: ${result.department}`,
      `Role: ${result.role}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(details)
      addNotification('success', 'Copied', 'Copied successfully.')
    } catch {
      addNotification('error', 'Copy Failed', 'Unable to copy login details.')
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setResendState('idle')
      onClose()
    }
  }

  return (
    <Dialog open={!!result} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" size="sm">
        {result.emailSent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                User Created Successfully
              </DialogTitle>
              <DialogDescription>
                The account has been created. Login credentials have been sent to{' '}
                <span className="font-medium text-foreground">{result.email}</span>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={onCreateAnother}>
                Create Another User
              </Button>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                User Created
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2">
                  <p>
                    The account was created successfully. However, the welcome email could not be
                    delivered.
                  </p>
                  <p className="text-xs">Possible reasons:</p>
                  <ul className="list-disc pl-4 text-xs space-y-0.5">
                    <li>SMTP temporarily unavailable</li>
                    <li>Recipient mailbox unavailable</li>
                    <li>Network issue</li>
                  </ul>
                  {resendState === 'sent' && (
                    <p className="text-xs font-medium text-green-600">Email sent successfully.</p>
                  )}
                  {resendState === 'error' && (
                    <p className="text-xs font-medium text-destructive">Unable to send email.</p>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:flex-wrap">
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resendState === 'sending' || !result.userId}
                className="gap-2"
              >
                {resendState === 'sending' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {resendState === 'sending' ? 'Sending...' : 'Resend Email'}
              </Button>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Login Details
              </Button>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default UserCreatedDialog

'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, RefreshCw } from 'lucide-react'
import { useResendWelcomeEmailMutation } from '@/hooks/useUsers'

export interface ResendEmailTarget {
  id: string
  name: string
  email: string
}

interface ResendWelcomeEmailDialogProps {
  user: ResendEmailTarget | null
  onOpenChange: (open: boolean) => void
}

export function ResendWelcomeEmailDialog({ user, onOpenChange }: ResendWelcomeEmailDialogProps) {
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const { mutateAsync: resendWelcomeEmail } = useResendWelcomeEmailMutation()

  useEffect(() => {
    if (user) setResendState('idle')
  }, [user])

  if (!user) return null

  const handleResend = async () => {
    setResendState('sending')
    try {
      await resendWelcomeEmail(user.id)
      setResendState('sent')
    } catch {
      setResendState('error')
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-600" />
            Resend Welcome Email
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                Send the login credentials email again to{' '}
                <span className="font-medium text-foreground">{user.name}</span> (
                {user.email})?
              </p>
              {resendState === 'sent' && (
                <p className="text-xs font-medium text-green-600">Email sent successfully.</p>
              )}
              {resendState === 'error' && (
                <p className="text-xs font-medium text-destructive">Unable to send email.</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleResend} disabled={resendState === 'sending'} className="gap-2">
            {resendState === 'sending' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {resendState === 'sending' ? 'Sending...' : 'Resend Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ResendWelcomeEmailDialog

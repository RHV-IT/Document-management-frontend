'use client'

import React from 'react'
import { useAuthContext } from '@/contexts/auth'
import { useProfileStore } from '@/stores/useProfileStore'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Building2, Shield, Check, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Profile {
  profileId: string
  department: string
  confidentialityLevels: string[]
  isPrimary?: boolean
  status?: string
}

interface ProfileSwitcherProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSwitcher({ open, onOpenChange }: ProfileSwitcherProps) {
  const { switchProfile } = useAuthContext()
  const { profiles, activeProfile, setSwitchingProfile } = useProfileStore()
  const { toast } = useToast()

  const handleProfileSelect = async (profileId: string) => {
    const selectedProfile = profiles.find((p: Profile) => p.profileId === profileId)
    if (!selectedProfile) return

    setSwitchingProfile(selectedProfile)
    onOpenChange(false)

    try {
      const result = await switchProfile(profileId)

      if (!result.success) {
        throw new Error(result.error || 'Failed to switch profile')
      }
    } catch (error: any) {
      setSwitchingProfile(null)
      toast({
        title: 'Error',
        description: error.message || 'Failed to switch profile. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="p-1 rounded-hover">{/* Trigger is handled by parent */}</button>
      </DialogTrigger>

      <DialogContent className="w-80 sm:w-96">
        <DialogHeader>
          <DialogTitle>Switch Department Profile</DialogTitle>
          <DialogDescription>
            Select the department workspace you want to access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {profiles.map((profile: Profile) => (
            <div key={profile.profileId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleProfileSelect(profile.profileId)}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900">{profile.department}</h3>
                    {profile.isPrimary && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                        Primary
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {profile.confidentialityLevels.map((level: string) => (
                      <span key={level} className={cn(
                        'px-2 py-0.5 text-xs rounded',
                        level === 'public' ? 'bg-emerald-100 text-emerald-800' :
                        level === 'internal' ? 'bg-blue-100 text-blue-800' :
                        level === 'confidential' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {level.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>

                  {profile.isPrimary && (
                    <div className="mt-2 text-xs text-gray-500">
                      This is your primary profile
                    </div>
                  )}

                  {profile.profileId === activeProfile?.profileId && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                      <Check className="h-3 w-3" />
                      <span>(Current)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import React from 'react'
import { useProfileStore } from '@/stores/useProfileStore'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'

export function ProfileSwitchingOverlay() {
  const { switchingProfile, activeProfile } = useProfileStore()

  if (!switchingProfile) return null

  const targetDepartment = switchingProfile.department

  return (
    <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex flex-col">
      <div className="h-16 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex-1 max-w-xl" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-white">
            {activeProfile?.department?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-gray-900">Switching...</p>
            <p className="text-xs text-gray-500">Loading {targetDepartment} workspace</p>
          </div>
        </div>
        <div className="flex-1 max-w-xl" />
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-0 shadow-sm rounded-xl bg-white p-6">
              <SkeletonLoader type="card" count={1} />
            </div>
            <div className="border-0 shadow-sm rounded-xl bg-white p-6">
              <SkeletonLoader type="card" count={1} />
            </div>
            <div className="border-0 shadow-sm rounded-xl bg-white p-6">
              <SkeletonLoader type="card" count={1} />
            </div>
            <div className="border-0 shadow-sm rounded-xl bg-white p-6">
              <SkeletonLoader type="card" count={1} />
            </div>
          </div>

          <div className="border-0 shadow-sm rounded-xl bg-white">
            <div className="p-6 border-b border-gray-100">
              <SkeletonLoader type="text" className="h-5 w-48" />
            </div>
            <div className="divide-y divide-gray-100">
              <SkeletonLoader type="row" count={5} className="p-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-0 shadow-sm rounded-xl bg-white p-6">
              <SkeletonLoader type="card" count={3} />
            </div>
            <div className="border-0 shadow-sm rounded-xl bg-white p-6">
              <SkeletonLoader type="card" count={3} />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <div className="bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Switching to {targetDepartment}...
        </div>
      </div>
    </div>
  )
}

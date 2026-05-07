'use client'

import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import Image from 'next/image'
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-blue-100/5 rounded-full blur-3xl -ml-48 -mb-48"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary via-primary to-primary/80 px-8 py-16 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-16 -mb-16"></div>

            <div className="relative flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                <Lock className="w-8 h-8" />
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold">Access Restricted</h1>
                <p className="text-blue-100 mt-2 text-sm">User registration is admin-only</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-10 space-y-6">
            <div className="text-center space-y-4">
              <p className="text-foreground font-medium">User accounts are created and managed by administrators only.</p>
              <p className="text-sm text-muted-foreground">
                If you believe you should have access to RHV DMS, please contact your administrator.
              </p>
            </div>

            <div className="bg-secondary/30 rounded-lg p-4 space-y-2 border border-border">
              <p className="text-xs font-semibold text-foreground uppercase">What you can do:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ask your administrator to create an account for you</li>
                <li>• Sign in with your existing credentials</li>
                <li>• Contact IT support for access issues</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/login" className="w-full">
                <button className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition-all">
                  Back to Login
                </button>
              </Link>
              <a href="mailto:support@rhv.com" className="w-full">
                <button className="w-full border border-border text-foreground font-semibold py-3 rounded-lg hover:bg-secondary transition-all">
                  Contact Support
                </button>
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          © 2026 RHV DMS. All rights reserved.
        </p>
      </div>
    </div>
  )
}

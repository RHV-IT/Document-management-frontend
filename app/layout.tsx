import React from 'react'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { AuthProvider } from '@/contexts/auth'
import { ProfileProvider } from '@/stores/useProfileStore'
import { QueryClientProvider } from '@/providers/query-client'
import { Toaster } from '@/components/ui/sonner'
import { IdleDetector } from '@/components/idle/IdleDetector'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ScannerListener } from '@/components/ScannerListener'
import { ScannerAgentFlow } from '@/components/scanner/ScannerAgentFlow'
import { AgentEnforcement } from '@/components/AgentEnforcement'
// Design System: see lib/design-system.ts + DESIGN_CONSISTENCY.md for rules

export const metadata: Metadata = {
  title: 'RHV DMS',
  description: 'Document Management System',
  generator: 'SAPOK',
  icons: {
    icon: '/images/rhv-logo.png',
    apple: '/apple-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-side logging - simple console.log
  if (process.env.NODE_ENV === 'development') {
    console.log('[RootLayout] rendering')
  }
  return (
    <html lang="en" className={`bg-background ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <QueryClientProvider>
          <ProfileProvider>
            <AuthProvider>
              <ErrorBoundary>
                <IdleDetector idleTimeout={30 * 60 * 1000}>
                  {children}
                </IdleDetector>
              </ErrorBoundary>
              <Toaster
                position="top-center"
                richColors
                closeButton
                toastOptions={{
                  style: {
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: '14px',
                  },
                }}
              />
              <ScannerListener />
              <ScannerAgentFlow />
              <AgentEnforcement />
            </AuthProvider>
          </ProfileProvider>
        </QueryClientProvider>
        </body>
    </html>
  )
}

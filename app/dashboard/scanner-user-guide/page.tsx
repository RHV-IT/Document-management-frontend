'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/services/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'
import {
  LogIn, Download, FolderOpen, Bell, CheckCircle, Printer, ArrowLeft,
  Scan, Monitor, User, FileText, HelpCircle, Shield
} from 'lucide-react'

interface AgentHealth {
  connected: boolean
  version?: string
  machineId?: string
  status?: string
  watcherRunning?: boolean
}

export default function ScannerUserGuidePage() {
  const { user } = useAuth()
  const [agentStatus, setAgentStatus] = useState<AgentHealth>({ connected: false })
  const [statusLoading, setStatusLoading] = useState(true)

  // Inject print styles to hide sidebar/header for clean guide PDF
  React.useEffect(() => {
    const style = document.createElement('style')
    style.id = 'guide-print-styles'
    style.textContent = `
      @media print {
        aside, nav, [data-sidebar], header[role="banner"], .dashboard-header, .sidebar { display: none !important; }
        main, .flex-1, [data-main] { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
        body { background: white !important; }
      }
    `
    if (!document.getElementById('guide-print-styles')) {
      document.head.appendChild(style)
    }
    return () => { const s = document.getElementById('guide-print-styles'); if (s) s.remove() }
  }, [])

  // Realtime scanner status polling every 5 seconds
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const userId = user?._id || user?.id
        const params = userId ? { userId } : {}
        const res = await apiClient.get('/api/v1/scanner/health', { params })
        const data = res.data || {}
        const isConnected = Boolean(
          data.connected || data.success || data.online || data.agentConnected || data.watcherRunning
        )
        setAgentStatus({
          connected: isConnected,
          version: data.version,
          machineId: data.machineId,
          status: data.status,
          watcherRunning: data.watcherRunning,
        })
      } catch {
        setAgentStatus({ connected: false })
      } finally {
        setStatusLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [user])

  const handleDownloadAgent = () => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rhv-dms-backend.vercel.app'
    const url = `${base}/api/v1/scanner/auto-install-download/direct`
    const link = document.createElement('a')
    link.href = url
    link.download = 'RHV-Scanner-Agent.exe'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadGuide = () => {
    window.print()
  }

  const Step = ({ number, title, icon: Icon, children }: { number: number; title: string; icon: any; children: React.ReactNode }) => (
    <div className="relative">
      <div className="absolute -left-4 top-6 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-4 ring-blue-50 z-10">
        {number}
      </div>
      <div className="ml-12 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Icon className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="text-[15px] leading-relaxed text-gray-600 space-y-2">
          {children}
        </div>
      </div>
    </div>
  )

  return (
    <ResponsiveContainer>
      <div className="max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:mb-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center gap-3">
              <Scan className="h-9 w-9 text-blue-600" />
              Scanner User Guide
            </h1>
            <p className="text-lg text-gray-600 mt-1">Simple instructions for hospital staff</p>
          </div>
          <Badge variant="outline" className="hidden md:flex items-center gap-1.5 px-3 py-1 text-sm">
            <Shield className="h-3.5 w-3.5" /> For Hospital Staff
          </Badge>
        </div>

        {/* Scanner Status + Actions Card */}
        <Card className="border-0 shadow-sm mb-10 bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl">Scanner Status</CardTitle>
            </div>
            <CardDescription>Live connection • updates every 5 seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1">
                {statusLoading ? (
                  <div className="text-gray-500">Checking connection...</div>
                ) : agentStatus.connected ? (
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-3xl">🟢</span>
                      <span className="text-xl font-semibold text-green-700">Scanner Connected</span>
                    </div>
                    <p className="text-sm text-gray-600">Your RHV Scanner Agent is running and ready to use.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-3xl">🔴</span>
                      <span className="text-xl font-semibold text-red-700">Scanner Offline</span>
                    </div>
                    <p className="text-sm text-gray-600">Please install the RHV Scanner Agent to continue.</p>
                  </div>
                )}

                {agentStatus.connected && (agentStatus.version || agentStatus.machineId) && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm bg-green-50 border border-green-100 rounded-xl p-3 text-green-800">
                    {agentStatus.version && <div><span className="font-medium">Version:</span> {agentStatus.version}</div>}
                    {agentStatus.machineId && <div><span className="font-medium">Machine ID:</span> {agentStatus.machineId}</div>}
                    {typeof agentStatus.watcherRunning !== 'undefined' && (
                      <div><span className="font-medium">Watcher:</span> {agentStatus.watcherRunning ? 'Running' : 'Stopped'}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 print:hidden">
                <Button
                  onClick={handleDownloadAgent}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 h-11 px-6 text-base shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Download RHV Scanner Agent (.exe)
                </Button>
                <Button
                  onClick={handleDownloadGuide}
                  variant="outline"
                  className="gap-2 h-11 px-6 text-base"
                >
                  <Printer className="h-4 w-4" />
                  Print / Save as PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guide Intro */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">How to Scan Documents in 6 Simple Steps</h2>
          <p className="text-gray-600">No technical knowledge required — just follow these easy instructions</p>
        </div>

        {/* STEPS */}
        <div className="space-y-6 relative before:absolute before:left-[13px] before:top-8 before:bottom-8 before:w-px before:bg-gray-200">
          {/* STEP 1 */}
          <Step number={1} title="Login to RHV DMS" icon={LogIn}>
            <p>Open your web browser and go to the RHV DMS login page.</p>
            <p>Enter your username and password, then click <strong>Login</strong>.</p>
            <div className="hidden md:block mt-3 p-3 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 bg-gray-50">
              📷 Screenshot placeholder — Login screen
            </div>
          </Step>

          {/* STEP 2 — UPDATED FOR .EXE */}
          <Step number={2} title="Install RHV Scanner Agent" icon={Download}>
            <p>Click the <strong>Download RHV Scanner Agent (.exe)</strong> button above.</p>
            <p>Once the file finishes downloading, locate it on your computer and <strong>double-click</strong> it.</p>
            <p>Follow the simple on-screen installer (just click Next a few times).</p>
            <p className="font-medium text-blue-700">The agent installs and starts running automatically in the background. You don’t need to open or configure anything else.</p>
            <div className="hidden md:block mt-3 p-3 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 bg-gray-50">
              📷 Screenshot placeholder — Installer window
            </div>
          </Step>

          {/* STEP 3 */}
          <Step number={3} title="Place Scanned Files in Documents/Scan" icon={FolderOpen}>
            <p>After scanning a document with your physical scanner, save or move the file into this folder:</p>
            <div className="my-2 inline-block px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl font-mono text-emerald-800 text-sm">
              Documents\Scan
            </div>
            <p>The agent watches this folder and automatically detects new files.</p>
            <div className="hidden md:block mt-3 p-3 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 bg-gray-50">
              📷 Screenshot placeholder — File Explorer showing Documents\Scan
            </div>
          </Step>

          {/* STEP 4 */}
          <Step number={4} title="Wait for the Upload Approval Popup" icon={Bell}>
            <p>Within seconds, a popup will appear in RHV DMS showing the scanned file and a preview.</p>
            <p>You will see a message: “New scan ready for upload”.</p>
            <div className="hidden md:block mt-3 p-3 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 bg-gray-50">
              📷 Screenshot placeholder — Upload approval popup
            </div>
          </Step>

          {/* STEP 5 */}
          <Step number={5} title="Approve or Reject the Upload" icon={CheckCircle}>
            <p>In the popup you can:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>Approve</strong> — choose confidentiality level and optional rename, then upload</li>
              <li><strong>Reject / Cancel</strong> — the file stays in your Scan folder for later</li>
            </ul>
            <div className="hidden md:block mt-3 p-3 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 bg-gray-50">
              📷 Screenshot placeholder — Approve with metadata form
            </div>
          </Step>

          {/* STEP 6 */}
          <Step number={6} title="Files Are Automatically Uploaded & Processed" icon={FileText}>
            <p>Once approved, the document is securely uploaded to the system.</p>
            <p>It appears in <strong>My Files</strong> with the confidentiality level you selected.</p>
            <p className="font-medium">You’re done! The document is now safely stored and searchable.</p>
          </Step>
        </div>

        {/* Tips Card */}
        <Card className="mt-10 border-0 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <CardTitle>Quick Tips & Troubleshooting</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>• If the status shows <strong>Scanner Offline</strong>, download and double-click the RHV Scanner Agent .exe again.</p>
            <p>• Make sure scanned files are saved exactly in <code className="bg-gray-100 px-1 rounded">Documents\Scan</code> (create the folder if it doesn’t exist).</p>
            <p>• Supported files: PDF, images, Word, Excel, PowerPoint, and text documents.</p>
            <p>• If you see “Preview unavailable” in the popup, you can still approve the upload safely.</p>
            <p>• For further help, contact your system administrator or check the Scanner section in Settings.</p>
          </CardContent>
        </Card>

        {/* Bottom action */}
        <div className="text-center mt-10 print:hidden">
          <Button onClick={handleDownloadGuide} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 px-8 h-12 text-base">
            <Printer className="h-5 w-5" />
            Print or Save this Guide as PDF
          </Button>
          <p className="text-xs text-gray-500 mt-2">Tip: Choose “Save as PDF” in the print dialog to keep a copy</p>
        </div>
      </div>
    </ResponsiveContainer>
  )
}

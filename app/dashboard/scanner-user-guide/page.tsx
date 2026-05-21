'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/services/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  LogIn, Download, FolderOpen, Bell, CheckCircle, Upload, Printer, ArrowLeft,
  Scan, Monitor, User, FileText, HelpCircle
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
    link.download = 'scanner-setup.bat'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadGuide = () => {
    // Print-friendly PDF via browser (user can "Save as PDF")
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 print:p-0 print:bg-white">
      {/* Header - hide on print */}
      <div className="max-w-4xl mx-auto mb-8 print:hidden">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <Badge variant="outline" className="ml-auto">For Hospital Staff</Badge>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
          <Scan className="h-10 w-10 text-blue-600" />
          Scanner User Guide
        </h1>
        <p className="text-lg text-gray-600 mt-2">Simple step-by-step instructions to scan and upload documents</p>
      </div>

      {/* Scanner Status Card + Actions */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card className="border-2 border-blue-200 shadow-sm print:border print:shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Monitor className="h-5 w-5" /> Scanner Status
            </CardTitle>
            <CardDescription>Live connection status (updates every 5 seconds)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                {statusLoading ? (
                  <div className="text-gray-500">Checking scanner connection...</div>
                ) : agentStatus.connected ? (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🟢</span>
                    <div>
                      <div className="font-semibold text-green-700 text-lg">Scanner Connected</div>
                      <div className="text-sm text-gray-600">Your scanner agent is running and ready</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔴</span>
                    <div>
                      <div className="font-semibold text-red-700 text-lg">Scanner Offline</div>
                      <div className="text-sm text-gray-600">Please install or start the scanner agent</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 print:hidden">
                <Button onClick={handleDownloadAgent} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> Download Scanner Agent
                </Button>
                <Button onClick={handleDownloadGuide} variant="default" className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Printer className="h-4 w-4" /> Download / Print User Guide
                </Button>
              </div>
            </div>

            {/* Agent Details */}
            {agentStatus.connected && (agentStatus.version || agentStatus.machineId) && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm grid grid-cols-1 sm:grid-cols-3 gap-2 text-green-800">
                {agentStatus.version && (
                  <div><span className="font-medium">Agent Version:</span> {agentStatus.version}</div>
                )}
                {agentStatus.machineId && (
                  <div><span className="font-medium">Machine ID:</span> {agentStatus.machineId}</div>
                )}
                {typeof agentStatus.watcherRunning !== 'undefined' && (
                  <div><span className="font-medium">Watcher:</span> {agentStatus.watcherRunning ? 'Active' : 'Stopped'}</div>
                )}
              </div>
            )}

            <div className="mt-3 text-xs text-gray-500 print:hidden">
              Need help? The agent runs in the background and watches your <strong>Documents/Scan</strong> folder.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* The Visual Guide */}
      <div className="max-w-4xl mx-auto space-y-6 print:space-y-4" id="guide-content">
        <div className="text-center mb-6 print:mb-4">
          <h2 className="text-2xl font-bold text-gray-800">How to Use the Scanner in 6 Easy Steps</h2>
          <p className="text-gray-600">No technical knowledge needed — just follow the pictures and words</p>
        </div>

        {/* STEP 1 */}
        <Card className="border-l-4 border-l-blue-500 print:border-l-4">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">1</div>
              <CardTitle className="text-2xl">STEP 1 — Login to RHV DMS</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-16">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <ul className="space-y-2 text-lg">
                  <li className="flex gap-2"><User className="h-5 w-5 mt-1 text-blue-600" /> Open your web browser and go to the RHV DMS login page</li>
                  <li className="flex gap-2"><LogIn className="h-5 w-5 mt-1 text-blue-600" /> Enter your username and password</li>
                  <li>Click the <strong>Login</strong> button</li>
                </ul>
              </div>
              <div className="hidden md:block w-40 h-24 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center text-center text-sm text-blue-500 bg-blue-50 print:hidden">
                📷 Screenshot placeholder<br />Login screen
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STEP 2 */}
        <Card className="border-l-4 border-l-purple-500 print:border-l-4">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold">2</div>
              <CardTitle className="text-2xl">STEP 2 — Install Scanner Agent</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-16">
            <div className="flex gap-4 items-start">
              <div className="flex-1 text-lg">
                <p className="mb-2">If you have not installed the scanner agent yet:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click the <strong>Download Scanner Agent</strong> button above (or in Settings)</li>
                  <li>Save and run the <strong>scanner-setup.bat</strong> file</li>
                  <li>Follow the simple on-screen instructions (type Y when asked)</li>
                </ol>
                <p className="mt-2 text-sm text-gray-600">The agent will start automatically when your computer starts.</p>
              </div>
              <div className="hidden md:block w-40 h-24 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center text-center text-sm text-purple-500 bg-purple-50 print:hidden">
                📷 Screenshot placeholder<br />Agent installer
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STEP 3 */}
        <Card className="border-l-4 border-l-emerald-500 print:border-l-4">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">3</div>
              <CardTitle className="text-2xl">STEP 3 — Place Scanned Files in Documents/Scan</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-16">
            <div className="flex gap-4 items-start">
              <div className="flex-1 text-lg">
                <p>After you scan a document with your physical scanner:</p>
                <div className="my-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <FolderOpen className="h-8 w-8 text-emerald-600" />
                  <div>
                    <div className="font-semibold">Save or move the scanned file to:</div>
                    <code className="font-mono text-emerald-800">Documents\Scan</code>
                  </div>
                </div>
                <p className="text-sm">The agent watches this folder and detects new files automatically.</p>
              </div>
              <div className="hidden md:block w-40 h-24 border-2 border-dashed border-emerald-300 rounded-lg flex items-center justify-center text-center text-sm text-emerald-500 bg-emerald-50 print:hidden">
                📷 Screenshot placeholder<br />File Explorer showing Documents/Scan folder
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STEP 4 */}
        <Card className="border-l-4 border-l-amber-500 print:border-l-4">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center text-xl font-bold">4</div>
              <CardTitle className="text-2xl">STEP 4 — Wait for Upload Approval Popup</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-16">
            <div className="flex gap-4 items-start">
              <div className="flex-1 text-lg">
                <p>Within a few seconds a popup window will appear in the DMS web app showing:</p>
                <ul className="mt-2 space-y-1">
                  <li className="flex gap-2"><FileText className="h-5 w-5 mt-0.5" /> Scanned file name and preview</li>
                  <li className="flex gap-2"><Bell className="h-5 w-5 mt-0.5" /> “New scan ready for upload” message</li>
                </ul>
              </div>
              <div className="hidden md:block w-40 h-24 border-2 border-dashed border-amber-300 rounded-lg flex items-center justify-center text-center text-sm text-amber-500 bg-amber-50 print:hidden">
                📷 Screenshot placeholder<br />Upload approval popup
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STEP 5 */}
        <Card className="border-l-4 border-l-orange-500 print:border-l-4">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center text-xl font-bold">5</div>
              <CardTitle className="text-2xl">STEP 5 — Approve or Reject Upload</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-16">
            <div className="flex gap-4 items-start">
              <div className="flex-1 text-lg">
                <p>In the popup you can:</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="text-green-600 h-5 w-5" /> <strong>Approve + Add Metadata</strong> — choose confidentiality level and optional rename, then upload
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <span className="text-red-600">✕</span> <strong>Reject / Cancel</strong> — file stays in your Scan folder for later
                  </div>
                </div>
              </div>
              <div className="hidden md:block w-40 h-24 border-2 border-dashed border-orange-300 rounded-lg flex items-center justify-center text-center text-sm text-orange-500 bg-orange-50 print:hidden">
                📷 Screenshot placeholder<br />Approve / metadata form
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STEP 6 */}
        <Card className="border-l-4 border-l-teal-500 print:border-l-4">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center text-xl font-bold">6</div>
              <CardTitle className="text-2xl">STEP 6 — Uploaded Files Are Automatically Processed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-16">
            <div className="flex gap-4 items-start">
              <div className="flex-1 text-lg">
                <p>Once approved:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>The file is securely uploaded to the DMS</li>
                  <li>It appears in your <strong>My Files</strong> with the confidentiality level you chose</li>
                  <li>Original scan is removed from the local Scan folder (if approved with delete option)</li>
                </ul>
                <div className="mt-3 p-3 bg-teal-50 rounded text-sm">✅ That’s it! Your document is now safely stored and searchable.</div>
              </div>
              <div className="hidden md:block w-40 h-24 border-2 border-dashed border-teal-300 rounded-lg flex items-center justify-center text-center text-sm text-teal-500 bg-teal-50 print:hidden">
                📷 Screenshot placeholder<br />Success message / file in list
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card className="bg-white border print:shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Quick Tips &amp; Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>• Make sure the scanner agent is running (see status card above). If offline, re-run the setup or restart your PC.</p>
            <p>• Files must be placed exactly in <code>Documents\Scan</code> (create the folder if missing).</p>
            <p>• Supported file types: PDF, images, Word, Excel, etc.</p>
            <p>• If preview fails you will see “Preview unavailable” — you can still approve the upload.</p>
            <p>• For more help contact your system administrator or check the Scanner tab in Settings.</p>
          </CardContent>
        </Card>

        {/* Footer actions for print */}
        <div className="text-center py-6 print:hidden">
          <Button onClick={handleDownloadGuide} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Printer className="h-5 w-5" /> Print or Save as PDF
          </Button>
          <p className="text-xs text-gray-500 mt-2">Tip: In the print dialog, choose “Save as PDF” to download this guide</p>
        </div>
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block text-center text-xs text-gray-500 mt-8 border-t pt-4">
        RHV DMS Scanner User Guide — Printed on {new Date().toLocaleDateString()}
      </div>
    </div>
  )
}

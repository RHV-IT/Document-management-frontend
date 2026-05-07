'use client'

import { useState, useEffect } from 'react'
import { Download, Monitor, RefreshCw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ScannerAgentModalProps {
  isOpen: boolean
  onAgentDetected: () => void
  onRetry?: () => void
}

type ModalState = 'requirement' | 'downloading' | 'installing' | 'detecting' | 'success' | 'error'

export function ScannerAgentModal({ isOpen, onAgentDetected, onRetry }: ScannerAgentModalProps) {
  const [modalState, setModalState] = useState<ModalState>('requirement')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [detectionAttempts, setDetectionAttempts] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      setModalState('requirement')
      setDownloadProgress(0)
      setDetectionAttempts(0)
      setErrorMessage('')
    }
  }, [isOpen])

  const handleDownload = async () => {
    setModalState('downloading')
    setDownloadProgress(0)

    try {
      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            setModalState('installing')
            return 100
          }
          return prev + Math.random() * 15
        })
      }, 200)

      // Create download link
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rhv-dms-backend.vercel.app'}/api/v1/scanner/auto-install-download`
      const link = document.createElement('a')
      link.href = apiUrl
      link.download = 'RHV-DMS-Scanner-Setup.exe'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // After download starts, move to installing state
      setTimeout(() => {
        clearInterval(progressInterval)
        setDownloadProgress(100)
        setModalState('installing')
        startDetectionPolling()
      }, 2000)

    } catch (error) {
      setErrorMessage('Failed to download installer. Please try again.')
      setModalState('error')
    }
  }

  const startDetectionPolling = () => {
    setModalState('detecting')
    setDetectionAttempts(0)

    const pollInterval = setInterval(async () => {
      try {
        setDetectionAttempts(prev => prev + 1)

        const response = await fetch('http://localhost:4001/health')
        if (response.ok) {
          const health = await response.json()
          if (health.installed && health.running) {
            clearInterval(pollInterval)
            setModalState('success')
            // Auto-dismiss after showing success
            setTimeout(() => {
              onAgentDetected()
            }, 2000)
            return
          }
        }
      } catch (error) {
        // Continue polling
      }

      // Stop polling after 60 attempts (2 minutes)
      if (detectionAttempts >= 60) {
        clearInterval(pollInterval)
        setErrorMessage('Installation detection timed out. Please ensure the agent is running and try again.')
        setModalState('error')
      }
    }, 2000) // Check every 2 seconds
  }

  const handleRetry = () => {
    setModalState('requirement')
    setDownloadProgress(0)
    setDetectionAttempts(0)
    setErrorMessage('')
    onRetry?.()
  }

  const renderContent = () => {
    switch (modalState) {
      case 'requirement':
        return (
          <>
            <div className="px-8 py-8 text-center space-y-4 border-b border-gray-100">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                <Monitor className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Scanner Agent Required
                </h2>
                <p className="text-gray-500 text-base leading-relaxed">
                  To upload documents from your scanner, you need to install our desktop scanner agent on your computer.
                  This quick one-time setup takes less than 2 minutes.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Download className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">Automatic Download</p>
                    <p className="text-gray-600">Installer downloads instantly</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50/50 border border-green-100">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">One-Click Install</p>
                    <p className="text-gray-600">Double-click and install automatically</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Monitor className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">Auto-Connect</p>
                    <p className="text-gray-600">System detects installation automatically</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Installation Steps:</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">1</span>
                    <p className="text-sm text-gray-700">Click the <span className="font-medium">"Download & Install Scanner Agent"</span> button. A file will be downloaded to your computer.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center">2</span>
                    <p className="text-sm text-gray-700">Open the downloaded file. Follow the instructions on your screen. Wait until you see <span className="font-medium">"Setup Complete"</span>.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-sm font-bold flex items-center justify-center">3</span>
                    <p className="text-sm text-gray-700">Follow the installation prompts and wait for completion</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white text-sm font-bold flex items-center justify-center">4</span>
                    <p className="text-sm text-gray-700">This window will automatically close when the agent is detected</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 px-8 py-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleDownload}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 py-3"
              >
                <Download className="mr-2 h-5 w-5" />
                Download & Install Scanner Agent
              </Button>
              {onRetry && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="px-6 border-gray-200 hover:bg-gray-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Connection
                </Button>
              )}
            </div>
          </>
        )

      case 'downloading':
        return (
          <>
            <div className="px-8 py-8 text-center space-y-4 border-b border-gray-100">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                <Download className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Downloading Installer
                </h2>
                <p className="text-gray-500">
                  Please wait while we download the scanner agent installer...
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Download Progress</span>
                  <span>{Math.round(downloadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The installer will download automatically. Please check your downloads folder and run the installer when ready.
                </AlertDescription>
              </Alert>
            </div>
          </>
        )

      case 'installing':
        return (
          <>
            <div className="px-8 py-8 text-center space-y-4 border-b border-gray-100">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl flex items-center justify-center shadow-lg shadow-green-500/10">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Installation Started
                </h2>
                <p className="text-gray-500">
                  Please complete the installation and this window will automatically continue.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for installation to complete...
                </div>
                <p className="text-sm text-gray-600">
                  This window will automatically detect when the scanner agent is running and continue to your dashboard.
                </p>
              </div>
            </div>
          </>
        )

      case 'detecting':
        return (
          <>
            <div className="px-8 py-8 text-center space-y-4 border-b border-gray-100">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                <Monitor className="h-10 w-10 text-blue-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detecting Scanner Agent
                </h2>
                <p className="text-gray-500">
                  Checking for running scanner agent...
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Attempt {detectionAttempts}/60
                </div>
                <p className="text-sm text-gray-600">
                  This may take up to 2 minutes. Please ensure the scanner agent is running.
                </p>
              </div>

              {onRetry && (
                <div className="border-t border-gray-100 px-8 py-6">
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    className="w-full border-gray-200 hover:bg-gray-50"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Detection
                  </Button>
                </div>
              )}
            </div>
          </>
        )

      case 'success':
        return (
          <>
            <div className="px-8 py-8 text-center space-y-4 border-b border-gray-100">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl flex items-center justify-center shadow-lg shadow-green-500/10">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Scanner Agent Connected!
                </h2>
                <p className="text-gray-500">
                  Your scanner agent is now running and connected. Continuing to dashboard...
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Connection established successfully
                </div>
              </div>
            </div>
          </>
        )

      case 'error':
        return (
          <>
            <div className="px-8 py-8 text-center space-y-4 border-b border-gray-100">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl flex items-center justify-center shadow-lg shadow-red-500/10">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Connection Failed
                </h2>
                <p className="text-gray-500">
                  Unable to detect the scanner agent. Please try again.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errorMessage || 'The scanner agent could not be detected. Please ensure it is installed and running.'}
                </AlertDescription>
              </Alert>
            </div>

            <div className="border-t border-gray-100 px-8 py-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleDownload}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25"
              >
                <Download className="mr-2 h-5 w-5" />
                Try Again
              </Button>
              {onRetry && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="px-6 border-gray-200 hover:bg-gray-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Connection
                </Button>
              )}
            </div>
          </>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {renderContent()}
      </div>
    </div>
  )
}
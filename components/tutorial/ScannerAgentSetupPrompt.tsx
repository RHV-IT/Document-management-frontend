'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Monitor, ArrowRight } from 'lucide-react'

interface ScannerAgentSetupPromptProps {
  isOpen: boolean
  onComplete: () => void
  onSkip: () => void
}

export function ScannerAgentSetupPrompt({ isOpen, onComplete, onSkip }: ScannerAgentSetupPromptProps) {
  const handleDownload = () => {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.4.213:5000'}/api/v1/scanner/auto-install-download`
    const link = document.createElement('a')
    link.href = apiUrl
    link.download = 'scanner-setup.bat'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    onComplete()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onSkip()}>
      <DialogContent
        className="sm:max-w-2xl bg-white/98 backdrop-blur-xl border-blue-100 shadow-2xl"
        showCloseButton={true}
      >
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Monitor className="h-10 w-10 text-blue-600" />
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Set Up Your Scanner Agent
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-base leading-relaxed">
              To enable document scanning, you need to install our desktop scanner agent on your computer.
              This quick one-time setup takes less than 2 minutes.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Detailed Setup Instructions */}
        <div className="space-y-6 py-4 max-h-[50vh] overflow-y-auto px-2">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">1</div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">Download the Scanner Agent</p>
              <p className="text-sm text-gray-600">Click the <span className="font-medium">"Download Scanner Agent"</span> button. A file will be downloaded to your computer.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">2</div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">Install the Agent</p>
              <p className="text-sm text-gray-600">Open the downloaded file. Follow the instructions on your screen. Wait until you see <span className="font-medium">"Setup Complete"</span>.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">3</div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">Start the Scanner Agent</p>
              <p className="text-sm text-gray-600">Open the installed folder. Double-click <span className="font-medium">agent.bat</span>. Leave the window open (you can minimize it).</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">4</div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">Enable Auto-Start (IMPORTANT)</p>
              <p className="text-sm text-gray-600">When prompted, type <span className="font-medium">Y</span> and press Enter. This ensures the scanner runs automatically every time you turn on your computer.</p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">5</div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">Login to the System</p>
              <p className="text-sm text-gray-600">Go back to the web app and log in. The system will automatically connect to your scanner.</p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold">6</div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">Scan Your Document</p>
              <p className="text-sm text-gray-600">Scan your document as usual. Save it to this folder:</p>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 font-mono text-sm text-gray-700">
                Documents → Scan
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-2">What Happens Next?</h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>The system will detect your file automatically</li>
              <li>A popup will appear for you to add a name (alias), choose format (PDF, JPG, etc.), and add description (optional)</li>
              <li>Click <span className="font-medium">Upload</span> to complete</li>
            </ul>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
            <h4 className="font-semibold text-gray-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Make sure the agent window is running</li>
              <li>Do not close the agent while scanning</li>
              <li>File size must be under <span className="font-medium">50MB</span></li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">If Something Isn't Working</h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Make sure the agent is open</li>
              <li>Try logging out and logging in again</li>
              <li>Restart your computer if needed</li>
            </ul>
          </div>

          {/* Success Message */}
          <div className="text-center text-sm text-gray-500 pt-2">
            <span className="font-semibold text-green-600">That's it!</span> Once set up, you don't need to repeat these steps again.
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onSkip}
            className="border-gray-200 hover:bg-gray-50 hover:text-gray-500 text-gray-700"
          >
            I'll do this later
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Scanner Setup
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

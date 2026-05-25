'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  X, ArrowRight, Download, BookOpen, Shield, Upload, FolderOpen,
  Users, Edit3, Eye, FileText, CheckCircle, Monitor, Lock, Search
} from 'lucide-react'
import jsPDF from 'jspdf'
import { cn } from '@/lib/utils'

interface FirstLoginTutorialProps {
  isOpen: boolean
  onComplete: () => void
  onSkip?: () => void
}

interface GuideSection {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  simpleExplanation: string
}

const guideSections: GuideSection[] = [
  {
    id: 1,
    title: 'Welcome to the Hospital Document System',
    description: 'Your new tool to safely store, find, and manage all patient and hospital documents.',
    icon: <BookOpen className="h-8 w-8 text-blue-600" />,
    simpleExplanation: 'Think of this like a super secure digital filing cabinet for the entire hospital. Everything is private and easy to search.'
  },
  {
    id: 2,
    title: 'How Scanning Works',
    description: 'Use your physical scanner as usual. The system automatically picks up new scans.',
    icon: <Monitor className="h-8 w-8 text-emerald-600" />,
    simpleExplanation: 'Scan documents normally. Save them to the special "Scan" folder on your computer. The system watches and brings them here for you.'
  },
  {
    id: 3,
    title: 'Uploading & Approvals',
    description: 'Every scanned document waits for your quick approval before it is saved permanently.',
    icon: <Upload className="h-8 w-8 text-amber-600" />,
    simpleExplanation: 'A small window pops up when a new scan is ready. You check the name, choose security level, and click Approve. That is it!'
  },
  {
    id: 4,
    title: 'Folders & Organization',
    description: 'Documents are automatically sorted into departments and folders so you can find anything in seconds.',
    icon: <FolderOpen className="h-8 w-8 text-indigo-600" />,
    simpleExplanation: 'No more digging through messy folders. Just type what you need or browse by department, date, or patient.'
  },
  {
    id: 5,
    title: 'Bulk Upload for Multiple Files',
    description: 'Need to add many documents at once? Use the bulk upload feature on the Upload page.',
    icon: <Users className="h-8 w-8 text-purple-600" />,
    simpleExplanation: 'Drag and drop 10 or more files together. Give them names and security levels in one go. Saves huge amounts of time.'
  },
  {
    id: 6,
    title: 'Rename Feature',
    description: 'You can give every document a clear, friendly name that makes sense to everyone.',
    icon: <Edit3 className="h-8 w-8 text-teal-600" />,
    simpleExplanation: 'Instead of "scan001.pdf", call it "Patient Smith - Blood Test Results March 2026". Everyone will understand instantly.'
  },
  {
    id: 7,
    title: 'Confidential & Security Levels',
    description: 'Mark documents as Public, Internal, Confidential, or Highly Confidential. Only the right people can see them.',
    icon: <Shield className="h-8 w-8 text-red-600" />,
    simpleExplanation: 'Choose the lock level when uploading or approving. Highly confidential files are extra protected and need special permission.'
  },
  {
    id: 8,
    title: 'Previewing & Downloading Files',
    description: 'Click any document to see a quick preview or download the full file safely.',
    icon: <Eye className="h-8 w-8 text-cyan-600" />,
    simpleExplanation: 'Open documents right in your browser to check them. Download only when you really need a copy on your computer.'
  }
]

export function FirstLoginTutorial({ isOpen, onComplete, onSkip }: FirstLoginTutorialProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  if (!isOpen) return null

  const current = guideSections[currentSection]

  // Professional PDF Generator - simple visual step-by-step guide for non-technical staff
  const generateUserGuidePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let y = 20

      // Cover page
      doc.setFillColor(37, 99, 235) // blue-600
      doc.rect(0, 0, pageWidth, 60, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.text('RHV Hospital DMS', pageWidth / 2, 25, { align: 'center' })
      doc.setFontSize(18)
      doc.text('User Guide for Hospital Staff', pageWidth / 2, 35, { align: 'center' })
      doc.setFontSize(12)
      doc.text('Simple • Visual • Step-by-Step', pageWidth / 2, 45, { align: 'center' })

      doc.setTextColor(0, 0, 0)
      y = 75
      doc.setFontSize(14)
      doc.text('Welcome! This guide helps you use the Document Management System', 20, y)
      y += 8
      doc.text('without any technical knowledge. Follow the pictures and short steps.', 20, y)

      y += 15
      const steps = [
        { title: '1. Login', text: 'Go to the login page. Enter your email and password. Click Sign In.' },
        { title: '2. Install Scanner (First Time Only)', text: 'Your admin will give you the Scanner Agent. Double-click the .exe file and follow the simple installer. It runs in the background.' },
        { title: '3. Drop Files into Scan Folder', text: 'After using your physical scanner, save the images/PDFs into: Documents > Scan  (create the folder if missing). The system will detect them automatically.' },
        { title: '4. Approve Uploads', text: 'A popup appears with the new scan. Type a clear name (example: "John Doe - Lab Results"), pick confidentiality level, then click Approve.' },
        { title: '5. Bulk Upload', text: 'On the Upload page you can drag 10+ files at once. Fill in names and security for all of them together.' },
        { title: '6. Confidential Levels', text: 'Public = anyone in hospital. Internal = staff only. Confidential = managers. Highly Confidential = special permission only.' },
        { title: '7. Rename Feature', text: 'Click the three dots next to any file > Rename. Give it a name everyone understands.' },
        { title: '8. Downloading Files', text: 'Click the file row > Download button. It saves to your Downloads folder.' },
        { title: '9. Previewing Files', text: 'Click any file name or the eye icon. You can read the document directly in the browser without downloading.' }
      ]

      steps.forEach((step, index) => {
        if (y > pageHeight - 40) {
          doc.addPage()
          y = 25
        }
        doc.setFontSize(13)
        doc.setTextColor(37, 99, 235)
        doc.text(step.title, 20, y)
        doc.setTextColor(60, 60, 60)
        doc.setFontSize(11)
        const split = doc.splitTextToSize(step.text, pageWidth - 45)
        y += 7
        doc.text(split, 22, y)
        y += 7 + (split.length - 1) * 5
      })

      // Footer
      y = pageHeight - 25
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text('RHV Hospital Document Management System — Keep this guide near your desk', pageWidth / 2, y, { align: 'center' })
      doc.text('For help, contact your department administrator.', pageWidth / 2, y + 6, { align: 'center' })

      doc.save('RHV_DMS_Hospital_User_Guide.pdf')
    } catch (err) {
      // Fallback: simple text PDF if advanced fails
      const doc = new jsPDF()
      doc.text('RHV DMS User Guide', 20, 20)
      doc.text('Please refer to the on-screen tutorial for step-by-step instructions.', 20, 30)
      doc.save('RHV_DMS_User_Guide.pdf')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const goNext = () => {
    if (currentSection < guideSections.length - 1) {
      setCurrentSection(currentSection + 1)
    } else {
      onComplete()
    }
  }

  const goBack = () => {
    if (currentSection > 0) setCurrentSection(currentSection - 1)
  }

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Professional Header - Fullscreen onboarding feel */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-8 py-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome to RHV DMS</h1>
              <p className="text-blue-100 mt-0.5 text-sm">Hospital Document Management • Made Simple for Everyone</p>
            </div>
          </div>
          <div className="text-right text-sm opacity-75 hidden md:block">
            Step {currentSection + 1} of {guideSections.length}
          </div>
        </div>

        <div className="p-8 md:p-10">
          {/* Current Section Hero */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0 w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center ring-1 ring-blue-100">
              {current.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-semibold text-gray-900 mb-3 leading-tight">{current.title}</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">{current.description}</p>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-emerald-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[15px] leading-relaxed">{current.simpleExplanation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* All Topics Overview Grid - Visual & Simple */}
          <div className="mt-10">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Everything You Need to Know
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {guideSections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(index)}
                  className={cn(
                    "text-left p-4 rounded-2xl border transition-all hover:shadow-md flex gap-3",
                    index === currentSection
                      ? "border-blue-500 bg-blue-50 shadow-inner"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <div className="mt-0.5">{section.icon}</div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{section.title}</div>
                    <div className="text-gray-500 text-xs mt-1 line-clamp-2">{section.simpleExplanation}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Important Reminders for Non-Technical Users */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <Lock className="h-5 w-5" /> Quick Reminders
            </div>
            <ul className="text-sm text-amber-800 grid md:grid-cols-2 gap-x-6 gap-y-1 list-disc list-inside">
              <li>Never share your password</li>
              <li>Always choose the correct confidentiality level</li>
              <li>Use clear names so colleagues can find files</li>
              <li>The system keeps a full history of who accessed what</li>
              <li>Ask your supervisor if you are unsure about a document</li>
              <li>You can always change your password later in Settings</li>
            </ul>
          </div>
        </div>

        {/* Action Footer - Continue + Download Guide (NO SKIP as per spec) */}
        <div className="border-t bg-gray-50 px-8 py-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={generateUserGuidePDF}
            disabled={isGeneratingPDF}
            className="w-full sm:w-auto gap-2 h-12 text-base border-gray-300 hover:bg-white"
          >
            <Download className="h-5 w-5" />
            {isGeneratingPDF ? 'Creating Your Guide...' : 'Download User Guide (PDF)'}
          </Button>

          <div className="flex w-full sm:w-auto gap-3">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentSection === 0}
              className="flex-1 sm:flex-none h-12"
            >
              Back
            </Button>
            <Button
              onClick={goNext}
              className="flex-1 sm:flex-none h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg text-base px-8"
            >
              {currentSection === guideSections.length - 1 ? (
                <>Continue to Security Check <ArrowRight className="ml-2 h-5 w-5" /></>
              ) : (
                <>Next <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

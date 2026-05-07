'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Zap, BarChart, UploadCloud, FolderOpen, Activity, 
  ArrowRight, ArrowLeft, Sparkles, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FirstLoginTutorialProps {
  isOpen: boolean
  onComplete: () => void
  onSkip: () => void
}

interface TutorialStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  highlightElement?: string
  animation?: 'pulse' | 'bounce' | 'slide'
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome to Your Workspace',
    description: `Get ready to organize and manage your documents efficiently. This quick tour will help you get familiar with the key features of your new DMS dashboard.`,
    icon: <Sparkles className="h-10 w-10 text-blue-500" />,
    animation: 'bounce',
  },
  {
    id: 2,
    title: 'Dashboard Overview',
    description: `Your command center shows key metrics at a glance. Track total files, recent uploads, storage usage, and pending shares. All vital information updated in real-time.`,
    icon: <BarChart className="h-10 w-10 text-emerald-500" />,
    animation: 'pulse',
  },
  {
    id: 3,
    title: 'Quick Actions',
    description: `Frequently used tasks are just a click away. Upload new files, browse your document library, or manage user permissions directly from these action cards.`,
    icon: <Zap className="h-10 w-10 text-amber-500" />,
    animation: 'slide',
  },
  {
    id: 4,
    title: 'Upload Your Files',
    description: `Click "Upload Files" to add documents. Drag and drop supported. Files are automatically indexed for fast search. You can categorize and set confidentiality levels.`,
    icon: <UploadCloud className="h-10 w-10 text-indigo-500" />,
    animation: 'bounce',
  },
  {
    id: 5,
    title: 'Recent Files & Activity',
    description: `Stay on top of your documents. The recent files section shows your latest uploads, while the activity feed tracks all actions taken by you and your team.`,
    icon: <FolderOpen className="h-10 w-10 text-purple-500" />,
    animation: 'pulse',
  },
  {
    id: 6,
    title: 'You\'re All Set!',
    description: `You now know the essentials. Explore the sidebar for more features like search, notifications, and settings. Need help? Check our documentation anytime.`,
    icon: <Check className="h-10 w-10 text-green-500" />,
    animation: 'bounce',
  },
]

export function FirstLoginTutorial({ isOpen, onComplete, onSkip }: FirstLoginTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const step = tutorialSteps[currentStep]

  // Handle opening animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setCurrentStep(0)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Last step, complete tutorial
      onComplete()
    }
  }

  const getAnimationClass = () => {
    switch (step.animation) {
      case 'bounce':
        return 'animate-bounce'
      case 'pulse':
        return 'animate-pulse'
      case 'slide':
        return 'animate-slide-in-up'
      default:
        return ''
    }
  }

  if (!isVisible && !isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className={cn(
          "sm:max-w-2xl bg-white/98 backdrop-blur-2xl border-blue-100/50 shadow-2xl transition-all duration-300 overflow-hidden",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        showCloseButton={false}
      >
        {/* Decorative gradient header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <DialogHeader className="pt-6 pb-2">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {tutorialSteps.map((_, index) => (
              <div key={index} className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentStep
                      ? "w-8 bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg"
                      : index < currentStep
                        ? "w-2 h-2 bg-blue-400"
                        : "w-2 h-2 bg-gray-200"
                  )}
                />
                {index < tutorialSteps.length - 1 && (
                  <div
                    className={cn(
                      "w-4 h-0.5 transition-all duration-300",
                      index < currentStep ? "bg-blue-400" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content with icon */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={cn(
              "p-5 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100/50 shadow-lg transition-all duration-500",
              getAnimationClass()
            )}>
              {step.icon}
            </div>
            
            <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight">
              {step.title}
            </DialogTitle>
            
            <DialogDescription className="text-gray-500 text-base leading-relaxed max-w-md">
              {step.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Progress counter */}
        <div className="text-center mb-2">
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Step {currentStep + 1} of {tutorialSteps.length}
          </span>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-gray-100 mt-4">
          {/* Left side - Skip button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              Skip Tutorial
            </Button>
          </div>

          {/* Right side - Navigation buttons */}
          <div className="flex items-center gap-2">
            {/* Back button */}
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 0}
              className={cn(
                "border-gray-200 transition-all",
                currentStep === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50 hover:border-gray-300 text-gray-700"
              )}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {/* Next / Done button */}
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 min-w-[120px]"
            >
              {currentStep === tutorialSteps.length - 1 ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

function ProgressBarContent() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timerRef = useRef<NodeJS.Timeout>()
  const progressRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Start loading when route changes
    setLoading(true)
    setVisible(true)
    setProgress(30) // Initial progress

    // Simulate progress
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressRef.current)
          return 90
        }
        return prev + 10
      })
    }, 100)

    // Complete loading after delay
    timerRef.current = setTimeout(() => {
      setProgress(100)
      
      // Hide after completion
      setTimeout(() => {
        setVisible(false)
        setLoading(false)
        setProgress(0)
      }, 300)
    }, 500)

    return () => {
      clearTimeout(timerRef.current)
      clearInterval(progressRef.current)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 overflow-hidden">
      {/* Main Progress Bar */}
      <div 
        className="h-full bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      >
        {/* Shimmer Effect */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute top-0 -inset-full h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 blur-md bg-gradient-to-r from-emerald-600/50 via-blue-600/50 to-purple-600/50 animate-pulse" />

      {/* Progress Percentage (optional - hidden by default) */}
      <div className="absolute -bottom-5 right-0 text-[10px] font-medium text-emerald-600 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm">
        {Math.round(progress)}%
      </div>
    </div>
  )
}

export function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarContent />
    </Suspense>
  )
}

// Add this to your global CSS if not already present:
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(200%); }
// }
// .animate-shimmer {
//   animation: shimmer 2s infinite;
// }
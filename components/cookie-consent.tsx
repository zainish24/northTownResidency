'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShow(false)
  }

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50 animate-slide-up">
      <div className="glass-effect-strong rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-slate-900">Cookie Consent</h3>
          <button onClick={decline} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          We use cookies to enhance your browsing experience and analyze our traffic.
        </p>
        <div className="flex gap-2">
          <Button onClick={accept} size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            Accept
          </Button>
          <Button onClick={decline} size="sm" variant="outline" className="flex-1">
            Decline
          </Button>
        </div>
      </div>
    </div>
  )
}

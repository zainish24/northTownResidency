'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Building2, Phone, ArrowRight, AlertCircle, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [settings, setSettings] = useState({
    platform_name: 'NTR Properties',
    tagline: 'North Town Residency',
    logo_url: '',
    primary_color: '#10b981',
    secondary_color: '#3b82f6',
  })

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => { if (data.settings) setSettings(prev => ({ ...prev, ...data.settings })) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  const formatPhone = (val: string) => val.replace(/\D/g, '').slice(0, 11)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (phone.length < 10) {
      setError('Please enter a valid Pakistani phone number')
      return
    }
    setLoading(true)
    try {
      // Check account exists first
      const checkRes = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const checkData = await checkRes.json()
      if (!checkRes.ok) throw new Error(checkData.error)

      // Send OTP
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setStep('otp')
      setResendTimer(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.session) {
        const supabase = createClient()
        await supabase.auth.setSession(data.session)
      }

      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const LogoSection = ({ white = false }: { white?: boolean }) => (
    <div className="flex items-center gap-2">
      {settings.logo_url ? (
        <img src={settings.logo_url} alt={settings.platform_name} className="h-10 w-auto" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg"
          style={{ background: `linear-gradient(to bottom right, ${settings.primary_color}, ${settings.secondary_color})` }}>
          <Building2 className="h-5 w-5" />
        </div>
      )}
      <div className="flex flex-col">
        <span className={`font-bold text-base leading-tight ${white ? 'text-white' : 'text-slate-900'}`}>
          {settings.platform_name}
        </span>
        <span className={`text-[10px] ${white ? 'text-white/70' : 'text-slate-500'}`}>
          {settings.tagline}
        </span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075')" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-800/80 to-blue-900/90" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/"><LogoSection white /></Link>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">Find Your Dream Property in North Town Residency</h1>
            <p className="text-lg text-white/90">Browse verified property listings. Buy, sell, or rent with confidence.</p>
            <div className="flex gap-8 pt-4">
              <div><div className="text-3xl font-bold">500+</div><div className="text-sm text-white/70">Active Listings</div></div>
              <div><div className="text-3xl font-bold">1000+</div><div className="text-sm text-white/70">Happy Customers</div></div>
              <div><div className="text-3xl font-bold">24/7</div><div className="text-sm text-white/70">Support</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <LogoSection />
          </Link>

          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600" />
            <CardHeader className="text-center pt-8 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium mb-3 mx-auto">
                <Sparkles className="h-3 w-3" />
                {step === 'phone' ? 'Welcome Back' : 'Verify OTP'}
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {step === 'phone' ? 'Sign In' : 'Enter OTP'}
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                {step === 'phone'
                  ? 'Enter your registered phone number'
                  : `OTP sent to ${phone}`}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {error && (
                <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50 text-red-700 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {step === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                        <span className="text-sm text-slate-500 border-r border-slate-200 pr-2">+92</span>
                      </div>
                      <Input
                        type="tel"
                        placeholder="03001234567"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        className="pl-20 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all group"
                    disabled={loading || phone.length < 10}
                  >
                    {loading ? (
                      <><Spinner className="h-4 w-4" />Sending OTP...</>
                    ) : (
                      <>Send OTP<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-slate-600">
                      Don't have an account?{' '}
                      <Link href="/auth/signup" className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline">
                        Sign Up
                      </Link>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">6-Digit OTP</Label>
                    <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => { otpRefs.current[i] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          className="w-12 h-12 text-center text-lg font-bold border-2 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all bg-white"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 text-center">OTP expires in 10 minutes</p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                    disabled={loading || otp.join('').length !== 6}
                  >
                    {loading ? (
                      <><Spinner className="h-4 w-4" />Verifying...</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4" />Verify & Sign In</>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError('') }}
                      className="text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      ← Go Back
                    </button>
                    {resendTimer > 0 ? (
                      <span className="text-slate-400">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp as any}
                        className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Link href="/" className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

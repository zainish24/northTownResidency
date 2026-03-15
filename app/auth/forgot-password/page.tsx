'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Building2, Phone, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'phone' | 'password'>('phone')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    platform_name: 'Karachi Estates',
    tagline: 'Karachi Real Estate',
    logo_url: '',
    primary_color: '#10b981',
    secondary_color: '#3b82f6',
  })
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => { if (data.settings) setSettings(prev => ({ ...prev, ...data.settings })); setSettingsLoaded(true) })
      .catch(() => setSettingsLoaded(true))
  }, [])

  const formatPhone = (val: string) => val.replace(/\D/g, '').slice(0, 11)

  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (phone.length < 10) { setError('Please enter a valid Pakistani phone number'); return }
    setLoading(true)
    try {
      const formatted = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`
      const res = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep('password')
    } catch (err: any) {
      setError(err.message || 'Phone number not found')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const LogoSection = ({ white = false }: { white?: boolean }) => (
    <div className="flex items-center gap-3">
      {!settingsLoaded ? (
        <>
          <div className={`h-16 w-16 rounded-xl animate-pulse flex-shrink-0 ${white ? 'bg-white/20' : 'bg-slate-200'}`} />
          <div className="flex flex-col gap-1.5">
            <div className={`h-5 w-36 rounded animate-pulse ${white ? 'bg-white/20' : 'bg-slate-200'}`} />
            <div className={`h-3 w-24 rounded animate-pulse ${white ? 'bg-white/10' : 'bg-slate-100'}`} />
          </div>
        </>
      ) : (
        <>
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.platform_name} className="h-16 w-auto" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl text-white shadow-lg flex-shrink-0"
              style={{ background: `linear-gradient(to bottom right, ${settings.primary_color}, ${settings.secondary_color})` }}>
              <Building2 className="h-8 w-8" />
            </div>
          )}
          <div className="flex flex-col">
            <span className={`font-bold text-xl leading-tight ${white ? 'text-white' : 'text-slate-900'}`}>{settings.platform_name}</span>
            <span className={`text-xs ${white ? 'text-white/70' : 'text-slate-500'}`}>{settings.tagline}</span>
          </div>
        </>
      )}
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
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">Reset Your Password</h1>
            <p className="text-lg text-white/90">Enter your registered phone number to reset your password securely.</p>
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
                {step === 'phone' ? 'Forgot Password' : 'Set New Password'}
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {success ? 'Password Reset!' : step === 'phone' ? 'Enter Phone Number' : 'Create New Password'}
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                {success ? 'Your password has been updated successfully' : step === 'phone' ? 'We will verify your registered phone number' : `Setting new password for +92${phone.replace(/^0/, '')}`}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {success ? (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                  </div>
                  <Link href="/auth/login">
                    <Button className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl">
                      Go to Login
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {error && (
                    <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50 text-red-700 rounded-xl">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  {step === 'phone' ? (
                    <form onSubmit={handleCheckPhone} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                            <span className="text-sm text-slate-500 border-r border-slate-200 pr-2">+92</span>
                          </div>
                          <Input type="tel" placeholder="03001234567" value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            className="pl-20 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                            required disabled={loading} />
                        </div>
                      </div>
                      <Button type="submit"
                        className="w-full h-11 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl shadow-lg transition-all group"
                        disabled={loading || phone.length < 10}>
                        {loading ? <><Spinner className="h-4 w-4" />Verifying...</> : <>Continue<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">New Password</Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                          <Input type={showNew ? 'text' : 'password'} placeholder="Min 6 characters" value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pl-10 pr-10 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                            required disabled={loading} />
                          <button type="button" onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Confirm Password</Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                          <Input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter new password" value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`pl-10 pr-10 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400' : ''}`}
                            required disabled={loading} />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {confirmPassword && confirmPassword !== newPassword && (
                          <p className="text-xs text-red-500">Passwords do not match</p>
                        )}
                      </div>

                      <Button type="submit"
                        className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl shadow-lg transition-all"
                        disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}>
                        {loading ? <><Spinner className="h-4 w-4" />Resetting...</> : 'Reset Password'}
                      </Button>

                      <button type="button" onClick={() => { setStep('phone'); setError('') }}
                        className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        ← Change Number
                      </button>
                    </form>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Link href="/auth/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

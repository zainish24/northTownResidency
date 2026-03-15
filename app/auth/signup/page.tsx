'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Building2, Phone, ArrowRight, AlertCircle, User, Sparkles, CheckCircle, ArrowLeft, Lock, Eye, EyeOff, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const USER_TYPES = [
  { value: 'individual', emoji: '👤', label: 'Individual' },
  { value: 'agent', emoji: '🏢', label: 'Agent' },
  { value: 'developer', emoji: '🏗️', label: 'Developer' },
]

export default function SignupPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [userType, setUserType] = useState('individual')
  const [agencyName, setAgencyName] = useState('')
  const [error, setError] = useState('')
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (phone.length < 10) { setError('Please enter a valid Pakistani phone number'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if ((userType === 'agent' || userType === 'developer') && !agencyName.trim()) {
      setError(`Please enter your ${userType === 'agent' ? 'agency' : 'company'} name`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, name, userType, agencyName: agencyName.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.session) {
        const supabase = createClient()
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Signup failed')
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
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1996')" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-purple-800/80 to-emerald-900/90" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/"><LogoSection white /></Link>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">Start Your Property Journey Today</h1>
            <p className="text-lg text-white/90">Join thousands of property owners and buyers.</p>
            <div className="space-y-3 pt-4">
              {['Post unlimited property listings', 'Connect with verified buyers', 'Get instant notifications', '24/7 customer support'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
                Join {settings.platform_name}
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">Create Account</CardTitle>
              <CardDescription className="text-slate-500 text-sm">Sign up to post and manage your property listings</CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {error && (
                <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50 text-red-700 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <Input type="text" placeholder="Enter your full name" value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      required disabled={loading} />
                  </div>
                </div>

                {/* Phone */}
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

                {/* Password */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      required disabled={loading} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Confirm Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <Input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 pr-10 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all ${
                        confirmPassword && confirmPassword !== password ? 'border-red-400' : ''
                      }`}
                      required disabled={loading} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                {/* User Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">I am a</Label>
                  <div className="flex gap-2">
                    {USER_TYPES.map((type) => (
                      <button key={type.value} type="button" onClick={() => setUserType(type.value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl border-2 text-sm font-medium transition-all ${
                          userType === type.value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 hover:border-emerald-300 text-slate-600'
                        }`}>
                        <span>{type.emoji}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agency / Company Name */}
                {(userType === 'agent' || userType === 'developer') && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {userType === 'agent' ? 'Agency Name' : 'Company Name'}
                    </Label>
                    <div className="relative group">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                      <Input type="text"
                        placeholder={userType === 'agent' ? 'e.g. Ali Properties' : 'e.g. Skyline Developers'}
                        value={agencyName} onChange={(e) => setAgencyName(e.target.value)}
                        className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                        required disabled={loading} />
                    </div>
                  </div>
                )}

                <Button type="submit"
                  className="w-full h-11 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all group"
                  disabled={loading || !name || phone.length < 10 || password.length < 6 || password !== confirmPassword}>
                  {loading ? <><Spinner className="h-4 w-4" />Creating Account...</> : <>Create Account<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline">Sign In</Link>
                  </p>
                </div>
              </form>
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

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Building2, Mail, ArrowRight, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
      .then(data => {
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      
      if (usePassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        })
        
        if (signInError) throw signInError
        window.location.href = '/dashboard'
      } else {
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
        })

        if (signInError) throw signInError
        router.push('/auth/check-email')
      }

    } catch (error: any) {
      console.error('Login error:', error)
      if (error.message?.includes('rate limit')) {
        setError('Too many requests. Try password login instead.')
        setUsePassword(true)
      } else {
        setError(error.message || 'Invalid credentials. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-800/80 to-blue-900/90" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-3 group">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={settings.platform_name} 
                className="h-12 w-auto group-hover:scale-105 transition-transform" 
              />
            ) : (
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105" 
                style={{ background: `linear-gradient(to bottom right, ${settings.primary_color}, ${settings.secondary_color})` }}
              >
                <Building2 className="h-6 w-6" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-tight">{settings.platform_name}</span>
              <span className="text-xs text-white/80">{settings.tagline}</span>
            </div>
          </Link>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Find Your Dream Property in North Town Residency
            </h1>
            <p className="text-lg text-white/90">
              Browse thousands of verified property listings. Buy, sell, or rent with confidence.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-white/70">Active Listings</div>
              </div>
              <div>
                <div className="text-3xl font-bold">1000+</div>
                <div className="text-sm text-white/70">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-white/70">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center group">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={settings.platform_name} 
                className="h-10 w-auto group-hover:scale-105 transition-transform" 
              />
            ) : (
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105" 
                style={{ background: `linear-gradient(to bottom right, ${settings.primary_color}, ${settings.secondary_color})` }}
              >
                <Building2 className="h-5 w-5" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight text-slate-900">{settings.platform_name}</span>
              <span className="text-[10px] text-slate-500">{settings.tagline}</span>
            </div>
          </Link>

          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600" />
            
            <CardHeader className="text-center pt-8 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-3 mx-auto">
                <Sparkles className="h-3 w-3" />
                Welcome Back
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">Sign In</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Enter your email to receive a magic link
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {error && (
                <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50 text-red-700 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {usePassword ? 'Enter your password' : 'We\'ll send a magic link to your email'}
                  </p>
                </div>

                {usePassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      required={usePassword}
                      disabled={loading}
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all group"
                  disabled={loading || !email || (usePassword && !password)}
                >
                  {loading ? (
                    <>
                      <Spinner className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      {usePassword ? 'Sign In' : 'Send Magic Link'}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setUsePassword(!usePassword)}
                  className="w-full text-xs text-slate-500 hover:text-emerald-600 transition-colors"
                >
                  {usePassword ? '← Use magic link instead' : 'Use password instead →'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Don't have an account?{' '}
                  <Link href="/auth/signup" className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline">
                    Sign Up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <Link
            href="/"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

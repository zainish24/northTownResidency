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
import { 
  Building2, ArrowRight, AlertCircle, User, Sparkles, Mail, CheckCircle
} from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    platform_name: 'Karachi Estates',
    tagline: 'Karachi Real Estate',
    logo_url: '/logo.png',
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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          data: {
            name: name,
          },
        },
      })

      if (signInError) throw signInError

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Magic link sent! Check Supabase Dashboard → Authentication → Logs for the link')
      }

      router.push('/auth/check-email')
      
    } catch (error: any) {
      console.error('Signup error:', error)
      if (error.message?.includes('rate limit')) {
        setError('Too many requests. Please try again after 1 hour or use a different email.')
      } else {
        setError(error.message || 'Something went wrong. Please try again.')
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
            backgroundImage: "url('https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1996')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-purple-800/80 to-emerald-900/90" />
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
              Start Your Property Journey Today
            </h1>
            <p className="text-lg text-white/90">
              Join thousands of property owners and buyers. Post listings, connect with buyers, and grow your business.
            </p>
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>Post unlimited property listings</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>Connect with verified buyers</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>Get instant notifications</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>24/7 customer support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
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
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium mb-3 mx-auto">
                <Sparkles className="h-3 w-3" />
                Join {settings.platform_name}
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">Create Account</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Sign up to post and manage your property listings
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {error && (
                <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50 text-red-700 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Full Name
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

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
                  <p className="text-xs text-slate-500">We'll send a magic link to your email</p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all group"
                  disabled={loading || !name || !email}
                >
                  {loading ? (
                    <>
                      <Spinner className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Magic Link
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-slate-500 mt-6 text-center">
            By signing up, you agree to receive property updates and promotional emails.
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'

function VerifyOTPContent() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const action = searchParams.get('action') // 'login' or 'signup'

  useEffect(() => {
    // Check if we have the required data based on action
    if (action === 'signup') {
      const name = sessionStorage.getItem('signup_name')
      const phone = sessionStorage.getItem('signup_phone')
      if (!name || !phone) {
        router.push('/auth/signup')
        return
      }
    } else if (action === 'login') {
      const phone = sessionStorage.getItem('login_phone')
      if (!phone) {
        router.push('/auth/login')
        return
      }
    } else {
      router.push('/auth/login')
    }
  }, [action, router])

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP')
        setLoading(false)
        return
      }

      if (action === 'signup') {
        // Handle signup verification
        const userName = sessionStorage.getItem('signup_name')
        const phone = sessionStorage.getItem('signup_phone')
        const storedOtp = sessionStorage.getItem('signup_otp')

        if (!userName || !phone || !storedOtp) {
          setError('Session expired. Please try signing up again.')
          setLoading(false)
          return
        }

        // Verify OTP
        if (otp !== storedOtp) {
          setError('Invalid OTP. Please try again.')
          setLoading(false)
          return
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Create user account with Supabase (without phone auth)
        const supabase = createClient()
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: `${phone.replace('+', '')}@ntr.local`, // Create email from phone
          password: Math.random().toString(36) + Date.now().toString(), // Random password
        })

        if (signUpError) {
          throw signUpError
        }

        // Update user profile with name and phone
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: userName,
            phone: phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }

        // Clear session data
        sessionStorage.removeItem('signup_name')
        sessionStorage.removeItem('signup_phone')
        sessionStorage.removeItem('signup_otp')

        // Redirect to dashboard
        router.push('/dashboard')

      } else if (action === 'login') {
        // Handle login verification
        const phone = sessionStorage.getItem('login_phone')
        const storedOtp = sessionStorage.getItem('login_otp')

        if (!phone || !storedOtp) {
          setError('Session expired. Please try logging in again.')
          setLoading(false)
          return
        }

        // Verify OTP
        if (otp !== storedOtp) {
          setError('Invalid OTP. Please try again.')
          setLoading(false)
          return
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Sign in with Supabase using email/password (since phone auth is disabled)
        const supabase = createClient()
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: `${phone.replace('+', '')}@ntr.local`,
          password: 'default_password_ntr2024', // Use a default password for phone users
        })

        if (signInError) {
          // If user doesn't exist, create them
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: `${phone.replace('+', '')}@ntr.local`,
            password: 'default_password_ntr2024',
          })

          if (signUpError) {
            throw signUpError
          }

          // Update profile with phone
          if (signUpData.user) {
            await supabase.from('profiles').upsert({
              id: signUpData.user.id,
              phone: phone,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        }

        // Clear session data
        sessionStorage.removeItem('login_phone')
        sessionStorage.removeItem('login_otp')

        // Redirect to dashboard
        router.push('/dashboard')
      }

    } catch (error: any) {
      console.error('OTP verification error:', error)
      setError(error.message || 'Failed to verify OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)
    setError('')

    try {
      let phone = ''
      if (action === 'signup') {
        phone = sessionStorage.getItem('signup_phone') || ''
      } else if (action === 'login') {
        phone = sessionStorage.getItem('login_phone') || ''
      }

      if (!phone) {
        setError('Session expired. Please try again.')
        setResendLoading(false)
        return
      }

      // Simulate resending OTP
      console.log('Resending OTP to:', phone)
      await new Promise(resolve => setTimeout(resolve, 1000))

      setError('') // Clear any previous errors

    } catch (error: any) {
      console.error('Resend OTP error:', error)
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  const getTitle = () => {
    return action === 'signup' ? 'Verify Your Phone' : 'Enter Verification Code'
  }

  const getDescription = () => {
    const phone = action === 'signup'
      ? sessionStorage.getItem('signup_phone')
      : sessionStorage.getItem('login_phone')
    return `We've sent a 6-digit code to ${phone || 'your phone'}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{getTitle()}</CardTitle>
          <CardDescription className="text-center">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendOTP}
              disabled={resendLoading}
            >
              {resendLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Sending...
                </>
              ) : (
                'Resend Code'
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => router.push(action === 'signup' ? '/auth/signup' : '/auth/login')}
                className="text-sm"
              >
                Back to {action === 'signup' ? 'Sign Up' : 'Login'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md h-96 bg-white rounded-lg shadow animate-pulse" />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  )
}

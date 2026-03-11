import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json()

    console.log('Login attempt - Phone:', phone, 'OTP:', otp)

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 })
    }

    // TESTING MODE: Accept any 6-digit OTP
    if (otp.length !== 6) {
      return NextResponse.json({ error: 'OTP must be 6 digits' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Create temp email from phone for auth
    const tempEmail = `${phone.replace(/[^0-9]/g, '')}@ntr.temp`
    const tempPassword = 'NTR2024temp'

    console.log('Trying to sign in with email:', tempEmail)

    // Try to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password: tempPassword
    })

    if (signInError) {
      console.log('Sign in error:', signInError.message)
      return NextResponse.json({ 
        error: 'Invalid phone number or user not found' 
      }, { status: 404 })
    }

    console.log('Login successful!')
    return NextResponse.json({ 
      success: true,
      message: 'Login successful'
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: Request) {
  try {
    const { phone, otp, name } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 })
    }

    const formatted = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`

    // Step 1: Verify OTP with Twilio
    let result
    try {
      result = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verificationChecks.create({ to: formatted, code: otp })
    } catch (twilioError: any) {
      if (twilioError.status === 404) {
        return NextResponse.json({ error: 'OTP expired or already used. Please request a new one.' }, { status: 400 })
      }
      throw twilioError
    }

    if (result.status !== 'approved') {
      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 })
    }

    // Step 2: Use Supabase phone auth (no email involved)
    const supabase = await createClient()

    // Try sign in with phone
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      phone: formatted,
      password: `KE@${formatted.replace(/\+/g, '')}#2024`,
    })

    if (!signInError && signInData.session) {
      return NextResponse.json({ success: true, session: signInData.session })
    }

    // User doesn't exist — sign up with phone
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      phone: formatted,
      password: `KE@${formatted.replace(/\+/g, '')}#2024`,
    })

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 500 })
    }

    // Create profile
    if (signUpData.user) {
      await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        phone: formatted,
        full_name: name || null,
        role: 'user',
        is_active: true,
      })
    }

    return NextResponse.json({ success: true, session: signUpData.session })

  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}

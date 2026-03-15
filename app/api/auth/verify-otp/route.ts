import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: Request) {
  try {
    const { phone, otp, name, userType } = await request.json()
    if (!phone || !otp) return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 })

    const formatted = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`

    // Step 1: Verify OTP with Twilio
    try {
      const result = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verificationChecks.create({ to: formatted, code: otp })
      if (result.status !== 'approved') {
        return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 })
      }
    } catch (e: any) {
      if (e.status === 404) return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 400 })
      throw e
    }

    // Step 2: Sign in or sign up via Supabase phone auth
    const supabase = await createClient()

    // Send OTP via Supabase to get session
    await supabase.auth.signInWithOtp({ phone: formatted })

    // Verify with Supabase to get session
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: 'sms',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Save/update profile
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        phone: formatted,
        full_name: name || null,
        role: userType || 'individual',
        is_blocked: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }

    return NextResponse.json({ success: true, session: data.session })

  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}

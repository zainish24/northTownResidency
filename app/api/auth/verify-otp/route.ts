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

    // Step 2: Sign in or sign up with Supabase phone auth
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: 'sms',
    })

    if (error || !data.session) {
      return NextResponse.json({ error: error?.message || 'Authentication failed. Please try again.' }, { status: 400 })
    }

    // Step 3: Upsert profile (for new users or update phone if missing)
    await supabase.from('profiles').upsert({
      id: data.user!.id,
      phone: formatted,
      full_name: name || null,
      role: 'user',
      is_blocked: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    return NextResponse.json({ success: true, session: data.session })

  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}

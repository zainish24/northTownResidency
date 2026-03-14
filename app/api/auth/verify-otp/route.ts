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

    // Verify OTP with Twilio
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

    const supabase = await createClient()

    // Check if user already exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formatted)
      .single()

    if (existingProfile) {
      // LOGIN: user exists — sign in with phone OTP (Supabase)
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: otp,
        type: 'sms',
      })
      if (error) {
        // fallback: just return success since Twilio already verified
        return NextResponse.json({ success: true, session: null })
      }
      return NextResponse.json({ success: true, session: data.session })
    } else {
      // SIGNUP: new user
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: otp,
        type: 'sms',
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Save profile
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          phone: formatted,
          full_name: name || null,
          role: 'user',
          is_blocked: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      }

      return NextResponse.json({ success: true, session: data.session })
    }

  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}

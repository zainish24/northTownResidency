import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json()
    if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 })

    const formatted = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`
    const supabase = await createClient()

    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formatted)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'No account found. Please sign up first.' }, { status: 404 })
    }

    // If OTP provided — verify it
    if (otp) {
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

      // OTP verified — sign in via Supabase phone auth
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formatted,
      })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Verify OTP with Supabase to get session
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: otp,
        type: 'sms',
      })

      if (verifyError) return NextResponse.json({ error: verifyError.message }, { status: 400 })

      return NextResponse.json({ success: true, session: verifyData.session })
    }

    // No OTP — send OTP via Twilio
    try {
      const verification = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verifications.create({ to: formatted, channel: 'sms' })

      if (verification.status !== 'pending') {
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
      }
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Failed to send OTP' }, { status: 500 })
    }

    return NextResponse.json({ success: true, otpSent: true })

  } catch (error: any) {
    console.error('Phone login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

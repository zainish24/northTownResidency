import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

function getCredentials(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const salt = process.env.AUTH_SECRET || 'ke-default-salt-change-in-prod'
  const hash = createHash('sha256').update(`${digits}:${salt}`).digest('hex').slice(0, 32)
  return {
    email: `u${digits}@ke.internal`,
    password: `KE!${hash}`,
  }
}

export async function POST(request: Request) {
  try {
    const { phone, checkOnly, otp } = await request.json()
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

    // Step 1: Just check existence
    if (checkOnly) {
      return NextResponse.json({ success: true, exists: true })
    }

    // Step 2: Verify OTP then login
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

      const { email, password } = getCredentials(formatted)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 400 })
      return NextResponse.json({ success: true, session: data.session })
    }

    // Step 3: Send OTP
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

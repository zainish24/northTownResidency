import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

function getCredentials(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return {
    email: `u${digits}@ke.internal`,
    password: `KE#${digits}#2024!`,
  }
}

export async function POST(request: Request) {
  try {
    const { phone, otp, name, userType } = await request.json()
    if (!phone || !otp) return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 })

    const formatted = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`

    // Verify OTP with Twilio
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

    const supabase = await createClient()
    const { email, password } = getCredentials(formatted)

    // Try sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (!signInError && signInData.session) {
      if (name) {
        await supabase.from('profiles').update({ full_name: name, updated_at: new Date().toISOString() }).eq('id', signInData.user.id)
      }
      return NextResponse.json({ success: true, session: signInData.session })
    }

    // New user — sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) return NextResponse.json({ error: signUpError.message }, { status: 500 })

    if (signUpData.user) {
      await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        phone: formatted,
        full_name: name || null,
        role: userType || 'individual',
        is_blocked: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }

    const { data: finalSignIn } = await supabase.auth.signInWithPassword({ email, password })
    return NextResponse.json({ success: true, session: finalSignIn.session })

  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

// In-memory rate limit store (resets on server restart)
// For production, use Redis or DB
const otpAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(phone: string): boolean {
  const now = Date.now()
  const record = otpAttempts.get(phone)

  if (!record || now > record.resetAt) {
    otpAttempts.set(phone, { count: 1, resetAt: now + 60 * 60 * 1000 }) // 1 hour window
    return true
  }

  if (record.count >= 3) return false

  record.count++
  return true
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    const formatted = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`

    // Rate limit check
    if (!checkRateLimit(formatted)) {
      return NextResponse.json({ 
        error: 'Too many OTP requests. Please try again after 1 hour.' 
      }, { status: 429 })
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to: formatted, channel: 'sms' })

    if (verification.status !== 'pending') {
      return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 })
  }
}

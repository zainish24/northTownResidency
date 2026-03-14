import { NextResponse } from 'next/server'
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    const formatted = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`

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

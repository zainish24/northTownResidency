import { NextRequest, NextResponse } from 'next/server'
import { SMSService } from '@/lib/sms-service'

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      )
    }

    // Validate phone number format (Pakistani numbers)
    const phoneRegex = /^\+92[0-9]{10}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid Pakistani phone number format' },
        { status: 400 }
      )
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'OTP must be 6 digits' },
        { status: 400 }
      )
    }

    const smsService = new SMSService()
    const success = await smsService.sendOTP(phone, otp)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to send SMS' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('SMS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
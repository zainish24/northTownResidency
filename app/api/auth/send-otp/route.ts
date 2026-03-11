import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SMSService } from '@/lib/sms-service'
import { TEST_MODE, getTestOTP } from '@/lib/test-config'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // TEMPORARY: Skip SMS for testing - any OTP will work
    console.log(`📱 Login attempt for: ${phone}`)

    return NextResponse.json({ 
      success: true,
      message: 'Enter any 6-digit OTP to continue (test mode)'
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

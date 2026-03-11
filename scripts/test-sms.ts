// Test SMS Service
// Run with: npx tsx scripts/test-sms.ts

import { SMSService } from '../lib/sms-service'

async function testSMS() {
  console.log('🧪 Testing SMS Service...\n')

  const smsService = new SMSService()

  // Test Pakistani phone numbers
  const testPhones = [
    '+923001234567',
    '+923211234567',
    '+923331234567'
  ]

  for (const phone of testPhones) {
    console.log(`Sending OTP to ${phone}...`)
    const success = await smsService.sendOTP(phone, '123456')
    console.log(`Result: ${success ? '✅ Success' : '❌ Failed'}\n`)
  }
}

// Only run if called directly
if (require.main === module) {
  testSMS().catch(console.error)
}

export { testSMS }
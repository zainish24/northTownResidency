// Test Mode Configuration
// Enable this to test OTP without sending real SMS

export const TEST_MODE = true // Set to false in production

export const TEST_OTPS: Record<string, string> = {
  '+923001234567': '123456',
  '+923009876543': '654321',
  '03001234567': '123456',
  '03009876543': '654321',
}

export function getTestOTP(phone: string): string | null {
  if (!TEST_MODE) return null
  
  // Try with +92 prefix
  if (TEST_OTPS[phone]) return TEST_OTPS[phone]
  
  // Try without +92 prefix
  const withoutPrefix = phone.replace('+92', '0')
  if (TEST_OTPS[withoutPrefix]) return TEST_OTPS[withoutPrefix]
  
  // Default test OTP for any number in test mode
  return '123456'
}

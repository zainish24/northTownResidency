// SMS Service - Supports Multiple Providers
// Switch provider by changing SMS_PROVIDER in .env.local

type SMSProvider = 'unifonic' | 'telenor' | 'jazz' | 'eocean' | 'twilio' | 'mock'

interface SMSConfig {
  provider: SMSProvider
  apiKey: string
  senderId?: string
  accountSid?: string // For Twilio
  authToken?: string // For Twilio
}

export class SMSService {
  private config: SMSConfig

  constructor() {
    this.config = {
      provider: (process.env.SMS_PROVIDER as SMSProvider) || 'mock',
      apiKey: process.env.SMS_API_KEY || '',
      senderId: process.env.SMS_SENDER_ID || 'NTR',
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
    }
  }

  async sendOTP(phone: string, otp: string): Promise<boolean> {
    const message = `Your NTR Properties verification code is ${otp}. Valid for 5 minutes.`

    try {
      switch (this.config.provider) {
        case 'unifonic':
          return await this.sendViaUnifonic(phone, message)
        case 'telenor':
          return await this.sendViaTelenor(phone, message)
        case 'jazz':
          return await this.sendViaJazz(phone, message)
        case 'eocean':
          return await this.sendViaEocean(phone, message)
        case 'twilio':
          return await this.sendViaTwilio(phone, message)
        case 'mock':
          return await this.sendViaMock(phone, message)
        default:
          throw new Error('Invalid SMS provider')
      }
    } catch (error) {
      console.error('SMS send error:', error)
      return false
    }
  }

  // Unifonic API
  private async sendViaUnifonic(phone: string, message: string): Promise<boolean> {
    const response = await fetch('https://api.unifonic.com/rest/SMS/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Recipient: phone,
        Body: message,
        SenderID: this.config.senderId,
      }),
    })
    return response.ok
  }

  // Telenor API (Update with actual endpoint when available)
  private async sendViaTelenor(phone: string, message: string): Promise<boolean> {
    const response = await fetch('https://telenor-api-endpoint.com/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        sender: this.config.senderId,
      }),
    })
    return response.ok
  }

  // Jazz API (Update with actual endpoint when available)
  private async sendViaJazz(phone: string, message: string): Promise<boolean> {
    const response = await fetch('https://jazz-api-endpoint.com/sms', {
      method: 'POST',
      headers: {
        'API-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobile: phone,
        text: message,
        sender_id: this.config.senderId,
      }),
    })
    return response.ok
  }

  // Eocean API
  private async sendViaEocean(phone: string, message: string): Promise<boolean> {
    const response = await fetch('https://eocean.us/api/sendsms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.config.apiKey,
        to: phone,
        message: message,
        from: this.config.senderId,
      }),
    })
    return response.ok
  }

  // Twilio API (Free trial available)
  private async sendViaTwilio(phone: string, message: string): Promise<boolean> {
    if (!this.config.accountSid || !this.config.authToken) {
      throw new Error('Twilio Account SID and Auth Token required')
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        From: this.config.apiKey, // Twilio phone number
        Body: message,
      }),
    })
    return response.ok
  }

  // Mock SMS for testing (logs to console)
  private async sendViaMock(phone: string, message: string): Promise<boolean> {
    console.log('📱 MOCK SMS SENT:')
    console.log('To:', phone)
    console.log('Message:', message)
    console.log('Provider: Mock (Testing Mode)')
    console.log('='.repeat(50))

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return true
  }
}

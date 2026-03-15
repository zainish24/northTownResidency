import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getCredentials(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return {
    email: `u${digits}@ke.internal`,
    password: `KE#${digits}#2024!`,
  }
}

export async function POST(request: Request) {
  try {
    const { phone, checkOnly } = await request.json()
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

    // If only checking existence, return success
    if (checkOnly) {
      return NextResponse.json({ success: true, exists: true })
    }

    const { email, password } = getCredentials(formatted)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 400 })

    return NextResponse.json({ success: true, session: data.session })
  } catch (error: any) {
    console.error('Phone login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

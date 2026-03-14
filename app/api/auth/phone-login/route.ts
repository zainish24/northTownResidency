import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    const formatted = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`
    const supabase = await createClient()

    // Check if user exists in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formatted)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'No account found with this number. Please sign up first.' }, { status: 404 })
    }

    // Sign in with phone
    const { data, error } = await supabase.auth.signInWithPassword({
      phone: formatted,
      password: `KE@${formatted.replace(/\+/g, '')}#2024`,
    })

    if (error) {
      return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, session: data.session })
  } catch (error: any) {
    console.error('Phone login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

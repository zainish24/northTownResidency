import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password required' }, { status: 400 })
    }

    const formatted = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`
    const fakeEmail = `${formatted.replace('+', '')}@ntr.app`

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    })

    if (error || !data.session) {
      return NextResponse.json({ error: 'Invalid phone number or password' }, { status: 401 })
    }

    return NextResponse.json({ success: true, session: data.session })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 })
  }
}

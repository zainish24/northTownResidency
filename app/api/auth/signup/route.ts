import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { phone, password, name, userType, agencyName } = await request.json()

    if (!phone || !password || !name) {
      return NextResponse.json({ error: 'Name, phone and password required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const formatted = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`
    const fakeEmail = `${formatted.replace('+', '')}@ntr.app`

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formatted)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Account already exists. Please login.' }, { status: 409 })
    }

    const { data, error } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
      options: { data: { phone: formatted, full_name: name } },
    })

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Signup failed' }, { status: 400 })
    }

    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    await adminClient.from('profiles').upsert({
      id: data.user.id,
      phone: formatted,
      full_name: name,
      role: 'user',
      is_blocked: false,
    }, { onConflict: 'id' })

    return NextResponse.json({ success: true, session: data.session })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Signup failed' }, { status: 500 })
  }
}

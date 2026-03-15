import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { phone, newPassword } = await request.json()

    if (!phone || !newPassword) {
      return NextResponse.json({ error: 'Phone and new password required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const formatted = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`
    const fakeEmail = `${formatted.replace('+', '')}@ntr.app`

    // Need service role key to update any user's password
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check phone exists
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('phone', formatted)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'No account found with this phone number' }, { status: 404 })
    }

    // Update password using admin API
    const { error } = await adminClient.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 })
  }
}

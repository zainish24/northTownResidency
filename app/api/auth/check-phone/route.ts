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

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formatted)
      .single()

    if (!data) {
      return NextResponse.json({ error: 'No account found. Please sign up first.' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

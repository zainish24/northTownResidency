import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const popular = searchParams.get('popular')

    const supabase = await createClient()
    let query = supabase.from('areas').select('*').eq('is_active', true).order('display_order')
    if (popular === 'true') query = query.eq('is_popular', true)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const slug = searchParams.get('slug')

    const supabase = await createClient()
    let query = supabase.from('developers').select('*').eq('is_active', true).order('name')

    if (featured === 'true') query = query.eq('is_featured', true)
    if (slug) query = query.eq('slug', slug).single() as any

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

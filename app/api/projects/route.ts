import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const area_id = searchParams.get('area_id')
    const developer_id = searchParams.get('developer_id')
    const slug = searchParams.get('slug')

    const supabase = await createClient()
    let query = supabase
      .from('projects')
      .select('*, area:areas(id,name,slug), developer:developers(id,name,slug,logo_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (featured === 'true') query = query.eq('is_featured', true)
    if (area_id) query = query.eq('area_id', area_id)
    if (developer_id) query = query.eq('developer_id', developer_id)
    if (slug) query = query.eq('slug', slug).single() as any

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

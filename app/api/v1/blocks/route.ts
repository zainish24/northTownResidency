import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phaseId = searchParams.get('phase_id')

    const supabase = await createClient()
    
    let query = supabase
      .from('blocks')
      .select('*, phase:phases(name)')
      .eq('is_active', true)

    if (phaseId) {
      query = query.eq('phase_id', phaseId)
    }

    const { data: blocks, error } = await query.order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: blocks })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

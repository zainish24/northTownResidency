import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phaseId = searchParams.get('phase_id')
    
    const supabase = await createClient()
    
    const { data: blocks, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('phase_id', phaseId)
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    
    return NextResponse.json({ blocks: blocks || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

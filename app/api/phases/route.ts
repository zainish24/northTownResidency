import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: phases, error } = await supabase
      .from('phases')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    
    if (error) throw error
    
    return NextResponse.json({ phases: phases || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

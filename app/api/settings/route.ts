import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  const settings: Record<string, string> = {}
  data?.forEach(item => {
    settings[item.key] = item.value || ''
  })
  
  return NextResponse.json({ settings })
}

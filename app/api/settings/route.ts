import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value')
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Convert array to object
  const settings: Record<string, string> = {}
  data?.forEach(item => {
    settings[item.setting_key] = item.setting_value || ''
  })
  
  return NextResponse.json({ settings })
}

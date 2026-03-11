import { createClient } from '@/lib/supabase/server'

export async function getSiteSettings() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value')
  
  if (error || !data) {
    return {
      site_name: 'NTR Properties',
      site_tagline: 'North Town Residency',
      site_logo: '/logo.png',
      primary_color: '#10b981',
      secondary_color: '#3b82f6',
      contact_phone: '+92 300 1234567',
      contact_email: 'info@ntrproperties.pk',
      contact_whatsapp: '+923001234567',
      facebook_url: '',
      instagram_url: '',
      twitter_url: '',
    }
  }
  
  // Convert array to object
  const settings: Record<string, string> = {}
  data.forEach(item => {
    settings[item.setting_key] = item.setting_value || ''
  })
  
  return settings
}

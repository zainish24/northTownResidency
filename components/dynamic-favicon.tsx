'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DynamicFavicon() {
  const [faviconUrl, setFaviconUrl] = useState('')

  useEffect(() => {
    const loadFavicon = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'favicon_url')
        .single()

      if (data?.setting_value) {
        setFaviconUrl(data.setting_value)
        
        // Update favicon dynamically
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
        link.type = 'image/x-icon'
        link.rel = 'shortcut icon'
        link.href = data.setting_value
        document.getElementsByTagName('head')[0].appendChild(link)
      }
    }

    loadFavicon()
  }, [])

  return null
}

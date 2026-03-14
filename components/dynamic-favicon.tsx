'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DynamicFavicon() {
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'favicon_url')
          .single()

        const faviconUrl = data?.setting_value || '/logo.png'

        // Update existing favicon links instead of removing
        const existing = document.querySelectorAll("link[rel*='icon']")
        if (existing.length > 0) {
          existing.forEach((el) => {
            (el as HTMLLinkElement).href = faviconUrl + '?v=' + Date.now()
          })
        } else {
          const link = document.createElement('link')
          link.rel = 'icon'
          link.type = 'image/png'
          link.href = faviconUrl + '?v=' + Date.now()
          document.head.appendChild(link)
        }
      } catch (e) {
        // silently fail
      }
    }

    loadFavicon()
  }, [])

  return null
}

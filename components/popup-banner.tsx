'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import Image from 'next/image'

export function PopupBanner() {
  const [banner, setBanner] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const fetchBanner = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('position', 'popup')
        .eq('is_active', true)
        .order('display_order')
        .limit(1)
        .single()

      if (data) {
        const lastShown = localStorage.getItem('popup_banner_shown')
        const now = Date.now()
        
        if (!lastShown || now - parseInt(lastShown) > 24 * 60 * 60 * 1000) {
          setBanner(data)
          setTimeout(() => setShow(true), 1000)
        }
      }
    }

    fetchBanner()
  }, [])

  const handleClose = () => {
    setShow(false)
    localStorage.setItem('popup_banner_shown', Date.now().toString())
  }

  const handleClick = async () => {
    if (banner.link_url) {
      const supabase = createClient()
      await supabase
        .from('banners')
        .update({ clicks_count: (banner.clicks_count || 0) + 1 })
        .eq('id', banner.id)
      
      window.open(banner.link_url, '_blank')
    }
    handleClose()
  }

  if (!show || !banner) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-2xl w-full mx-4 animate-scale-in">
        <button
          onClick={handleClose}
          className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all group"
        >
          <X className="h-5 w-5" />
        </button>

        <div 
          className="relative bg-white rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
          onClick={handleClick}
        >
          <div className="relative w-full aspect-[16/10]">
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              className="object-cover"
            />
          </div>
          
          {(banner.title || banner.description) && (
            <div className="p-6 text-center">
              {banner.title && (
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{banner.title}</h3>
              )}
              {banner.description && (
                <p className="text-slate-600">{banner.description}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

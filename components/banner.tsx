'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface BannerProps {
  position: 'home_top' | 'home_middle' | 'home_bottom'
}

export function Banner({ position }: BannerProps) {
  const [banners, setBanners] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchBanners()
  }, [position])

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length)
      }, 5000) // Change banner every 5 seconds
      return () => clearInterval(interval)
    }
  }, [banners])

  const fetchBanners = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('position', position)
      .eq('is_active', true)
      .order('display_order')

    if (data && data.length > 0) {
      setBanners(data)
    }
  }

  const handleClick = async (banner: any) => {
    const supabase = createClient()
    await supabase
      .from('banners')
      .update({ click_count: (banner.click_count || 0) + 1 })
      .eq('id', banner.id)

    if (banner.link_url) {
      window.open(banner.link_url, '_blank')
    }
  }

  if (banners.length === 0) return null

  const currentBanner = banners[currentIndex]

  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-lg group">
      <div 
        className="relative w-full h-64 md:h-80 cursor-pointer"
        onClick={() => handleClick(currentBanner)}
      >
        <Image
          src={currentBanner.image_url}
          alt={currentBanner.title}
          fill
          className="object-cover"
          priority
        />
        
        {/* Overlay with title */}
        {currentBanner.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <h3 className="text-white text-xl font-bold">{currentBanner.title}</h3>
            {currentBanner.description && (
              <p className="text-white/90 text-sm mt-1">{currentBanner.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Dots indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

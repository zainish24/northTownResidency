'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface WatermarkedImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  priority?: boolean
  watermarkSize?: 'sm' | 'md' | 'lg'
  watermarkOpacity?: number
  blurOnLoad?: boolean
}

export function WatermarkedImage({ 
  src, 
  alt, 
  className = '', 
  fill, 
  width, 
  height, 
  priority = false,
  watermarkSize = 'md',
  watermarkOpacity = 0.15,
  blurOnLoad = true
}: WatermarkedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [logoUrl, setLogoUrl] = useState('/logo.png')

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.site_logo) {
          setLogoUrl(data.settings.site_logo)
        }
      })
      .catch(() => {})
  }, [])

  // Determine watermark size
  const watermarkSizeClass = {
    sm: 'w-16 h-auto',
    md: 'w-24 h-auto',
    lg: 'w-32 h-auto'
  }[watermarkSize]

  // Fallback image
  const fallbackSrc = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop'

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100">
      {/* Main Image */}
      {fill ? (
        <Image
          src={error ? fallbackSrc : src}
          alt={alt}
          fill
          className={cn(
            'object-cover transition-all duration-700',
            blurOnLoad && isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0',
            className
          )}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          onError={() => setError(true)}
        />
      ) : (
        <Image
          src={error ? fallbackSrc : src}
          alt={alt}
          width={width || 800}
          height={height || 600}
          className={cn(
            'object-cover transition-all duration-700',
            blurOnLoad && isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0',
            className
          )}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          onError={() => setError(true)}
        />
      )}

      {/* Loading Skeleton */}
      {isLoading && blurOnLoad && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Watermark - Multiple for better effect */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Main Watermark */}
        <img 
          src={logoUrl} 
          alt="Watermark" 
          className={cn(
            watermarkSizeClass,
            'opacity-0 group-hover:opacity-15 transition-opacity duration-500 select-none',
            isLoading && 'opacity-0'
          )}
          style={{ opacity: isLoading ? 0 : watermarkOpacity }}
        />
      </div>

      {/* Corner Watermark (Repeated) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rotate-12 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <img src={logoUrl} alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 -rotate-12 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <img src={logoUrl} alt="" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Image Count Badge - Optional, can be passed as prop later */}
      {!isLoading && !error && (
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Click to view</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
          <div className="text-center">
            <svg className="h-8 w-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-slate-500">Image not available</p>
          </div>
        </div>
      )}
    </div>
  )
}
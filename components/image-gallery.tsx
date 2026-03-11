'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, ZoomIn, ImageIcon } from 'lucide-react'
import type { ListingImage } from '@/lib/types'

interface ImageGalleryProps {
  images: ListingImage[]
  title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [watermarkUrl, setWatermarkUrl] = useState('/logo.png')

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.watermark_url) {
          setWatermarkUrl(data.settings.watermark_url)
        }
      })
      .catch(() => {})
  }, [])

  if (images.length === 0) {
    return (
      <div className="aspect-[16/10] rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <ImageIcon className="h-16 w-16 mx-auto mb-2 opacity-50" />
          <p>No images available</p>
        </div>
      </div>
    )
  }

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main Image */}
        <div 
          className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted cursor-pointer group"
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={images[selectedIndex].image_url}
            alt={`${title} - Image ${selectedIndex + 1}`}
            fill
            className="object-cover"
            priority
          />
          {/* Watermark */}
          {watermarkUrl && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <img 
                src={watermarkUrl} 
                alt="Watermark" 
                className="opacity-20 w-40 h-auto"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 rounded-full p-3">
                <ZoomIn className="h-6 w-6 text-foreground" />
              </div>
            </div>
          </div>
          
          {/* Image counter */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                className={`relative shrink-0 w-20 h-16 rounded-lg overflow-hidden transition-all ${
                  index === selectedIndex 
                    ? 'ring-2 ring-primary ring-offset-2' 
                    : 'opacity-70 hover:opacity-100'
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <Image
                  src={image.image_url}
                  alt={`${title} - Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">{title} - Image Gallery</DialogTitle>
          <div className="relative aspect-[16/10]">
            <Image
              src={images[selectedIndex].image_url}
              alt={`${title} - Image ${selectedIndex + 1}`}
              fill
              className="object-contain"
            />
            {/* Watermark in Lightbox */}
            {watermarkUrl && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <img 
                  src={watermarkUrl} 
                  alt="Watermark" 
                  className="opacity-30 w-48 h-auto"
                />
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-4 py-2 rounded-full">
              {selectedIndex + 1} of {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

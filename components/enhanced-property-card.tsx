'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Listing } from '@/lib/types'
import { 
  MapPin, Maximize, Bed, Bath, CornerUpRight, Trees, Sun, 
  Hammer, Heart, MessageCircle, Clock, Eye, Star, Home, Store,
  Ruler, ChevronRight, Camera
} from 'lucide-react'
import { getIconComponent } from '@/lib/icon'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface EnhancedPropertyCardProps {
  listing: Listing
  showStatus?: boolean
}

export function EnhancedPropertyCard({ listing, showStatus = false }: EnhancedPropertyCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [whatsappNumber, setWhatsappNumber] = useState('923001234567')
  const [watermarkUrl, setWatermarkUrl] = useState('/logo.png')
  const router = useRouter()
  const primaryImage = listing.listing_images?.find(img => img.is_primary) || listing.listing_images?.[0]
  
  useEffect(() => {
    const checkSaved = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      setUser(user)
      
      if (!user) {
        setIsSaved(false)
        return
      }
      
      // Check if listing is saved in database
      const { data } = await supabase
        .from('saved_listings')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listing.id)
        .single()
      
      setIsSaved(!!data)
    }
    
    // Fetch WhatsApp number and watermark from settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.whatsapp_number) {
          setWhatsappNumber(data.settings.whatsapp_number.replace(/[^0-9]/g, ''))
        }
        if (data.settings?.watermark_url) {
          setWatermarkUrl(data.settings.watermark_url)
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
    
    checkSaved()
  }, [listing.id])

  const handleCardClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault()
      router.push('/auth/login')
      return
    }
  }
  
  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `PKR ${(price / 10000000).toFixed(2)} Cr`
    } else if (price >= 100000) {
      return `PKR ${(price / 100000).toFixed(2)} Lac`
    }
    return `PKR ${price.toLocaleString()}`
  }

  const getSize = () => {
    if (listing.property_type === 'residential_plot' && listing.plot_size_sqyd) {
      return `${listing.plot_size_sqyd} Sq Yd`
    }
    if (listing.property_type === 'commercial_shop' && listing.shop_size_sqft) {
      return `${listing.shop_size_sqft} Sq Ft`
    }
    return null
  }

  const getDaysPosted = () => {
    const days = Math.floor((Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const message = `Hi, I'm interested in your property: ${listing.title} - ${formatPrice(listing.price)}`
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      alert('Please login to save listings')
      router.push('/auth/login')
      return
    }
    
    const supabase = createClient()
    
    try {
      if (isSaved) {
        // Unsave from database
        await supabase
          .from('saved_listings')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listing.id)
        
        setIsSaved(false)
      } else {
        // Save to database
        await supabase
          .from('saved_listings')
          .insert({ user_id: user.id, listing_id: listing.id })
        
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error saving listing:', error)
    }
  }

  const getPositionBadges = () => {
    const badges: Array<{ icon: any; label: string }> = []
    if (listing.is_corner) badges.push({ icon: CornerUpRight, label: 'Corner' })
    if (listing.is_park_facing) badges.push({ icon: Trees, label: 'Park' })
    if (listing.is_west_open) badges.push({ icon: Sun, label: 'West Open' })

    // include any amenities that were joined with the listing
    if (listing.listing_amenities && listing.listing_amenities.length) {
      listing.listing_amenities.forEach((la: any) => {
        const AmenIcon = getIconComponent(la.amenity.icon)
        badges.push({ icon: AmenIcon, label: la.amenity.name })
      })
    }

    return badges
  }

  const getStatusColor = () => {
    switch(listing.status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full border border-slate-200 hover:border-emerald-200 bg-white rounded-xl w-full">
      <Link href={`/listings/${listing.id}`} className="block h-full w-full" onClick={handleCardClick}>
        {/* Image Container - Compact */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 w-full">
          {primaryImage ? (
            <>
              <Image
                src={primaryImage.image_url}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              />
              {/* Light Watermark */}
              {watermarkUrl && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                  <img 
                    src={watermarkUrl} 
                    alt="Watermark" 
                    className="w-20 h-auto"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
              <Home className="h-10 w-10 text-slate-400" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-20">
            <Badge className="bg-emerald-600 text-white border-0 text-xs px-2 py-1 font-semibold shadow-md">
              {listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
            </Badge>
            
            {listing.is_featured && (
              <Badge className="bg-amber-500 text-white border-0 text-xs px-2 py-1 font-semibold shadow-md">
                <Star className="h-3 w-3 mr-1 fill-white" />
                Featured
              </Badge>
            )}
          </div>
          
          {/* Save Button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-md hover:scale-110 transition-transform duration-300 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 z-20"
            onClick={handleSave}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
          </Button>

          {/* Image Count */}
          {listing.listing_images && listing.listing_images.length > 0 && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 z-20">
              <Camera className="h-3 w-3" />
              {listing.listing_images.length}
            </div>
          )}
          
          {/* Price */}
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-emerald-600 text-white border-0 text-base font-bold shadow-lg py-1.5 px-3">
              {formatPrice(listing.price)}
              {listing.price_type === 'negotiable' && (
                <span className="ml-1.5 text-[10px] font-normal opacity-80">Neg.</span>
              )}
            </Badge>
          </div>
        </div>

        {/* Content - Compact */}
        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300">
            {listing.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="line-clamp-1">
              {listing.block?.name && `${listing.block.name}, `}{listing.phase?.name}
            </span>
          </div>

          {/* Property Type & Size */}
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="font-medium bg-slate-50 text-slate-700 border-slate-200">
              {listing.property_type === 'residential_plot' ? 'Plot' : 'Shop'}
            </Badge>
            
            {getSize() && (
              <span className="flex items-center gap-1 text-slate-600">
                <Ruler className="h-3.5 w-3.5 text-emerald-600" />
                {getSize()}
              </span>
            )}
          </div>

          {/* Features Row - Compact */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
            {/* Days Posted */}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              {getDaysPosted()}
            </span>

            {/* Views */}
            {listing.views_count ? (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                {listing.views_count}
              </span>
            ) : null}

            {/* Construction Features */}
            {listing.has_construction && listing.bedrooms && (
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5 text-emerald-600" />
                {listing.bedrooms}
              </span>
            )}
            
            {listing.has_construction && listing.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5 text-emerald-600" />
                {listing.bathrooms}
              </span>
            )}

            {/* Position Badges */}
            {getPositionBadges().map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1">
                <Icon className="h-3.5 w-3.5 text-emerald-600" />
                {label}
              </span>
            ))}
          </div>

          {/* WhatsApp Button - Compact */}
          <Button
            size="sm"
            className="w-full mt-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs py-2 h-8"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            Chat on WhatsApp
          </Button>
        </CardContent>
      </Link>
    </Card>
  )
}
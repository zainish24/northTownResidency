'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Listing } from '@/lib/types'
import { MapPin, Bed, Bath, Heart, MessageCircle, Clock, Eye, Star, Home, Ruler, Camera, CornerUpRight, Trees, Sun } from 'lucide-react'
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
  const [whatsappNumber, setWhatsappNumber] = useState('923000000000')
  const router = useRouter()

  const primaryImage = listing.listing_images?.find(img => img.is_primary) || listing.listing_images?.[0]

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('favorites').select('user_id').eq('user_id', user.id).eq('listing_id', listing.id).single()
          .then(({ data }) => setIsSaved(!!data))
      }
    })
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.settings?.whatsapp_number) setWhatsappNumber(d.settings.whatsapp_number.replace(/[^0-9]/g, ''))
    }).catch(() => {})
  }, [listing.id])

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(2)} Cr`
    if (price >= 100000) return `PKR ${(price / 100000).toFixed(2)} Lac`
    return `PKR ${price.toLocaleString()}`
  }

  const getSize = () => {
    if (!listing.area_size) return null
    return `${listing.area_size} ${listing.area_unit || 'sqft'}`
  }

  const getDaysPosted = () => {
    const days = Math.floor((Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const msg = `Hi, I'm interested in: ${listing.title} - ${formatPrice(listing.price)}`
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { router.push('/auth/login'); return }
    const supabase = createClient()
    if (isSaved) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listing.id)
      setIsSaved(false)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: listing.id })
      setIsSaved(true)
    }
  }

  const locationText = [
    listing.area?.name,
    listing.project?.name,
  ].filter(Boolean).join(' · ')

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full border border-slate-200 hover:border-emerald-200 bg-white rounded-xl w-full">
      <Link href={`/listings/${listing.id}`} className="block h-full w-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 w-full">
          {primaryImage ? (
            <Image
              src={primaryImage.image_url}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
              <Home className="h-10 w-10 text-slate-400" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-20">
            <Badge className="bg-emerald-600 text-white border-0 text-xs px-2 py-1 font-semibold shadow-md">
              {listing.purpose === 'sale' ? 'For Sale' : 'For Rent'}
            </Badge>
            {listing.is_featured && (
              <Badge className="bg-amber-500 text-white border-0 text-xs px-2 py-1 font-semibold shadow-md">
                <Star className="h-3 w-3 mr-1 fill-white" /> Featured
              </Badge>
            )}
            {showStatus && listing.status && (
              <Badge className={`border-0 text-xs px-2 py-1 font-semibold shadow-md ${listing.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : listing.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {listing.status}
              </Badge>
            )}
          </div>

          <Button size="icon" variant="secondary"
            className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-md hover:scale-110 transition-transform bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 z-20"
            onClick={handleSave}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
          </Button>

          {listing.listing_images && listing.listing_images.length > 0 && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 z-20">
              <Camera className="h-3 w-3" /> {listing.listing_images.length}
            </div>
          )}

          <div className="absolute bottom-3 right-3">
            <Badge className="bg-emerald-600 text-white border-0 text-base font-bold shadow-lg py-1.5 px-3">
              {formatPrice(listing.price)}
              {listing.price_type === 'negotiable' && <span className="ml-1.5 text-[10px] font-normal opacity-80">Neg.</span>}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300">
            {listing.title}
          </h3>

          {locationText && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="line-clamp-1">{locationText}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs">
            {listing.property_type && (
              <Badge variant="outline" className="font-medium bg-slate-50 text-slate-700 border-slate-200">
                {listing.property_type.name}
              </Badge>
            )}
            {getSize() && (
              <span className="flex items-center gap-1 text-slate-600">
                <Ruler className="h-3.5 w-3.5 text-emerald-600" /> {getSize()}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-emerald-600" />{getDaysPosted()}</span>
            {listing.views_count ? <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-emerald-600" />{listing.views_count}</span> : null}
            {listing.bedrooms ? <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5 text-emerald-600" />{listing.bedrooms}</span> : null}
            {listing.bathrooms ? <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-emerald-600" />{listing.bathrooms}</span> : null}
            {listing.is_corner && <span className="flex items-center gap-1"><CornerUpRight className="h-3.5 w-3.5 text-emerald-600" />Corner</span>}
            {listing.is_park_facing && <span className="flex items-center gap-1"><Trees className="h-3.5 w-3.5 text-emerald-600" />Park</span>}
            {listing.is_west_open && <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-emerald-600" />West Open</span>}
          </div>

          <Button size="sm" className="w-full mt-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs py-2 h-8" onClick={handleWhatsApp}>
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Chat on WhatsApp
          </Button>
        </CardContent>
      </Link>
    </Card>
  )
}

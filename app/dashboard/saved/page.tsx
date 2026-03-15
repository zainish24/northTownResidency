'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MapPin, Home, ArrowRight, Trash2, Share2, MessageCircle, Facebook, Twitter, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function SavedPage() {
  const router = useRouter()
  const [savedListings, setSavedListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) { router.push('/auth/login'); return }
      setUser(user)
      loadSavedListings(user.id)
    })
  }, [router])

  const loadSavedListings = async (userId: string) => {
    try {
      const supabase = createClient()
      const { data: favData } = await supabase.from('favorites').select('listing_id').eq('user_id', userId)
      if (!favData || favData.length === 0) { setLoading(false); return }

      const ids = favData.map(f => f.listing_id)
      const { data } = await supabase
        .from('listings')
        .select('*, area:areas(id,name,slug), project:projects(id,name,slug), property_type:property_types(id,name,slug,icon), listing_images(id,image_url,is_primary,display_order)')
        .in('id', ids)

      if (data) setSavedListings(data as any)
    } catch (err) {
      console.error('Failed to load saved listings:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(2)} Cr`
    if (price >= 100000) return `PKR ${(price / 100000).toFixed(2)} Lac`
    return `PKR ${price.toLocaleString()}`
  }

  const handleRemove = async (listingId: string) => {
    if (!user) return
    const supabase = createClient()
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId)
    setSavedListings(prev => prev.filter(l => l.id !== listingId))
  }

  const shareToplatform = (platform: string) => {
    if (!selectedListing) return
    const url = `${window.location.origin}/listings/${selectedListing.id}`
    const text = `Check out this property: ${selectedListing.title} - ${formatPrice(selectedListing.price)}`
    switch (platform) {
      case 'whatsapp': window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank'); break
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank'); break
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank'); break
      case 'copy': navigator.clipboard.writeText(url); alert('Link copied!'); setShareDialogOpen(false); break
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading your saved listings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-emerald-600 fill-emerald-600" /> Saved Listings
        </h1>
        <p className="text-slate-600 mt-1 text-sm">{savedListings.length} {savedListings.length === 1 ? 'property' : 'properties'} saved</p>
      </div>

      {savedListings.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
          <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Saved Listings Yet</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">Click the heart icon on any listing to save it.</p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href="/listings">Browse Properties <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {savedListings.map((listing) => {
              const primaryImage = listing.listing_images?.find(img => img.is_primary) || listing.listing_images?.[0]
              const locationText = [(listing as any).area?.name, (listing as any).project?.name].filter(Boolean).join(' · ')
              return (
                <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full border-0 shadow-md rounded-xl">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {primaryImage ? (
                      <img src={primaryImage.image_url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200"><Home className="w-8 h-8 text-slate-400" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                    <button onClick={() => handleRemove(listing.id)} className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors z-10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-block px-2 py-1 bg-white/90 text-slate-900 rounded-full text-xs font-semibold">
                        {listing.purpose === 'sale' ? 'For Sale' : 'For Rent'}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">{listing.title}</h3>
                    <p className="text-lg font-bold text-emerald-600 mb-2">{formatPrice(listing.price)}</p>
                    {locationText && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 mb-3">
                        <MapPin className="w-3 h-3" /><span>{locationText}</span>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Button asChild size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7">
                        <Link href={`/listings/${listing.id}`}>View Details</Link>
                      </Button>
                      <Button size="sm" variant="outline" className="px-2 h-7" onClick={() => { setSelectedListing(listing); setShareDialogOpen(true) }}>
                        <Share2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="text-center mt-8">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-sm">
              <Link href="/listings">Continue Browsing <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </>
      )}

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this property</DialogTitle>
            <DialogDescription>Share this listing with your friends and family</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button variant="outline" className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200" onClick={() => shareToplatform('whatsapp')}><MessageCircle className="h-4 w-4" />WhatsApp</Button>
            <Button variant="outline" className="gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200" onClick={() => shareToplatform('facebook')}><Facebook className="h-4 w-4" />Facebook</Button>
            <Button variant="outline" className="gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200" onClick={() => shareToplatform('twitter')}><Twitter className="h-4 w-4" />Twitter</Button>
            <Button variant="outline" className="gap-2" onClick={() => shareToplatform('copy')}><Copy className="h-4 w-4" />Copy Link</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

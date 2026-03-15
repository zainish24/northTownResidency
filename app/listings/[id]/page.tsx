import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageGallery } from '@/components/image-gallery'
import { ContactReveal } from '@/components/contact-reveal'
import { EnhancedPropertyCard } from '@/components/enhanced-property-card'
import { ListingActions } from '@/components/listing-actions'
import {
  MapPin, MessageCircle, Bed, Bath, CornerUpRight, Trees, Sun, Route,
  Calendar, ChevronRight, Camera, Star, Clock, Ruler, ArrowLeft, ArrowRight
} from 'lucide-react'
import { getIconComponent } from '@/lib/icon'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('listings').select('title, description, price').eq('id', id).single()
  if (!data) return { title: 'Property Not Found' }
  return {
    title: data.title,
    description: data.description || `Property in Karachi. Price: PKR ${data.price.toLocaleString()}`,
  }
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing, error } = await supabase
    .from('listings')
    .select(`*, area:areas(*), project:projects(*, developer:developers(id,name,slug)), property_type:property_types(*), images:listing_images(*), listing_amenities:listing_amenities(amenity:amenities(id,slug,name,icon))`)
    .eq('id', id)
    .single()

  if (error || !listing) notFound()

  supabase.from('listings').update({ views_count: (listing.views_count || 0) + 1 }).eq('id', id).then(() => {})

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(2)} Cr`
    if (price >= 100000) return `PKR ${(price / 100000).toFixed(2)} Lac`
    return `PKR ${price.toLocaleString()}`
  }

  const getTimeAgo = (date: string) => {
    const days = Math.ceil(Math.abs(Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  const sortedImages = [...(listing.images || [])].sort((a: any, b: any) => {
    if (a.is_primary) return -1
    if (b.is_primary) return 1
    return a.display_order - b.display_order
  })

  const { data: similarListings } = await supabase
    .from('listings')
    .select('*, area:areas(id,name,slug), project:projects(id,name,slug), property_type:property_types(id,name,slug,icon), listing_images(id,image_url,is_primary,display_order)')
    .eq('area_id', listing.area_id)
    .neq('id', listing.id)
    .eq('status', 'approved')
    .limit(4)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-white">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-slate-500 hover:text-emerald-600">Home</Link>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <Link href="/listings" className="text-slate-500 hover:text-emerald-600">Properties</Link>
              {listing.area && (
                <>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <Link href={`/areas/${listing.area.slug}`} className="text-slate-500 hover:text-emerald-600">{listing.area.name}</Link>
                </>
              )}
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="text-slate-700 font-medium truncate">{listing.title}</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/listings" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-4 lg:hidden">
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left */}
            <div className="lg:col-span-2 space-y-5">
              {/* Gallery */}
              <div className="relative bg-white rounded-xl overflow-hidden shadow-md border border-slate-200">
                <ImageGallery images={sortedImages} title={listing.title} />
                <div className="absolute top-3 left-3 z-20 flex gap-1.5">
                  <Badge className="bg-emerald-600 text-white border-0 px-2 py-1 text-xs">
                    {listing.purpose === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                  </Badge>
                  {listing.property_type && (
                    <Badge className="bg-blue-600 text-white border-0 px-2 py-1 text-xs">{listing.property_type.name.toUpperCase()}</Badge>
                  )}
                  {listing.is_featured && (
                    <Badge className="bg-amber-500 text-white border-0 px-2 py-1 text-xs">
                      <Star className="h-3 w-3 mr-1 fill-white" /> FEATURED
                    </Badge>
                  )}
                </div>
                <div className="absolute bottom-3 right-3 z-20 bg-black/60 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                  <Camera className="h-3 w-3" /> {sortedImages.length}
                </div>
              </div>

              {/* Title & Price */}
              <Card className="border-0 shadow-md rounded-xl">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 mb-2">{listing.title}</h1>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <span>
                          {listing.address && `${listing.address}, `}
                          {listing.area?.name}
                          {listing.project && ` · ${listing.project.name}`}
                        </span>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-2xl font-bold text-emerald-600">{formatPrice(listing.price)}</div>
                      {listing.price_type === 'negotiable' && <span className="text-xs text-slate-500">Negotiable</span>}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <ListingActions listingId={listing.id} listingTitle={listing.title} listingPrice={formatPrice(listing.price)} viewsCount={listing.views_count || 0} />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Specs */}
              <div className="grid grid-cols-4 gap-3">
                {listing.area_size && (
                  <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-200">
                    <Ruler className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-slate-900">{listing.area_size} {listing.area_unit}</div>
                    <div className="text-xs text-slate-500">Size</div>
                  </div>
                )}
                {listing.bedrooms && (
                  <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-200">
                    <Bed className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-slate-900">{listing.bedrooms}</div>
                    <div className="text-xs text-slate-500">Beds</div>
                  </div>
                )}
                {listing.bathrooms && (
                  <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-200">
                    <Bath className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-slate-900">{listing.bathrooms}</div>
                    <div className="text-xs text-slate-500">Baths</div>
                  </div>
                )}
                <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-200">
                  <Clock className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-slate-900">{getTimeAgo(listing.created_at)}</div>
                  <div className="text-xs text-slate-500">Posted</div>
                </div>
              </div>

              {/* Features */}
              {(listing.is_corner || listing.is_road_facing || listing.is_park_facing || listing.is_west_open || listing.listing_amenities?.length > 0) && (
                <Card className="border-0 shadow-sm rounded-xl">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-slate-900 mb-3">Features & Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {listing.is_corner && <Badge className="bg-orange-100 text-orange-700 border-0 px-3 py-1.5 text-xs"><CornerUpRight className="h-3 w-3 mr-1" />Corner Plot</Badge>}
                      {listing.is_road_facing && <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1.5 text-xs"><Route className="h-3 w-3 mr-1" />Road Facing</Badge>}
                      {listing.is_park_facing && <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1.5 text-xs"><Trees className="h-3 w-3 mr-1" />Park Facing</Badge>}
                      {listing.is_west_open && <Badge className="bg-yellow-100 text-yellow-700 border-0 px-3 py-1.5 text-xs"><Sun className="h-3 w-3 mr-1" />West Open</Badge>}
                      {listing.listing_amenities?.map((la: any) => {
                        const Icon = getIconComponent(la.amenity.icon)
                        return (
                          <Badge key={la.amenity.id} className="bg-slate-100 text-slate-700 border-0 px-3 py-1.5 text-xs">
                            <Icon className="h-3 w-3 mr-1" />{la.amenity.name}
                          </Badge>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              {listing.description && (
                <Card className="border-0 shadow-sm rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-emerald-600" /> Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 leading-relaxed">{listing.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Project Info */}
              {listing.project && (
                <Card className="border-0 shadow-sm rounded-xl">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-slate-900 mb-2">Project</h3>
                    <Link href={`/projects/${listing.project.slug}`} className="flex items-center gap-3 hover:text-emerald-600 transition-colors">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{listing.project.name}</p>
                        {listing.project.developer && <p className="text-xs text-slate-500">by {listing.project.developer.name}</p>}
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto text-slate-400" />
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <ContactReveal listingId={listing.id} listingTitle={listing.title} listingPrice={formatPrice(listing.price)} />
                <Card className="border-0 shadow-sm rounded-xl bg-slate-50">
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Listing ID:</span>
                        <span className="font-mono text-slate-700">KE-{listing.id.slice(0, 6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Posted:</span>
                        <span className="text-slate-700">{new Date(listing.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Views:</span>
                        <span className="text-slate-700">{listing.views_count || 0}</span>
                      </div>
                      {listing.construction_status && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Status:</span>
                          <span className="text-slate-700 capitalize">{listing.construction_status.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarListings && similarListings.length > 0 && (
          <section className="bg-slate-50 border-t border-slate-200 mt-6 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Similar Properties</h2>
                  <p className="text-xs text-slate-500 mt-0.5">You may also like</p>
                </div>
                <Link href="/listings" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {similarListings.map((p: any) => <EnhancedPropertyCard key={p.id} listing={p} />)}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}

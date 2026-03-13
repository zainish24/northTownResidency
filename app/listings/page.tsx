import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { EnhancedPropertyCard } from '@/components/enhanced-property-card'
import { ListingsFilters } from '@/components/listings-filters'
import { ContactAgentDialog } from '@/components/contact-agent-dialog'
import { Button } from '@/components/ui/button'
import { 
  Building2, Search, Sparkles, MapPin, TrendingUp, ChevronRight, 
  Home, Store, Grid3x3, LayoutGrid,
  SlidersHorizontal, ArrowUpDown, Filter, X, CheckCircle2, Star, Clock, Award,
  BadgeCheck, Heart, Eye, Share2, Download, Upload, Camera,
  Video, MessageCircle, Phone, Mail, Calendar, BarChart3,
  PieChart, Target, Rocket, Globe, Lock, Key, Briefcase,
  GraduationCap, Hospital, Utensils, Car, Bike, Trees,
  Droplets, Wind, Sun, Moon, Compass, Gem, Trophy, Zap,
  Ruler, Bell
} from 'lucide-react'
import { getIconComponent } from '@/lib/icon'
import type { Listing, Phase, Block } from '@/lib/types'

interface ListingsPageProps {
  searchParams: Promise<{
    phase_id?: string
    block_id?: string
    property_type?: string
    listing_type?: string
    min_price?: string
    max_price?: string
    is_corner?: string
    is_road_facing?: string
    is_park_facing?: string
    is_west_open?: string
    has_construction?: string
    search?: string
    page?: string
    sort?: string
  }>
}

interface ListingsContentProps {
  searchParams: Promise<{
    phase_id?: string
    block_id?: string
    property_type?: string
    listing_type?: string
    min_price?: string
    max_price?: string
    is_corner?: string
    is_road_facing?: string
    is_park_facing?: string
    is_west_open?: string
    has_construction?: string
    amenities?: string
    search?: string
    page?: string
    sort?: string
  }>
  phases: Phase[]
  blocks: Block[]
  amenities: any[]
}

async function ListingsContent({ searchParams, phases, blocks, amenities: amenitiesProp }: ListingsContentProps) {
  const params = await searchParams
  const supabase = await createClient()
  const currentPage = parseInt(params.page || '1')
  const limit = 12

  // Fetch site settings for logo (key-value structure)
  const { data: settingsData } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['logo_url', 'platform_name'])

  // Convert key-value pairs to object
  const settings: any = {}
  settingsData?.forEach((item: any) => {
    settings[item.setting_key] = item.setting_value
  })

  // Fetch active amenities so we can filter by slug->id later
  const amenityMap: Record<string, string> = {}
  const amenityNameMap: Record<string, string> = {}
  if (Array.isArray(amenitiesProp)) {
    amenitiesProp.forEach((a: any) => {
      amenityMap[a.slug] = a.id
      amenityNameMap[a.slug] = a.name
    })
  }

  // Build query with all relations
  let query = supabase
    .from('listings')
    .select(`
      *,
      phase:phases(*),
      block:blocks(*),
      listing_images(*)
    `)
    .eq('is_active', true)
    .eq('status', 'approved')

  // Apply filters
  if (params.phase_id) {
    query = query.eq('phase_id', params.phase_id)
  }
  if (params.block_id) {
    query = query.eq('block_id', params.block_id)
  }
  if (params.property_type) {
    query = query.eq('property_type', params.property_type)
  }
  if (params.listing_type) {
    query = query.eq('listing_type', params.listing_type)
  }
  if (params.min_price) {
    query = query.gte('price', parseInt(params.min_price))
  }
  if (params.max_price) {
    query = query.lte('price', parseInt(params.max_price))
  }
  if (params.is_corner === 'true') {
    query = query.eq('is_corner', true)
  }
  if (params.is_road_facing === 'true') {
    query = query.eq('is_road_facing', true)
  }
  if (params.is_park_facing === 'true') {
    query = query.eq('is_park_facing', true)
  }
  if (params.is_west_open === 'true') {
    query = query.eq('is_west_open', true)
  }
  if (params.has_construction === 'true') {
    query = query.eq('has_construction', true)
  }
  // amenity slugs filter (comma separated)
  if (params.amenities) {
    const slugs = params.amenities.split(',').filter(Boolean)
    const ids: string[] = []
    // some premium features still stored as boolean columns
    const booleanMap: Record<string, string> = {
      'corner-plot': 'is_corner',
      'road-facing': 'is_road_facing',
      'park-facing': 'is_park_facing',
      'west-open': 'is_west_open'
    }

    slugs.forEach((slug) => {
      if (booleanMap[slug]) {
        query = query.eq(booleanMap[slug], true)
      }
      if (amenityMap[slug]) {
        ids.push(amenityMap[slug])
      }
    })

    if (ids.length > 0) {
      query = query.in('listing_amenities.amenity_id', ids)
    }
  }
  if (params.search) {
    query = query.ilike('title', `%${params.search}%`)
  }

  // Apply sorting
  const sortField = params.sort || 'created_at'
  const sortOrder = sortField.startsWith('-') ? 'desc' : 'asc'
  const field = sortField.replace('-', '')
  
  if (field === 'price') {
    query = query.order('price', { ascending: sortOrder === 'asc' })
  } else if (field === 'created_at') {
    query = query.order('created_at', { ascending: false })
  } else if (field === 'size') {
    query = query.order('plot_size_sqyd', { ascending: sortOrder === 'asc' })
  }

  // Get total count for pagination
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })

  // Execute query with pagination
  const { data: listings, error } = await query
    .order('is_featured', { ascending: false })
    .range((currentPage - 1) * limit, currentPage * limit - 1)

  if (error) {
    console.error('Error fetching listings:', error)
  }

  const totalPages = Math.ceil((count || 0) / limit)

  // Get stats for active filters
  const getActiveFilterCount = () => {
    let count = 0
    if (params.phase_id) count++
    if (params.block_id) count++
    if (params.property_type) count++
    if (params.listing_type) count++
    if (params.min_price || params.max_price) count++
    if (params.is_corner === 'true') count++
    if (params.is_road_facing === 'true') count++
    if (params.is_park_facing === 'true') count++
    if (params.is_west_open === 'true') count++
    if (params.has_construction === 'true') count++
    if (params.amenities) {
      const arr = params.amenities.split(',').filter(Boolean)
      count += arr.length
    }
    return count
  }

  return (
    <div className="space-y-6">
      {/* pass amenities to filter component - removed duplicate call */}

      {/* Results Header - Compact */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/50 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="w-6 h-6 object-contain" />
                ) : (
                  <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {listings?.length || 0} Properties
                </h2>
                {getActiveFilterCount() > 0 && (
                  <span className="text-xs text-slate-500">
                    {getActiveFilterCount()} filters applied
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sort Dropdown */}
          <select 
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer hover:border-emerald-500 transition-colors"
            defaultValue={params.sort || 'newest'}
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="size-asc">Size: Small to Large</option>
            <option value="size-desc">Size: Large to Small</option>
          </select>
        </div>
      </div>

      {/* Active Filters - Compact */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
          <span className="text-xs font-medium text-slate-500 mr-1">Active:</span>
          
          {params.phase_id && (
            <span className="px-2 py-1 bg-white text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm border border-emerald-200">
              {phases?.find(p => p.id === params.phase_id)?.name || 'Phase'}
              <button className="hover:text-emerald-900">×</button>
            </span>
          )}
          
          {params.property_type === 'residential_plot' && (
            <span className="px-2 py-1 bg-white text-blue-700 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm border border-blue-200">
              <Home className="h-3 w-3" />
              Residential
              <button className="hover:text-blue-900">×</button>
            </span>
          )}
          
          {params.property_type === 'commercial_shop' && (
            <span className="px-2 py-1 bg-white text-amber-700 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm border border-amber-200">
              <Store className="h-3 w-3" />
              Commercial
              <button className="hover:text-amber-900">×</button>
            </span>
          )}
          
          {params.min_price && (
            <span className="px-2 py-1 bg-white text-purple-700 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm border border-purple-200">
              PKR {parseInt(params.min_price).toLocaleString()}
              <button className="hover:text-purple-900">×</button>
            </span>
          )}
          {params.amenities && (
            params.amenities.split(',').filter(Boolean).map((slug) => (
              <span key={slug} className="px-2 py-1 bg-white text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm border border-slate-200">
                {amenityNameMap[slug] || slug}
                <button className="hover:text-slate-900">×</button>
              </span>
            ))
          )}
          
          <Link 
            href="/listings" 
            className="text-xs text-slate-500 hover:text-emerald-600 underline ml-auto"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* Listings Grid */}
      {listings && listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing: Listing) => (
              <div key={listing.id} className="h-full transform hover:scale-[1.02] transition-all duration-300">
                <EnhancedPropertyCard listing={listing} />
              </div>
            ))}
          </div>

          {/* Pagination - Compact */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <Link
                  href={`?${new URLSearchParams({ ...params, page: (currentPage - 1).toString() }).toString()}`}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentPage <= 1 
                      ? 'opacity-50 cursor-not-allowed pointer-events-none bg-slate-100 text-slate-400'
                      : 'bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 hover:shadow-md'
                  }`}
                >
                  Previous
                </Link>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Link
                      key={pageNum}
                      href={`?${new URLSearchParams({ ...params, page: pageNum.toString() }).toString()}`}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 ${
                        pageNum === currentPage
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg hover:shadow-xl'
                          : 'bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 hover:shadow-md'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  )
                })}

                <Link
                  href={`?${new URLSearchParams({ ...params, page: (currentPage + 1).toString() }).toString()}`}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentPage >= totalPages 
                      ? 'opacity-50 cursor-not-allowed pointer-events-none bg-slate-100 text-slate-400'
                      : 'bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 hover:shadow-md'
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          )}
        </>
      ) : (
        // No Results State - Compact
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-white/50 backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-12">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <div className="max-w-md space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">No Properties Found</h3>
            <p className="text-slate-600">
              Try adjusting your search criteria or browse our popular categories below.
            </p>
          </div>

          <div className="space-y-3 w-full max-w-lg">
            <p className="text-sm font-medium text-slate-700">Popular Searches:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Phase 1', 'Phase 2', 'Residential', 'Commercial', 'Corner Plots'].map((term, i) => (
                <Link
                  key={i}
                  href={`/listings?search=${term.toLowerCase()}`}
                  className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 transition-all text-xs font-medium shadow-sm hover:shadow"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <Link
              href="/listings"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-medium hover:shadow-xl transition-all text-sm"
            >
              View All Properties
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 border border-slate-200 rounded-xl font-medium hover:border-emerald-600 hover:text-emerald-600 transition-all text-sm"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default async function ListingsPage(props: ListingsPageProps) {
  const supabase = await createClient()
  const params = await props.searchParams

  // Fetch active amenities (only active ones)
  const { data: amenities } = await supabase
    .from('amenities')
    .select('id, slug, name, icon')
    .eq('is_active', true)
    .order('display_order')

  // Fetch active phases (only active ones)
  const { data: phases } = await supabase
    .from('phases')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  // Fetch active blocks (only active ones)
  const { data: blocks } = await supabase
    .from('blocks')
    .select('*, phase:phases(*)')
    .eq('is_active', true)
    .order('name')

  // Get stats for hero section
  const { count: totalListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })

  // Get property types with counts
  const { data: propertyTypes } = await supabase
    .from('property_types')
    .select('id, name, slug, icon')
    .eq('is_active', true)
    .order('display_order')

  const propertyTypesWithCounts = await Promise.all(
    (propertyTypes || []).map(async (type) => {
      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('property_type', type.slug)
      return { ...type, count: count || 0 }
    })
  )

  // Get site settings for contact info
  const { data: settingsData2 } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['contact_phone', 'whatsapp_number'])

  const settings: any = {}
  settingsData2?.forEach((item: any) => {
    settings[item.setting_key] = item.setting_value
  })

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-white">
      <Header />

      <main className="flex-1">
        {/* Hero Section - Compact */}
        <section className="relative min-h-[40vh] flex items-center overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=600&fit=crop" 
              alt="NTR Properties"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80" />
            
            {/* Animated Overlay */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
              <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full z-10">
            <div className="max-w-4xl mx-auto text-center space-y-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span className="text-xs font-medium text-white">
                  {totalListings || 0}+ Premium Properties
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Properties in{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                  North Town Residency
                </span>
              </h1>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <div className="flex items-center gap-1.5 text-white/90 text-sm">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span>4 Premium Phases</span>
                </div>
                {propertyTypesWithCounts.slice(0, 2).map((type, i) => {
                  const IconComponent = getIconComponent(type.icon)
                  return (
                    <div key={type.id} className="flex items-center gap-1.5 text-white/90 text-sm">
                      <IconComponent className="h-4 w-4 text-emerald-400" />
                      <span>{type.count} {type.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content - Adjusted margin */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-10 relative z-30">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar - Enhanced but compact */}
            <aside className="lg:w-80 shrink-0">
              <div className="space-y-5">
                {/* Filter Header */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">Filters</h2>
                    </div>
                    <Link 
                      href="/listings" 
                      className="text-xs text-slate-500 hover:text-emerald-600 underline"
                    >
                      Clear all
                    </Link>
                  </div>

                  {/* Filter Component */}
                  <ListingsFilters 
                    phases={(phases || []) as Phase[]} 
                    blocks={(blocks || []) as Block[]}
                    amenities={amenities || []}
                    propertyTypes={propertyTypes || []}
                  />
                </div>

                {/* Contact Card - Compact */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-lg">
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">Need Help?</h3>
                  <p className="text-xs text-slate-600 mb-3">
                    Our property experts are here 24/7.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a href={`tel:${settings?.contact_phone || '+923001234567'}`}>
                      <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl text-sm py-2.5 shadow-lg">
                        <Phone className="h-3 w-3 mr-1.5" />
                        Call Now
                      </Button>
                    </a>
                    <a href={`https://wa.me/${(settings?.whatsapp_number || settings?.contact_phone || '+923001234567').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full border-slate-200 hover:border-emerald-600 rounded-xl text-sm py-2.5">
                        <MessageCircle className="h-3 w-3 mr-1.5" />
                        WhatsApp
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            {/* Listings Grid */}
            <div className="flex-1 min-w-0">
              <Suspense 
                fallback={
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
                      <div className="relative w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 font-medium">Loading properties...</p>
                  </div>
                }
              >
                <ListingsContent searchParams={props.searchParams} phases={(phases || []) as Phase[]} blocks={(blocks || []) as Block[]} amenities={amenities || []} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section - Compact */}
        <section className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-1">
                  Can't Find What You're Looking For?
                </h3>
                <p className="text-white/80 text-base">
                  Get notified when new properties are listed.
                </p>
              </div>
              <div className="flex gap-3">
                <Button className="bg-white text-emerald-600 hover:bg-white/90 rounded-xl px-6 py-4 text-sm shadow-xl font-semibold">
                  <Bell className="h-4 w-4 mr-1.5" />
                  Create Alert
                </Button>
                <div className="inline-block">
                  <ContactAgentDialog />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
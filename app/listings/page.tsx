import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { EnhancedPropertyCard } from '@/components/enhanced-property-card'
import { Button } from '@/components/ui/button'
import { Building2, Search, Sparkles, MapPin, SlidersHorizontal, Phone, MessageCircle, Bell, X } from 'lucide-react'
import type { Listing } from '@/lib/types'

interface SearchParams {
  area_id?: string
  project_id?: string
  property_type_id?: string
  purpose?: string
  min_price?: string
  max_price?: string
  bedrooms?: string
  is_corner?: string
  is_park_facing?: string
  is_road_facing?: string
  is_west_open?: string
  construction_status?: string
  search?: string
  sort?: string
  page?: string
}

async function ListingsContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const page = parseInt(searchParams.page || '1')
  const limit = 12

  let query = supabase
    .from('listings')
    .select(`*, area:areas(id,name,slug), project:projects(id,name,slug), property_type:property_types(id,name,slug,icon), listing_images(id,image_url,is_primary,display_order)`)
    .eq('status', 'approved')

  if (searchParams.area_id) query = query.eq('area_id', searchParams.area_id)
  if (searchParams.project_id) query = query.eq('project_id', searchParams.project_id)
  if (searchParams.property_type_id) query = query.eq('property_type_id', searchParams.property_type_id)
  if (searchParams.purpose) query = query.eq('purpose', searchParams.purpose)
  if (searchParams.min_price) query = query.gte('price', parseFloat(searchParams.min_price))
  if (searchParams.max_price) query = query.lte('price', parseFloat(searchParams.max_price))
  if (searchParams.bedrooms) query = query.eq('bedrooms', parseInt(searchParams.bedrooms))
  if (searchParams.is_corner === 'true') query = query.eq('is_corner', true)
  if (searchParams.is_park_facing === 'true') query = query.eq('is_park_facing', true)
  if (searchParams.is_road_facing === 'true') query = query.eq('is_road_facing', true)
  if (searchParams.is_west_open === 'true') query = query.eq('is_west_open', true)
  if (searchParams.construction_status) query = query.eq('construction_status', searchParams.construction_status)
  if (searchParams.search) query = query.ilike('title', `%${searchParams.search}%`)

  const sort = searchParams.sort || 'newest'
  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })

  const { count } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'approved')
  const { data: listings } = await query.range((page - 1) * limit, page * limit - 1)
  const totalPages = Math.ceil((count || 0) / limit)

  const activeFilters = Object.entries(searchParams).filter(([k, v]) => k !== 'page' && k !== 'sort' && v).length

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{listings?.length || 0} Properties</h2>
            {activeFilters > 0 && <span className="text-xs text-slate-500">{activeFilters} filters applied</span>}
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              defaultValue={sort}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            {activeFilters > 0 && (
              <Link href="/listings" className="flex items-center gap-1 px-3 py-2 text-xs text-red-600 border border-red-200 rounded-xl hover:bg-red-50">
                <X className="h-3 w-3" /> Clear
              </Link>
            )}
          </div>
        </div>
      </div>

      {listings && listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing: Listing) => (
              <EnhancedPropertyCard key={listing.id} listing={listing} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <Link
                  href={`?${new URLSearchParams({ ...searchParams, page: (page - 1).toString() }).toString()}`}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${page <= 1 ? 'opacity-50 cursor-not-allowed pointer-events-none bg-slate-100 text-slate-400' : 'bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-600'}`}
                >
                  Previous
                </Link>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
                  return (
                    <Link key={p} href={`?${new URLSearchParams({ ...searchParams, page: p.toString() }).toString()}`}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${p === page ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg' : 'bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-600'}`}
                    >{p}</Link>
                  )
                })}
                <Link
                  href={`?${new URLSearchParams({ ...searchParams, page: (page + 1).toString() }).toString()}`}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${page >= totalPages ? 'opacity-50 cursor-not-allowed pointer-events-none bg-slate-100 text-slate-400' : 'bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-600'}`}
                >
                  Next
                </Link>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-white/50">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">No Properties Found</h3>
            <p className="text-slate-600 mt-1">Try adjusting your search criteria.</p>
          </div>
          <Link href="/listings" className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-medium text-sm">
            View All Properties
          </Link>
        </div>
      )}
    </div>
  )
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()

  const [
    { data: areas },
    { data: propertyTypes },
    { data: projects },
    { count: totalListings },
  ] = await Promise.all([
    supabase.from('areas').select('id,name,slug').eq('is_active', true).order('display_order'),
    supabase.from('property_types').select('id,name,slug,icon').eq('is_active', true).order('display_order'),
    supabase.from('projects').select('id,name,slug,area_id').eq('is_active', true).order('name'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
  ])

  const selectedArea = areas?.find(a => a.id === params.area_id)
  const selectedType = propertyTypes?.find(t => t.id === params.property_type_id)
  const filteredProjects = params.area_id ? projects?.filter(p => p.area_id === params.area_id) : projects

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-white">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[40vh] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=600&fit=crop" alt="Properties" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
              <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
            </div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg mb-4">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-medium text-white">{totalListings || 0}+ Properties Available</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {selectedArea ? `Properties in ${selectedArea.name}` : selectedType ? `${selectedType.name} Properties` : 'All Properties in'}{' '}
              {!selectedArea && !selectedType && <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Karachi</span>}
            </h1>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-10 relative z-30">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <aside className="lg:w-72 shrink-0">
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">Filters</h2>
                    </div>
                    <Link href="/listings" className="text-xs text-slate-500 hover:text-emerald-600 underline">Clear all</Link>
                  </div>

                  <form method="GET" action="/listings" className="space-y-4">
                    {/* Search */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input name="search" defaultValue={params.search} placeholder="Search properties..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                      </div>
                    </div>

                    {/* Purpose */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Purpose</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[{ value: '', label: 'All' }, { value: 'sale', label: 'For Sale' }, { value: 'rent', label: 'For Rent' }].map(opt => (
                          <Link key={opt.value} href={`/listings?${new URLSearchParams({ ...params, purpose: opt.value, page: '1' }).toString()}`}
                            className={`text-center py-1.5 text-xs rounded-lg border transition-all ${params.purpose === opt.value || (!params.purpose && opt.value === '') ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 hover:border-emerald-400 text-slate-600'}`}
                          >{opt.label}</Link>
                        ))}
                      </div>
                    </div>

                    {/* Area */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Area</label>
                      <select name="area_id" defaultValue={params.area_id || ''} className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                        <option value="">All Areas</option>
                        {areas?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>

                    {/* Project */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Project</label>
                      <select name="project_id" defaultValue={params.project_id || ''} className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                        <option value="">All Projects</option>
                        {filteredProjects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    {/* Property Type */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Property Type</label>
                      <select name="property_type_id" defaultValue={params.property_type_id || ''} className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                        <option value="">All Types</option>
                        {propertyTypes?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Price Range (PKR)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input name="min_price" type="number" defaultValue={params.min_price} placeholder="Min" className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                        <input name="max_price" type="number" defaultValue={params.max_price} placeholder="Max" className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                      </div>
                    </div>

                    {/* Bedrooms */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Bedrooms</label>
                      <div className="flex gap-1.5">
                        {['', '1', '2', '3', '4', '5+'].map(b => (
                          <Link key={b} href={`/listings?${new URLSearchParams({ ...params, bedrooms: b, page: '1' }).toString()}`}
                            className={`flex-1 text-center py-1.5 text-xs rounded-lg border transition-all ${params.bedrooms === b || (!params.bedrooms && b === '') ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 hover:border-emerald-400 text-slate-600'}`}
                          >{b || 'Any'}</Link>
                        ))}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Features</label>
                      <div className="space-y-2">
                        {[
                          { key: 'is_corner', label: 'Corner Plot' },
                          { key: 'is_park_facing', label: 'Park Facing' },
                          { key: 'is_road_facing', label: 'Road Facing' },
                          { key: 'is_west_open', label: 'West Open' },
                        ].map(f => (
                          <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name={f.key} value="true" defaultChecked={(params as any)[f.key] === 'true'} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-xs text-slate-600">{f.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg">
                      Apply Filters
                    </button>
                  </form>
                </div>

                {/* Contact Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-lg">
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">Need Help?</h3>
                  <p className="text-xs text-slate-600 mb-3">Our property experts are here 24/7.</p>
                  <div className="flex flex-col gap-2">
                    <a href="tel:+923000000000">
                      <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-sm py-2.5 shadow-lg">
                        <Phone className="h-3 w-3 mr-1.5" /> Call Now
                      </Button>
                    </a>
                    <a href="https://wa.me/923000000000" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full border-slate-200 hover:border-emerald-600 rounded-xl text-sm py-2.5">
                        <MessageCircle className="h-3 w-3 mr-1.5" /> WhatsApp
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            {/* Listings */}
            <div className="flex-1 min-w-0">
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="mt-3 text-sm text-slate-600 font-medium">Loading properties...</p>
                </div>
              }>
                <ListingsContent searchParams={params} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <section className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-1">Can't Find What You're Looking For?</h3>
              <p className="text-white/80">Post your requirement and let agents contact you.</p>
            </div>
            <Link href="/dashboard/post">
              <Button className="bg-white text-emerald-600 hover:bg-white/90 rounded-xl px-6 py-4 text-sm shadow-xl font-semibold">
                Post Property
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

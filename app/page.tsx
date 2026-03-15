import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { EnhancedPropertyCard } from '@/components/enhanced-property-card'
import { Button } from '@/components/ui/button'
import { HomeSearchBar } from '@/components/home-search-bar'
import {
  ArrowRight, Home, Shield, Users, MapPin, Search,
  ChevronRight, Star, Clock, Building2, BadgeCheck,
  TrendingUp, Layers, CheckCircle2, Phone, Award
} from 'lucide-react'
import { getIconComponent } from '@/lib/icon'

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: featuredListings },
    { data: recentListings },
    { count: totalListings },
    { count: totalUsers },
    { data: propertyTypes },
    { data: areas },
    { data: featuredProjects },
    { data: featuredDevelopers },
  ] = await Promise.all([
    supabase
      .from('listings')
      .select('*, area:areas(id,name,slug), project:projects(id,name,slug), property_type:property_types(id,name,slug,icon), listing_images(id,image_url,is_primary,display_order)')
      .eq('status', 'approved').eq('is_featured', true)
      .order('created_at', { ascending: false }).limit(6),
    supabase
      .from('listings')
      .select('*, area:areas(id,name,slug), project:projects(id,name,slug), property_type:property_types(id,name,slug,icon), listing_images(id,image_url,is_primary,display_order)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('property_types').select('id,name,slug,icon,category').eq('is_active', true).order('display_order').limit(8),
    supabase.from('areas').select('id,name,slug,image_url,is_popular').eq('is_active', true).eq('is_popular', true).order('display_order').limit(8),
    supabase.from('projects').select('*, area:areas(id,name,slug), developer:developers(id,name,slug,logo_url)').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(6),
    supabase.from('developers').select('id,name,slug,logo_url,is_verified,is_featured').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(6),
  ])

  const areaImages = [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1448630360428-65456885c650?w=400&h=300&fit=crop',
  ]

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1">

        {/* ─── 1. HERO ─── */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/80" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-sm font-medium backdrop-blur-sm">
                <TrendingUp className="h-4 w-4" />
                Karachi's #1 Real Estate Platform
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1]">
                Find Your Perfect
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                  Property in Karachi
                </span>
              </h1>

              <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto">
                Browse thousands of verified listings — houses, apartments, plots, and commercial properties across all major areas.
              </p>

              {/* Search Tabs + Bar */}
              <HomeSearchBar />

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 pt-4">
                {[
                  { value: `${totalListings || 0}+`, label: 'Active Listings' },
                  { value: `${areas?.length || 15}+`, label: 'Areas Covered' },
                  { value: `${featuredProjects?.length || 0}+`, label: 'New Projects' },
                  { value: `${totalUsers || 0}+`, label: 'Happy Users' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
                    <p className="text-sm text-white/60">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-2 bg-white/60 rounded-full mt-2" />
            </div>
          </div>
        </section>

        {/* ─── 2. PROPERTY CATEGORIES ─── */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider bg-emerald-50 px-4 py-1.5 rounded-full inline-block mb-3">Browse by Type</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Property <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Categories</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {(propertyTypes || []).map((type, i) => {
                const IconComponent = getIconComponent(type.icon || 'home')
                const colors = [
                  'hover:bg-emerald-600', 'hover:bg-blue-600', 'hover:bg-amber-600',
                  'hover:bg-purple-600', 'hover:bg-rose-600', 'hover:bg-teal-600',
                  'hover:bg-orange-600', 'hover:bg-indigo-600'
                ]
                return (
                  <Link key={type.id} href={`/listings?property_type_id=${type.id}`}
                    className={`group flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-transparent hover:text-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${colors[i % colors.length]}`}>
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/20">
                      <IconComponent className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-white text-center transition-colors">{type.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── 3. FEATURED PROPERTIES ─── */}
        {featuredListings && featuredListings.length > 0 && (
          <section className="py-16 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider bg-emerald-50 px-4 py-1.5 rounded-full inline-block mb-3">Premium Listings</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                    Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Properties</span>
                  </h2>
                  <p className="text-slate-500 mt-1 text-sm">Hand-picked premium properties across Karachi</p>
                </div>
                <Link href="/listings?featured=true" className="hidden sm:flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredListings.map((listing: any) => (
                  <EnhancedPropertyCard key={listing.id} listing={listing} />
                ))}
              </div>
              <div className="text-center mt-8 sm:hidden">
                <Link href="/listings?featured=true">
                  <Button variant="outline" className="rounded-xl">View All Featured <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ─── 4. POPULAR AREAS ─── */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider bg-emerald-50 px-4 py-1.5 rounded-full inline-block mb-3">Prime Locations</span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Popular <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Areas</span>
                </h2>
                <p className="text-slate-500 mt-1 text-sm">Explore properties in Karachi's top neighborhoods</p>
              </div>
              <Link href="/listings" className="hidden sm:flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                All Areas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(areas || []).map((area, idx) => (
                <Link key={area.id} href={`/areas/${area.slug}`}
                  className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={area.image_url || areaImages[idx % areaImages.length]}
                      alt={area.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="font-bold text-white text-sm">{area.name}</p>
                      <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> Karachi
                      </p>
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm rounded-full p-1.5">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 5. NEW PROJECTS ─── */}
        {featuredProjects && featuredProjects.length > 0 && (
          <section className="py-16 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider bg-blue-50 px-4 py-1.5 rounded-full inline-block mb-3">New Developments</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                    Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Projects</span>
                  </h2>
                  <p className="text-slate-500 mt-1 text-sm">Latest residential and commercial developments</p>
                </div>
                <Link href="/projects" className="hidden sm:flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  All Projects <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProjects.map((project: any) => (
                  <Link key={project.id} href={`/projects/${project.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={project.image_url || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=338&fit=crop'}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow ${
                          project.project_status === 'completed' ? 'bg-emerald-600' :
                          project.project_status === 'upcoming' ? 'bg-amber-500' : 'bg-blue-600'
                        }`}>
                          {project.project_status === 'ongoing' ? 'Under Construction' :
                           project.project_status === 'completed' ? 'Ready to Move' : 'Upcoming'}
                        </span>
                      </div>
                      {project.developer?.logo_url && (
                        <div className="absolute bottom-3 right-3 bg-white rounded-lg p-1.5 shadow">
                          <img src={project.developer.logo_url} alt={project.developer.name} className="h-6 w-auto object-contain" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{project.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        <span>{project.area?.name || 'Karachi'}</span>
                        {project.developer && <><span className="text-slate-300">·</span><span>{project.developer.name}</span></>}
                      </div>
                      {(project.min_price || project.max_price) && (
                        <p className="text-sm font-bold text-emerald-600">
                          PKR {project.min_price ? `${(project.min_price / 1000000).toFixed(1)}M` : ''}
                          {project.min_price && project.max_price ? ' – ' : ''}
                          {project.max_price ? `${(project.max_price / 1000000).toFixed(1)}M` : ''}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 6. FEATURED DEVELOPERS ─── */}
        {featuredDevelopers && featuredDevelopers.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <span className="text-purple-600 font-semibold text-sm uppercase tracking-wider bg-purple-50 px-4 py-1.5 rounded-full inline-block mb-3">Top Builders</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                    Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Developers</span>
                  </h2>
                  <p className="text-slate-500 mt-1 text-sm">Trusted and verified real estate developers</p>
                </div>
                <Link href="/developers" className="hidden sm:flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium">
                  All Developers <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {featuredDevelopers.map((dev: any) => (
                  <Link key={dev.id} href={`/developers/${dev.slug}`}
                    className="group flex flex-col items-center gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden border border-slate-100">
                      {dev.logo_url ? (
                        <img src={dev.logo_url} alt={dev.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2">{dev.name}</p>
                      {dev.is_verified && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <BadgeCheck className="w-3 h-3 text-blue-500" />
                          <span className="text-[10px] text-blue-500">Verified</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 7. RECENTLY ADDED ─── */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider bg-emerald-50 px-4 py-1.5 rounded-full inline-block mb-3">Fresh Listings</span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Recently <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Added</span>
                </h2>
                <p className="text-slate-500 mt-1 text-sm">Latest properties added by owners and agents</p>
              </div>
              <Link href="/listings" className="hidden sm:flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {(recentListings || []).map((listing: any) => (
                <div key={listing.id} className="relative">
                  <EnhancedPropertyCard listing={listing} />
                  {new Date(listing.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-md text-[10px] font-bold shadow">NEW</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 8. WHY CHOOSE US ─── */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider bg-emerald-50 px-4 py-1.5 rounded-full inline-block mb-3">Why Us</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                The <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Karachi Estates</span> Advantage
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Shield, title: 'Verified Listings', desc: 'Every property is verified before going live', color: 'emerald', stat: '100% Verified' },
                { icon: Search, title: 'Easy Search', desc: 'Advanced filters to find exactly what you need', color: 'blue', stat: 'Smart Filters' },
                { icon: Users, title: 'Direct Contact', desc: 'Connect directly with owners and agents', color: 'purple', stat: 'No Middleman' },
                { icon: Award, title: 'Best Prices', desc: 'Market-competitive prices with negotiation support', color: 'amber', stat: 'Save up to 15%' },
              ].map((item, i) => (
                <div key={i} className="group text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-14 h-14 bg-${item.color}-100 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 mb-3">{item.desc}</p>
                  <span className={`text-xs font-semibold text-${item.color}-600 bg-${item.color}-50 px-3 py-1 rounded-full`}>{item.stat}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 9. CTA ─── */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=600&fit=crop" alt="CTA" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-slate-900/90 to-blue-900/95" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Find Your Dream Property?</h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who found their perfect property in Karachi through our platform.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/listings">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 rounded-xl px-8 font-semibold">
                  Browse Properties <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard/post">
                <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 rounded-xl px-8 font-semibold">
                  Post Your Property
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-white/20">
              {[
                { icon: CheckCircle2, text: 'Free to List' },
                { icon: Shield, text: 'Verified Buyers' },
                { icon: Phone, text: '24/7 Support' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/80">
                  <item.icon className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}

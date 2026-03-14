import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { EnhancedPropertyCard } from '@/components/enhanced-property-card'
import { Button } from '@/components/ui/button'
import { ContactAgentDialog } from '@/components/contact-agent-dialog'
import { 
  ArrowRight, Home, Store, Shield, Users, MapPin, TrendingUp, 
  Search, SlidersHorizontal, ChevronRight, Star, Award, Clock,
  Building2, Trees, Sparkles, Heart, Grid3x3, LayoutGrid,
  CircleDollarSign, Ruler, Calendar, CheckCircle2, BadgeCheck,
  ArrowUpRight, Filter, Percent, ArrowDownUp, Eye, Bookmark,
  Compass, Gem, Trophy, Zap, Sun, Moon, Wind, Droplets,
  BarChart3, PieChart, Target, Rocket, Globe, Lock, Key,
  Camera, Video, MessageCircle, Share2, Download, Upload,
  Briefcase, GraduationCap, Hospital, Utensils, Car, Bike,
  Phone, Mail, MessageSquare, Facebook, Instagram, Twitter
} from 'lucide-react'
import { getIconComponent } from '@/lib/icon'
import { HomePageFilters } from '@/components/home-page-filters'

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch all listings for Recently Added (including pending)
  const { data: allListings } = await supabase
    .from('listings')
    .select(`id, title, price, listing_type, property_type, plot_size_sqyd, shop_size_sqft, block_id, phase_id, created_at, block:blocks(name), phase:phases(name), images:listing_images(image_url, is_primary)`)
    .order('created_at', { ascending: false })
    .limit(12)

  // Fetch featured listings
  const { data: featuredListings } = await supabase
    .from('listings')
    .select(`id, title, price, listing_type, property_type, plot_size_sqyd, shop_size_sqft, block_id, phase_id, created_at, block:blocks(name), phase:phases(name), images:listing_images(image_url, is_primary)`)
    .eq('status', 'approved')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6)

  // Get total listings count (all, not just approved)
  const { count: totalListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })

  // Get all property types with their listings count
  const { data: propertyTypes } = await supabase
    .from('property_types')
    .select('id, name, slug, icon, category')
    .eq('is_active', true)
    .order('display_order')

  // Get property type counts
  const propertyTypesWithCounts = await Promise.all(
    (propertyTypes || []).map(async (type) => {
      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('property_type', type.slug)

      return {
        ...type,
        count: count || 0
      }
    })
  )

  // Get all phases with their listings count and details
  const { data: phases, error: phasesError } = await supabase
    .from('phases')
    .select('id, name, description, image_url')
    .eq('is_active', true)
    .order('name')

  // Get blocks count and listings count per phase
  const phasesWithData = await Promise.all(
    (phases || []).map(async (phase) => {
      const { count: listingsCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('phase_id', phase.id)

      const { count: blocksCount } = await supabase
        .from('blocks')
        .select('*', { count: 'exact', head: true })
        .eq('phase_id', phase.id)
        .eq('is_active', true)

      return {
        ...phase,
        listingsCount: listingsCount || 0,
        blocksCount: blocksCount || 0
      }
    })
  )

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-white">
      <Header />
      
      <main className="flex-1">
        {/* HERO SECTION - Cinematic Experience */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Parallax Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920')] bg-cover bg-center bg-fixed" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/50 to-transparent" />
            {/* Animated Overlay */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
              <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-amber-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Content - Animated */}
              <div className="space-y-8 animate-fade-in-up">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1]">
                  Find Your Dream
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                    Property in Karachi
                  </span>
                </h1>

                <p className="text-xl text-white/80 max-w-lg leading-relaxed">
                  Discover premium residential plots, commercial properties, and villas in Karachi - 
                  Pakistan's premier real estate marketplace.
                </p>

                {/* Search Bar - Premium Glass Effect */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20 shadow-2xl max-w-2xl group hover:bg-white/15 transition-all">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                      <input
                        type="text"
                        placeholder="Search by location, phase, or property type..."
                        className="w-full pl-12 pr-4 py-4 bg-white/10 rounded-xl border-0 focus:ring-2 focus:ring-emerald-500/50 text-white placeholder-white/50"
                      />
                    </div>
                    <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
                      Search
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>

                {/* Stats with Premium Cards */}
                <div className="grid grid-cols-4 gap-4 mt-10">
                  {[
                    { value: `${totalListings || 0}+`, label: 'Active Listings', icon: Home, change: '+12%' },
                    { value: '2000+', label: 'Happy Owners', icon: Users, change: '+25%' },
                    { value: '4', label: 'Phases', icon: Building2, change: 'All' },
                    { value: '24/7', label: 'Support', icon: Clock, change: 'Live' }
                  ].map((stat, i) => (
                    <div 
                      key={i} 
                      className="group bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                        <span className="text-xs text-emerald-400 font-semibold">{stat.change}</span>
                      </div>
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/60">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Content - 3D Gallery Grid */}
              <div className="relative hidden lg:block perspective-1000">
                <div className="grid grid-cols-2 gap-4 transform rotate-y-[-5deg]">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="group relative overflow-hidden rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-500">
                      <img 
                        src="/luxury villas.webp" 
                        alt="Luxury Villas" 
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="text-sm font-medium opacity-90">Luxury Villas</p>
                      </div>
                      <div className="absolute top-4 right-4 bg-emerald-500 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-lg animate-pulse">
                        Hot Deal
                      </div>
                      {/* Overlay Icons */}
                      <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors">
                          <Heart className="w-4 h-4 text-white" />
                        </button>
                        <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors">
                          <Camera className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { img: '/modern villas .webp', label: 'Modern Villas' },
                        { img: '/shop.jfif', label: 'Commercial Shops' }
                      ].map((item, idx) => (
                        <div key={idx} className="group relative overflow-hidden rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-500">
                          <img src={item.img} alt={item.label} className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                          <div className="absolute bottom-2 left-2 text-white">
                            <p className="text-xs font-medium">{item.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4 mt-8">
                    {[
                      { img: '/corner plot.webp', label: 'Corner Plots', featured: true },
                      { img: '/parkfacing.jfif', label: 'Park Facing', featured: false }
                    ].map((item, idx) => (
                      <div key={idx} className="group relative overflow-hidden rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-500">
                        <img src={item.img} alt={item.label} className={`w-full ${idx === 0 ? 'h-40' : 'h-48'} object-cover group-hover:scale-110 transition-transform duration-700`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 text-white">
                          <p className="text-sm font-medium opacity-90">{item.label}</p>
                        </div>
                        {item.featured && (
                          <div className="absolute top-4 right-4 bg-amber-500 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-lg">
                            Premium
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>


              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block animate-bounce">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center backdrop-blur-sm">
              <div className="w-1 h-2 bg-gradient-to-b from-emerald-400 to-blue-400 rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </section>

        {/* ADVANCED FILTER BAR */}
        <section className="sticky top-16 z-40 py-4 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <HomePageFilters />
          </div>
        </section>

        {/* FEATURED CATEGORIES - REDUCED GAP */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider bg-emerald-50 px-4 py-2 rounded-full inline-block mb-3">
                Explore Categories
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
                Browse Properties by <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Type</span>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                Find your perfect property from our wide range of categories
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {propertyTypesWithCounts.slice(0, 6).map((type, i) => {
                const iconName = type.icon || 'home'
                const IconComponent = getIconComponent(iconName)
                const colors = ['emerald', 'blue', 'amber', 'green', 'purple', 'pink']
                const color = colors[i % colors.length]
                const gradients = [
                  'from-emerald-500 to-emerald-600',
                  'from-blue-500 to-blue-600',
                  'from-amber-500 to-amber-600',
                  'from-green-500 to-green-600',
                  'from-purple-500 to-purple-600',
                  'from-pink-500 to-pink-600'
                ]
                const gradient = gradients[i % gradients.length]
                
                return (
                  <Link 
                    key={type.id} 
                    href={`/listings?property_type=${type.slug}`}
                    className="group relative bg-white rounded-xl p-5 hover:shadow-xl transition-all duration-300 border border-slate-200/80 hover:border-transparent hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative z-10">
                      <div className={`w-12 h-12 bg-${color}-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 mx-auto`}>
                        <IconComponent className={`w-6 h-6 text-${color}-600 group-hover:text-white transition-colors duration-300`} />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-white transition-colors text-center">{type.name}</h3>
                      <p className="text-xs text-slate-600 group-hover:text-white/90 transition-colors text-center">{type.count} Listings</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* PHASE SHOWCASE - REDUCED GAP */}
        <section className="py-12 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider bg-emerald-50 px-4 py-2 rounded-full inline-block mb-2">
                  Prime Locations
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Phases</span>
                </h2>
              </div>
              <Button variant="ghost" className="text-slate-600 hover:text-emerald-600 group">
                View All 
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {phasesWithData && phasesWithData.length > 0 ? phasesWithData.map((phase, idx) => {
                const defaultImages = [
                  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
                  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
                  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
                  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop'
                ]
                const imageUrl = phase.image_url || defaultImages[idx % 4]
                
                return (
                  <Link 
                    key={phase.id}
                    href={`/listings?phase_id=${phase.id}`}
                    className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <img 
                        src={imageUrl}
                        alt={phase.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
                      
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-900 rounded-full text-xs font-semibold shadow-lg">
                          {phase.name}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-white">
                      {phase.description && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">{phase.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs text-slate-500">Properties</p>
                          <p className="text-lg font-bold text-slate-900">{phase.listingsCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Blocks</p>
                          <p className="text-base font-semibold text-slate-900">{phase.blocksCount}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-600 group-hover:text-emerald-700">
                          Explore
                        </span>
                        <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                )
              }) : (
                <div className="col-span-full text-center py-12 bg-white rounded-xl">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No phases available</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FEATURED PROPERTIES - REDUCED GAP */}
        {featuredListings && featuredListings.length > 0 && (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider bg-emerald-50 px-4 py-2 rounded-full inline-block mb-2">
                    Editor's Choice
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                    Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Properties</span>
                  </h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-full border-slate-200 w-10 h-10">
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full border-slate-200 w-10 h-10">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredListings.map((listing, index) => (
                  <div key={listing.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <EnhancedPropertyCard listing={listing} />
                  </div>
                ))}
              </div>

              <div className="text-center mt-10">
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl px-8 py-5 text-base shadow-lg hover:shadow-xl transition-all group">
                  View All Properties
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* WHY CHOOSE US - REDUCED GAP */}
        <section className="py-12 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider bg-emerald-50 px-4 py-2 rounded-full inline-block mb-2">
                Why Choose Us
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                The <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Karachi Estates Advantage</span>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-base">
                Experience the best property deals with complete transparency
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                { 
                  icon: Shield, 
                  title: 'Verified Properties', 
                  desc: 'All listings verified with physical inspection',
                  stats: '100% Verified',
                  color: 'emerald'
                },
                { 
                  icon: Award, 
                  title: 'Best Price Guarantee', 
                  desc: 'Market analysis and price negotiation support',
                  stats: 'Save up to 15%',
                  color: 'blue'
                },
                { 
                  icon: Users, 
                  title: 'Expert Support', 
                  desc: '24/7 support from property experts',
                  stats: '2000+ Happy Clients',
                  color: 'amber'
                }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="group relative bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-slate-200/80 hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 bg-${item.color}-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 mb-3">{item.desc}</p>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <BadgeCheck className={`w-4 h-4 text-${item.color}-600`} />
                    <span className={`text-${item.color}-600`}>{item.stats}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RECENTLY ADDED - REDUCED GAP */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider bg-emerald-50 px-4 py-2 rounded-full inline-block mb-2">
                  Fresh Listings
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Recently <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Added</span>
                </h2>
              </div>
              <Link href="/listings" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {allListings?.slice(0, 8).map((listing, index) => (
                <div key={listing.id} className="relative group">
                  <EnhancedPropertyCard listing={listing} />
                  
                  {/* New Badge */}
                  {new Date(listing.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2 py-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg text-[10px] font-bold shadow-lg">
                        NEW
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION - COMPACT */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&h=600&fit=crop"
              alt="NTR"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Find Your Dream Property?
            </h2>
            <p className="text-base text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of satisfied customers who found their perfect property in Karachi.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/listings">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 rounded-xl px-6 py-5 text-sm">
                  Browse Properties
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <ContactAgentDialog />
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-10 pt-8 border-t border-white/20">
              <div>
                <p className="text-2xl font-bold text-white">500+</p>
                <p className="text-xs text-white/70">Properties Sold</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">2000+</p>
                <p className="text-xs text-white/70">Happy Clients</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">24/7</p>
                <p className="text-xs text-white/70">Support</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
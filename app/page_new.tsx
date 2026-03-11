import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { EnhancedPropertyCard } from '@/components/enhanced-property-card'
import { Button } from '@/components/ui/button'
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
import { HomePageFilters } from '@/components/home-page-filters'

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: allListings } = await supabase
    .from('listings')
    .select(`id, title, price, listing_type, property_type, plot_size_sqyd, shop_size_sqft, block_id, phase_id, created_at, block:blocks(name), phase:phases(name), images:listing_images(image_url, is_primary)`)
    .order('created_at', { ascending: false })
    .limit(12)

  const { data: featuredListings } = await supabase
    .from('listings')
    .select(`id, title, price, listing_type, property_type, plot_size_sqyd, shop_size_sqft, block_id, phase_id, created_at, block:blocks(name), phase:phases(name), images:listing_images(image_url, is_primary)`)
    .eq('status', 'approved')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6)

  const { count: totalListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })

  const { data: propertyTypes } = await supabase
    .from('property_types')
    .select('id, name, slug, icon, category')
    .eq('is_active', true)
    .order('display_order')

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

  const { data: phases } = await supabase
    .from('phases')
    .select('id, name, image_url, description')
    .eq('is_active', true)
    .order('display_order')

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

  const defaultPhaseImages = [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop'
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* PHASE SHOWCASE */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-10">
              <span className="text-emerald-600 font-semibold text-sm uppercase bg-emerald-50 px-4 py-2 rounded-full inline-block mb-3">
                Prime Locations
              </span>
              <h2 className="text-4xl font-bold text-slate-900">
                Explore NTR <span className="text-emerald-600">Phases</span>
              </h2>
            </div>

            {phasesWithData && phasesWithData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {phasesWithData.map((phase, idx) => (
                  <Link 
                    key={phase.id}
                    href={`/listings?phase_id=${phase.id}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="aspect-video relative">
                      <img 
                        src={phase.image_url || defaultPhaseImages[idx % 4]}
                        alt={phase.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-white text-slate-900 rounded-full text-sm font-semibold">
                          {phase.name}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      {phase.description && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{phase.description}</p>
                      )}
                      
                      <div className="flex justify-between mb-3">
                        <div>
                          <p className="text-xs text-slate-500">Properties</p>
                          <p className="text-xl font-bold">{phase.listingsCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Blocks</p>
                          <p className="text-xl font-bold">{phase.blocksCount}</p>
                        </div>
                      </div>

                      <div className="flex items-center text-emerald-600 font-medium">
                        Explore <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl">
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">No phases available</p>
                <p className="text-slate-400 text-sm mt-2">Please check back later</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

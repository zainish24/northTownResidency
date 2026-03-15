import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { EnhancedPropertyCard } from '@/components/enhanced-property-card'
import { Button } from '@/components/ui/button'
import { MapPin, Building2, ChevronRight, ArrowRight, Home } from 'lucide-react'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('areas').select('name, description').eq('slug', slug).single()
  if (!data) return { title: 'Area Not Found' }
  return { title: `Properties in ${data.name} | Karachi Estates`, description: data.description || `Browse properties in ${data.name}, Karachi` }
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: area } = await supabase.from('areas').select('*').eq('slug', slug).eq('is_active', true).single()
  if (!area) notFound()

  const [
    { data: listings },
    { data: projects },
    { count: totalListings },
  ] = await Promise.all([
    supabase.from('listings')
      .select('*, area:areas(id,name,slug), project:projects(id,name,slug), property_type:property_types(id,name,slug,icon), listing_images(id,image_url,is_primary,display_order)')
      .eq('area_id', area.id).eq('status', 'approved')
      .order('is_featured', { ascending: false }).order('created_at', { ascending: false }).limit(12),
    supabase.from('projects').select('*, developer:developers(id,name,slug,logo_url)').eq('area_id', area.id).eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('area_id', area.id).eq('status', 'approved'),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-white">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[50vh] flex items-end overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={area.image_url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=600&fit=crop'}
              alt={area.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full z-10">
            <div className="flex items-center gap-2 text-sm text-white/70 mb-3">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/listings" className="hover:text-white">Properties</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white">{area.name}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{area.name}</h1>
            {area.description && <p className="text-white/80 max-w-2xl text-base mb-4">{area.description}</p>}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <Home className="h-4 w-4 text-emerald-400" />
                <span className="text-white text-sm font-medium">{totalListings || 0} Properties</span>
              </div>
              {projects && projects.length > 0 && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-white text-sm font-medium">{projects.length} Projects</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Projects in this area */}
          {projects && projects.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Projects in <span className="text-emerald-600">{area.name}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((project: any) => (
                  <Link key={project.id} href={`/projects/${project.slug}`} className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200/80 hover:-translate-y-1">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={project.image_url || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=225&fit=crop'}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${project.project_status === 'completed' ? 'bg-emerald-600' : project.project_status === 'upcoming' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                          {project.project_status === 'ongoing' ? 'Under Construction' : project.project_status === 'completed' ? 'Ready' : 'Upcoming'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{project.name}</h3>
                      {project.developer && <p className="text-xs text-slate-500 mb-2">by {project.developer.name}</p>}
                      {(project.min_price || project.max_price) && (
                        <p className="text-sm font-semibold text-emerald-600">
                          PKR {project.min_price ? `${(project.min_price / 1000000).toFixed(1)}M` : ''}{project.min_price && project.max_price ? ' – ' : ''}{project.max_price ? `${(project.max_price / 1000000).toFixed(1)}M` : ''}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Listings */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Properties in <span className="text-emerald-600">{area.name}</span>
              </h2>
              <Link href={`/listings?area_id=${area.id}`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing: any) => <EnhancedPropertyCard key={listing.id} listing={listing} />)}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">No properties listed in {area.name} yet.</p>
                <Link href="/listings">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Browse All Properties</Button>
                </Link>
              </div>
            )}

            {(totalListings || 0) > 12 && (
              <div className="text-center mt-8">
                <Link href={`/listings?area_id=${area.id}`}>
                  <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl px-8 py-5 shadow-lg">
                    View All {totalListings} Properties <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

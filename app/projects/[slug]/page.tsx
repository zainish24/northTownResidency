import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { EnhancedPropertyCard } from '@/components/enhanced-property-card'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, ChevronRight, ArrowRight, Calendar, Home, CheckCircle } from 'lucide-react'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('name, description').eq('slug', slug).single()
  if (!data) return { title: 'Project Not Found' }
  return { title: `${data.name} | Karachi Estates`, description: data.description || `Properties in ${data.name}` }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*, area:areas(*), developer:developers(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!project) notFound()

  const { data: listings, count } = await supabase
    .from('listings')
    .select('*, area:areas(id,name,slug), project:projects(id,name,slug), property_type:property_types(id,name,slug,icon), listing_images(id,image_url,is_primary,display_order)', { count: 'exact' })
    .eq('project_id', project.id)
    .eq('status', 'approved')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(12)

  const statusLabel = project.project_status === 'ongoing' ? 'Under Construction' : project.project_status === 'completed' ? 'Ready to Move' : 'Upcoming'
  const statusColor = project.project_status === 'completed' ? 'bg-emerald-600' : project.project_status === 'upcoming' ? 'bg-amber-500' : 'bg-blue-600'

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-white">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[55vh] flex items-end overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={project.banner_url || project.image_url || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&h=700&fit=crop'}
              alt={project.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full z-10">
            <div className="flex items-center gap-2 text-sm text-white/70 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/projects" className="hover:text-white">Projects</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white">{project.name}</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${statusColor}`}>{statusLabel}</span>
                  {project.is_featured && <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-amber-500">Featured</span>}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{project.name}</h1>
                <div className="flex flex-wrap gap-4">
                  {project.area && (
                    <div className="flex items-center gap-1.5 text-white/80 text-sm">
                      <MapPin className="h-4 w-4 text-emerald-400" />
                      <Link href={`/areas/${project.area.slug}`} className="hover:text-emerald-400 transition-colors">{project.area.name}</Link>
                    </div>
                  )}
                  {project.developer && (
                    <div className="flex items-center gap-1.5 text-white/80 text-sm">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                      <Link href={`/developers/${project.developer.slug}`} className="hover:text-emerald-400 transition-colors">{project.developer.name}</Link>
                    </div>
                  )}
                  {project.completion_year && (
                    <div className="flex items-center gap-1.5 text-white/80 text-sm">
                      <Calendar className="h-4 w-4 text-emerald-400" />
                      <span>Completion: {project.completion_year}</span>
                    </div>
                  )}
                </div>
              </div>
              {(project.min_price || project.max_price) && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                  <p className="text-white/70 text-xs mb-1">Price Range</p>
                  <p className="text-white font-bold text-lg">
                    PKR {project.min_price ? `${(project.min_price / 1000000).toFixed(1)}M` : ''}{project.min_price && project.max_price ? ' – ' : ''}{project.max_price ? `${(project.max_price / 1000000).toFixed(1)}M` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-200">
                  <Home className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-900">{count || 0}</p>
                  <p className="text-xs text-slate-500">Available Units</p>
                </div>
                {project.total_units && (
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-200">
                    <Building2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-slate-900">{project.total_units}</p>
                    <p className="text-xs text-slate-500">Total Units</p>
                  </div>
                )}
                {project.completion_year && (
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-200">
                    <Calendar className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-slate-900">{project.completion_year}</p>
                    <p className="text-xs text-slate-500">Completion</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {project.description && (
                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3">About {project.name}</h2>
                  <p className="text-slate-600 leading-relaxed">{project.description}</p>
                </section>
              )}

              {/* Listings */}
              <section>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-bold text-slate-900">Available Properties</h2>
                  {(count || 0) > 12 && (
                    <Link href={`/listings?project_id=${project.id}`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                      View All <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
                {listings && listings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {listings.map((listing: any) => <EnhancedPropertyCard key={listing.id} listing={listing} />)}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No properties listed in this project yet.</p>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Developer Card */}
                {project.developer && (
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4 text-sm">Developer</h3>
                    <Link href={`/developers/${project.developer.slug}`} className="flex items-center gap-3 hover:text-emerald-600 transition-colors group">
                      <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-white flex-shrink-0">
                        {project.developer.logo_url ? (
                          <img src={project.developer.logo_url} alt={project.developer.name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{project.developer.name}</p>
                          {project.developer.is_verified && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-slate-500">View all projects</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  </div>
                )}

                {/* Area Card */}
                {project.area && (
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4 text-sm">Location</h3>
                    <Link href={`/areas/${project.area.slug}`} className="flex items-center gap-3 hover:text-emerald-600 transition-colors group">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{project.area.name}</p>
                        <p className="text-xs text-slate-500">Browse area properties</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  </div>
                )}

                <Link href="/dashboard/post">
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl py-5 shadow-lg">
                    Post Property in This Project
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

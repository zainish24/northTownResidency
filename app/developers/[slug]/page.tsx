import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { EnhancedPropertyCard } from '@/components/enhanced-property-card'
import { Button } from '@/components/ui/button'
import { Building2, CheckCircle, MapPin, Globe, Phone, Mail, ChevronRight, ArrowRight, Calendar } from 'lucide-react'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('developers').select('name, description').eq('slug', slug).single()
  if (!data) return { title: 'Developer Not Found' }
  return { title: `${data.name} | Karachi Estates`, description: data.description || `Projects by ${data.name}` }
}

export default async function DeveloperPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: developer } = await supabase.from('developers').select('*').eq('slug', slug).eq('is_active', true).single()
  if (!developer) notFound()

  const { data: projects } = await supabase
    .from('projects').select('*, area:areas(id,name,slug)').eq('developer_id', developer.id).eq('is_active', true).order('created_at', { ascending: false })

  const projectIds = (projects || []).map((p: any) => p.id).filter(Boolean)
  const { data: listings } = projectIds.length > 0
    ? await supabase.from('listings')
        .select('*, area:areas(id,name,slug), project:projects(id,name,slug), property_type:property_types(id,name,slug,icon), listing_images(id,image_url,is_primary,display_order)')
        .eq('status', 'approved').in('project_id', projectIds)
        .order('created_at', { ascending: false }).limit(6)
    : { data: [] }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-white">
      <Header />
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative min-h-[45vh] flex items-end overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={developer.banner_url || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&h=600&fit=crop'}
              alt={developer.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 w-full z-10">
            <div className="flex items-center gap-2 text-sm text-white/70 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/developers" className="hover:text-white">Developers</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white">{developer.name}</span>
            </div>
            <div className="flex items-end gap-5">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white flex-shrink-0">
                {developer.logo_url ? (
                  <img src={developer.logo_url} alt={developer.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">{developer.name}</h1>
                  {developer.is_verified && (
                    <span className="flex items-center gap-1 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-300 text-xs px-2 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4">
                  {developer.established_year && (
                    <div className="flex items-center gap-1.5 text-white/80 text-sm">
                      <Calendar className="h-4 w-4 text-emerald-400" />
                      <span>Est. {developer.established_year}</span>
                    </div>
                  )}
                  {projects && (
                    <div className="flex items-center gap-1.5 text-white/80 text-sm">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                      <span>{projects.length} Projects</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-10">
              {/* About */}
              {developer.description && (
                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3">About {developer.name}</h2>
                  <p className="text-slate-600 leading-relaxed">{developer.description}</p>
                </section>
              )}

              {/* Projects */}
              {projects && projects.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-5">Projects</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                          {project.area && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3" />{project.area.name}
                            </div>
                          )}
                          {(project.min_price || project.max_price) && (
                            <p className="text-sm font-semibold text-emerald-600 mt-1">
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
              {listings && listings.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-5">Available Properties</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {listings.map((listing: any) => <EnhancedPropertyCard key={listing.id} listing={listing} />)}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4">Contact Developer</h3>
                  <div className="space-y-3">
                    {developer.phone && (
                      <a href={`tel:${developer.phone}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Phone className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-sm text-slate-700">{developer.phone}</span>
                      </a>
                    )}
                    {developer.email && (
                      <a href={`mailto:${developer.email}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Mail className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-sm text-slate-700">{developer.email}</span>
                      </a>
                    )}
                    {developer.website && (
                      <a href={developer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Globe className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-sm text-slate-700 truncate">{developer.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

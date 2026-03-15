import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Building2, MapPin, Sparkles, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Projects | Karachi Estates',
  description: 'Browse new real estate projects in Karachi',
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ area_id?: string; developer_id?: string; status?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()

  const [{ data: projects }, { data: areas }, { data: developers }] = await Promise.all([
    supabase.from('projects')
      .select('*, area:areas(id,name,slug), developer:developers(id,name,slug,logo_url)')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('areas').select('id,name,slug').eq('is_active', true).order('display_order'),
    supabase.from('developers').select('id,name,slug').eq('is_active', true).order('name'),
  ])

  const filtered = (projects || []).filter((p: any) => {
    if (params.area_id && p.area_id !== params.area_id) return false
    if (params.developer_id && p.developer_id !== params.developer_id) return false
    if (params.status && p.project_status !== params.status) return false
    return true
  })

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-white">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[40vh] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&h=600&fit=crop" alt="Projects" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg mb-4">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-medium text-white">{projects?.length || 0} Projects</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              New <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Projects</span> in Karachi
            </h1>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <form method="GET" action="/projects" className="flex flex-wrap gap-3">
              <select name="area_id" defaultValue={params.area_id || ''} className="py-2 px-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                <option value="">All Areas</option>
                {areas?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select name="developer_id" defaultValue={params.developer_id || ''} className="py-2 px-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                <option value="">All Developers</option>
                {developers?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select name="status" defaultValue={params.status || ''} className="py-2 px-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                <option value="">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Under Construction</option>
                <option value="completed">Ready</option>
              </select>
              <button type="submit" className="py-2 px-4 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors">Filter</button>
              {(params.area_id || params.developer_id || params.status) && (
                <Link href="/projects" className="py-2 px-4 border border-slate-200 text-slate-600 text-sm rounded-xl hover:border-red-300 hover:text-red-600 transition-colors">Clear</Link>
              )}
            </form>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((project: any) => (
                <Link key={project.id} href={`/projects/${project.slug}`} className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200/80 hover:-translate-y-1">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={project.image_url || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=225&fit=crop'}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${project.project_status === 'completed' ? 'bg-emerald-600' : project.project_status === 'upcoming' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                        {project.project_status === 'ongoing' ? 'Under Construction' : project.project_status === 'completed' ? 'Ready' : 'Upcoming'}
                      </span>
                      {project.is_featured && <span className="px-2 py-1 rounded-full text-xs font-semibold text-white bg-amber-500">Featured</span>}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors text-lg">{project.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      {project.area && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.area.name}</span>
                      )}
                      {project.developer && (
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{project.developer.name}</span>
                      )}
                    </div>
                    {project.description && <p className="text-xs text-slate-600 line-clamp-2 mb-3">{project.description}</p>}
                    {(project.min_price || project.max_price) && (
                      <p className="text-sm font-semibold text-emerald-600">
                        PKR {project.min_price ? `${(project.min_price / 1000000).toFixed(1)}M` : ''}{project.min_price && project.max_price ? ' – ' : ''}{project.max_price ? `${(project.max_price / 1000000).toFixed(1)}M` : ''}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No projects found.</p>
              <Link href="/projects" className="text-emerald-600 hover:underline text-sm mt-2 inline-block">Clear filters</Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

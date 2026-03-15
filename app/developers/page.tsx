import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Building2, CheckCircle, MapPin, ArrowRight, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Developers | Karachi Estates',
  description: 'Browse top real estate developers in Karachi',
}

export default async function DevelopersPage() {
  const supabase = await createClient()
  const { data: developers } = await supabase
    .from('developers')
    .select('*, projects:projects(count)')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name')

  const featured = developers?.filter(d => d.is_featured) || []
  const others = developers?.filter(d => !d.is_featured) || []

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-white">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[40vh] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&h=600&fit=crop" alt="Developers" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg mb-4">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-medium text-white">{developers?.length || 0} Developers</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Developers</span> in Karachi
            </h1>
            <p className="text-white/80 mt-4 max-w-xl mx-auto">Explore projects from Karachi's most trusted real estate developers</p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Featured */}
          {featured.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider bg-emerald-50 px-4 py-2 rounded-full">Featured Developers</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((dev: any) => (
                  <Link key={dev.id} href={`/developers/${dev.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200/80 hover:-translate-y-1">
                    {dev.banner_url ? (
                      <div className="h-32 overflow-hidden">
                        <img src={dev.banner_url} alt={dev.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-emerald-500 to-blue-600" />
                    )}
                    <div className="p-5 -mt-8 relative">
                      <div className="w-16 h-16 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-white mb-3">
                        {dev.logo_url ? (
                          <img src={dev.logo_url} alt={dev.name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{dev.name}</h3>
                            {dev.is_verified && <CheckCircle className="h-4 w-4 text-emerald-500 fill-emerald-100" />}
                          </div>
                          {dev.established_year && <p className="text-xs text-slate-500">Est. {dev.established_year}</p>}
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all mt-1" />
                      </div>
                      {dev.description && <p className="text-xs text-slate-600 mt-2 line-clamp-2">{dev.description}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* All Others */}
          {others.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6">All Developers</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {others.map((dev: any) => (
                  <Link key={dev.id} href={`/developers/${dev.slug}`} className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/80 hover:border-emerald-200 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white flex-shrink-0">
                      {dev.logo_url ? (
                        <img src={dev.logo_url} alt={dev.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors truncate">{dev.name}</p>
                        {dev.is_verified && <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
                      </div>
                      {dev.established_year && <p className="text-xs text-slate-500">Est. {dev.established_year}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(!developers || developers.length === 0) && (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No developers listed yet.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

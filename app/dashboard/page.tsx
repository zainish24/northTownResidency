import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EnhancedPropertyCard } from '@/components/enhanced-property-card'
import { PlusCircle, Edit, Trash, Building2, CheckCircle, Clock, XCircle, ArrowRight, Power, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Listing } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Building2 className="h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your dashboard</h2>
        <Link href="/auth/login">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Sign In</Button>
        </Link>
      </div>
    )
  }

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const userName = profile?.full_name || 'User'

  const { data: listings } = await supabase
    .from('listings')
    .select('*, area:areas(id,name,slug), project:projects(id,name,slug), property_type:property_types(id,name,slug,icon), listing_images(id,image_url,is_primary,display_order)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const stats = {
    total: listings?.length || 0,
    pending: listings?.filter(l => l.status === 'pending').length || 0,
    approved: listings?.filter(l => l.status === 'approved').length || 0,
    rejected: listings?.filter(l => l.status === 'rejected').length || 0,
  }

  const defaultTab = stats.approved ? 'approved' : stats.pending ? 'pending' : 'rejected'

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden w-full -mt-8">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=600&fit=crop" alt="Dashboard" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg mb-4">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-medium text-white">Welcome back, {userName}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Dashboard</span>
          </h1>
          {stats.total > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-1.5 text-white/90 text-sm">
                <Building2 className="h-4 w-4 text-emerald-400" />
                <span>{stats.total} Total Listings</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-10 relative z-30">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/50 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Your Properties</h2>
            <span className="text-xs text-slate-500">{stats.total} total listings</span>
          </div>
          <Button asChild className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl px-5 py-2.5 shadow-lg text-sm">
            <Link href="/dashboard/post" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Post New
            </Link>
          </Button>
        </div>

        {listings && listings.length > 0 ? (
          <Tabs defaultValue={defaultTab} className="w-full">
            <div className="flex flex-col lg:flex-row gap-6">
              <aside className="lg:w-64 shrink-0">
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
                    <CardTitle className="text-base">Filter by Status</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 gap-2">
                      {stats.approved > 0 && (
                        <TabsTrigger value="approved" className="w-full justify-start gap-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-3 px-4">
                          <CheckCircle className="h-4 w-4" />
                          <span className="flex-1 text-left">Approved</span>
                          <Badge className="bg-emerald-100 text-emerald-700">{stats.approved}</Badge>
                        </TabsTrigger>
                      )}
                      {stats.pending > 0 && (
                        <TabsTrigger value="pending" className="w-full justify-start gap-3 data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg py-3 px-4">
                          <Clock className="h-4 w-4" />
                          <span className="flex-1 text-left">Pending</span>
                          <Badge className="bg-amber-100 text-amber-700">{stats.pending}</Badge>
                        </TabsTrigger>
                      )}
                      {stats.rejected > 0 && (
                        <TabsTrigger value="rejected" className="w-full justify-start gap-3 data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-lg py-3 px-4">
                          <XCircle className="h-4 w-4" />
                          <span className="flex-1 text-left">Rejected</span>
                          <Badge className="bg-red-100 text-red-700">{stats.rejected}</Badge>
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg rounded-xl overflow-hidden mt-4">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
                    <CardTitle className="text-base">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {[
                      { label: 'Total Listings', value: stats.total, color: 'text-slate-900' },
                      { label: 'Approved', value: stats.approved, color: 'text-emerald-600' },
                      { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
                      { label: 'Rejected', value: stats.rejected, color: 'text-red-600' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{s.label}</span>
                        <span className={`font-bold ${s.color}`}>{s.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </aside>

              <div className="flex-1 min-w-0">
                {(['approved', 'pending', 'rejected'] as const).map(status => (
                  listings.filter(l => l.status === status).length > 0 && (
                    <TabsContent key={status} value={status} className="mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.filter(l => l.status === status).map((listing: Listing) => (
                          <div key={listing.id} className="relative group">
                            <div className="[&_button:has(svg.lucide-message-circle)]:hidden h-full">
                              <EnhancedPropertyCard listing={listing} showStatus />
                            </div>
                            {status === 'rejected' && listing.rejection_reason && (
                              <div className="absolute top-3 left-3 right-3 z-30 bg-red-100 border border-red-200 rounded-lg p-2">
                                <p className="text-xs font-semibold text-red-700 mb-0.5">Rejection Reason:</p>
                                <p className="text-xs text-red-600">{listing.rejection_reason}</p>
                              </div>
                            )}
                            <div className="absolute bottom-3 left-3 right-3 z-30 flex gap-1.5">
                              <Button size="sm" variant="secondary" asChild className="flex-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs h-8 shadow-lg">
                                <Link href={`/dashboard/post?edit=${listing.id}`}><Edit className="h-3 w-3" /></Link>
                              </Button>
                              <form action={async () => {
                                'use server'
                                const supabase = await createClient()
                                await supabase.from('listings').delete().eq('id', listing.id)
                                revalidatePath('/dashboard')
                              }} className="flex-1">
                                <Button size="sm" variant="secondary" type="submit" className="w-full bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs h-8 shadow-lg">
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </form>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )
                ))}
              </div>
            </div>
          </Tabs>
        ) : (
          <Card className="border-0 shadow-md rounded-xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Listings Yet</h3>
              <p className="text-sm text-slate-600 mb-5 max-w-sm mx-auto">Post your first property listing to get started</p>
              <Button asChild className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg px-5 py-2.5 text-sm shadow-md">
                <Link href="/dashboard/post" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> Post Your First Listing <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { EnhancedPropertyCard } from '@/components/enhanced-property-card'
import {
  PlusCircle, Edit, Trash, Eye, Building2, CheckCircle, Clock,
  XCircle, BarChart3, TrendingUp, Calendar, MapPin, Home, Store,
  Sparkles, ArrowRight, ChevronRight, Power
} from 'lucide-react'
import Link from 'next/link'
import type { Listing } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // For testing: always use fallback user if not authenticated
  const userId = user?.id || '11111111-1111-1111-1111-111111111111'
  
  console.log('Dashboard - Auth User:', user)
  console.log('Dashboard - Using User ID:', userId)
  
  // Get user profile for name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()
  
  const userName = profile?.full_name || 'User'

  // Fetch site settings for logo
  const { data: settingsData } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value')
    .eq('setting_key', 'logo_url')

  const logoUrl = settingsData?.[0]?.setting_value || ''

  const { data: listings, error } = await supabase
    .from('listings')
    .select('*, phase:phases(name), block:blocks(name), listing_images(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  console.log('Dashboard - User ID:', userId)
  console.log('Dashboard - Listings:', listings)
  console.log('Dashboard - Error:', error)

  const stats = {
    total: listings?.length || 0,
    pending: listings?.filter(l => l.status === 'pending').length || 0,
    approved: listings?.filter(l => l.status === 'approved').length || 0,
    rejected: listings?.filter(l => l.status === 'rejected').length || 0,
  }

  const hasPending = stats.pending > 0
  const hasApproved = stats.approved > 0
  const hasRejected = stats.rejected > 0
  const defaultTab = hasApproved ? 'approved' : hasPending ? 'pending' : hasRejected ? 'rejected' : 'approved'

  return (
    <>
      {/* Hero Section - Exactly like Listings Page */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden w-full -mt-8">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=600&fit=crop"
            alt="Dashboard"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80" />

          {/* Animated Overlay - 3 blobs */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full z-10">
          <div className="max-w-4xl mx-auto text-center space-y-5">
            {/* Badge with user name */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-medium text-white">
                Welcome back, {userName}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Dashboard</span>
            </h1>

            {/* Quick Stats - Only show if there are listings */}
            {stats.total > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <div className="flex items-center gap-1.5 text-white/90 text-sm">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  <span>{stats.total} Total Listings</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-10 relative z-30">
        {/* Compact Header */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/50 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                  ) : (
                    <Building2 className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Your Properties</h2>
                  <span className="text-xs text-slate-500">{listings?.length || 0} total listings</span>
                </div>
              </div>
            </div>
            <Button asChild className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl px-5 py-2.5 shadow-lg hover:shadow-xl transition-all text-sm">
              <Link href="/dashboard/post" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Post New
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {listings && listings.length > 0 ? (
            <Tabs defaultValue={defaultTab} className="w-full">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Tabs */}
                <aside className="lg:w-64 shrink-0">
                  <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
                      <CardTitle className="text-base">Filter by Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 gap-2">
                        {hasApproved && (
                          <TabsTrigger 
                            value="approved" 
                            className="w-full justify-start gap-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-3 px-4"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="flex-1 text-left">Approved</span>
                            <Badge className="bg-emerald-100 text-emerald-700 data-[state=active]:bg-white data-[state=active]:text-emerald-600">
                              {stats.approved}
                            </Badge>
                          </TabsTrigger>
                        )}
                        {hasPending && (
                          <TabsTrigger 
                            value="pending" 
                            className="w-full justify-start gap-3 data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg py-3 px-4"
                          >
                            <Clock className="h-4 w-4" />
                            <span className="flex-1 text-left">Pending</span>
                            <Badge className="bg-amber-100 text-amber-700 data-[state=active]:bg-white data-[state=active]:text-amber-600">
                              {stats.pending}
                            </Badge>
                          </TabsTrigger>
                        )}
                        {hasRejected && (
                          <TabsTrigger 
                            value="rejected" 
                            className="w-full justify-start gap-3 data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-lg py-3 px-4"
                          >
                            <XCircle className="h-4 w-4" />
                            <span className="flex-1 text-left">Rejected</span>
                            <Badge className="bg-red-100 text-red-700 data-[state=active]:bg-white data-[state=active]:text-red-600">
                              {stats.rejected}
                            </Badge>
                          </TabsTrigger>
                        )}
                      </TabsList>
                    </CardContent>
                  </Card>

                  {/* Quick Stats Card */}
                  <Card className="border-0 shadow-lg rounded-xl overflow-hidden mt-4">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
                      <CardTitle className="text-base">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Total Listings</span>
                        <span className="font-bold text-slate-900">{stats.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Active</span>
                        <span className="font-bold text-emerald-600">{listings.filter(l => l.is_active).length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Inactive</span>
                        <span className="font-bold text-slate-600">{listings.filter(l => !l.is_active).length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  {hasApproved && (
                    <TabsContent value="approved" className="mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.filter(l => l.status === 'approved').map((listing: Listing) => (
                      <div key={listing.id} className="relative group">
                        <div className="[&_button:has(svg.lucide-message-circle)]:hidden h-full">
                          <EnhancedPropertyCard listing={listing} />
                        </div>
                        {!listing.is_active && (
                          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                            <div className="text-center">
                              <Power className="h-10 w-10 text-white/80 mx-auto mb-2" />
                              <span className="text-white text-sm font-bold">Inactive</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 right-3 z-30 flex gap-1.5">
                          <form action={async () => { 'use server'; const supabase = await createClient(); await supabase.from('listings').update({ is_active: !listing.is_active }).eq('id', listing.id); revalidatePath('/dashboard') }} className="flex-1">
                            <Button size="sm" variant="secondary" type="submit" className={`w-full rounded-lg text-xs h-8 shadow-lg ${listing.is_active ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-600 text-white hover:bg-slate-700'}`}>
                              <Power className="h-3 w-3" />
                            </Button>
                          </form>
                          <Button size="sm" variant="secondary" asChild className="flex-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs h-8 shadow-lg">
                            <Link href={`/dashboard/post?edit=${listing.id}`}><Edit className="h-3 w-3" /></Link>
                          </Button>
                          <form action={async () => { 'use server'; const supabase = await createClient(); await supabase.from('listings').delete().eq('id', listing.id); revalidatePath('/dashboard') }} className="flex-1">
                            <Button size="sm" variant="secondary" type="submit" className="w-full bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs h-8 shadow-lg">
                              <Trash className="h-3 w-3" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                      </div>
                    </TabsContent>
                  )}

                  {hasPending && (
                    <TabsContent value="pending" className="mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.filter(l => l.status === 'pending').map((listing: Listing) => (
                      <div key={listing.id} className="relative group">
                        <div className="[&_button:has(svg.lucide-message-circle)]:hidden h-full">
                          <EnhancedPropertyCard listing={listing} />
                        </div>
                        {!listing.is_active && (
                          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                            <div className="text-center">
                              <Power className="h-10 w-10 text-white/80 mx-auto mb-2" />
                              <span className="text-white text-sm font-bold">Inactive</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 right-3 z-30 flex gap-1.5">
                          <form action={async () => { 'use server'; const supabase = await createClient(); await supabase.from('listings').update({ is_active: !listing.is_active }).eq('id', listing.id); revalidatePath('/dashboard') }} className="flex-1">
                            <Button size="sm" variant="secondary" type="submit" className={`w-full rounded-lg text-xs h-8 shadow-lg ${listing.is_active ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-600 text-white hover:bg-slate-700'}`}>
                              <Power className="h-3 w-3" />
                            </Button>
                          </form>
                          <Button size="sm" variant="secondary" asChild className="flex-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs h-8 shadow-lg">
                            <Link href={`/dashboard/post?edit=${listing.id}`}><Edit className="h-3 w-3" /></Link>
                          </Button>
                          <form action={async () => { 'use server'; const supabase = await createClient(); await supabase.from('listings').delete().eq('id', listing.id); revalidatePath('/dashboard') }} className="flex-1">
                            <Button size="sm" variant="secondary" type="submit" className="w-full bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs h-8 shadow-lg">
                              <Trash className="h-3 w-3" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                      </div>
                    </TabsContent>
                  )}

                  {hasRejected && (
                    <TabsContent value="rejected" className="mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.filter(l => l.status === 'rejected').map((listing: Listing) => (
                      <div key={listing.id} className="relative group">
                        <div className="[&_button:has(svg.lucide-message-circle)]:hidden h-full">
                          <EnhancedPropertyCard listing={listing} />
                        </div>
                        <div className="absolute top-3 left-3 right-3 z-30">
                          <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                            <p className="text-xs text-red-600">{listing.rejection_reason || 'No reason provided'}</p>
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 z-30 flex gap-1.5">
                          <Button size="sm" variant="secondary" asChild className="flex-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs h-8 shadow-lg">
                            <Link href={`/dashboard/post?edit=${listing.id}`}><Edit className="h-3 w-3" /></Link>
                          </Button>
                          <form action={async () => { 'use server'; const supabase = await createClient(); await supabase.from('listings').delete().eq('id', listing.id); revalidatePath('/dashboard') }} className="flex-1">
                            <Button size="sm" variant="secondary" type="submit" className="w-full bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs h-8 shadow-lg">
                              <Trash className="h-3 w-3" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                      </div>
                    </TabsContent>
                  )}
                </div>
              </div>
            </Tabs>
          ) : (
            <Card className="border-0 shadow-md rounded-xl overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50/30">
              <CardContent className="p-8 text-center">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-blue-400/30 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-12 transition-all duration-300">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Listings Yet</h3>
                <p className="text-sm text-slate-600 mb-5 max-w-sm mx-auto">
                  Post your first property listing to get started
                </p>
                <Button asChild className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-lg px-5 py-2.5 text-sm shadow-md hover:shadow-lg transition-all">
                  <Link href="/dashboard/post" className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Post Your First Listing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
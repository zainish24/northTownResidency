import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from './admin-dashboard-client'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const [
    { count: totalListings },
    { count: pendingListings },
    { count: approvedListings },
    { count: rejectedListings },
    { count: totalUsers },
    { data: recentListings },
    { data: storageData },
    { data: allListings },
    { data: viewsData }
  ] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*, area:areas(name), project:projects(name), profile:profiles(full_name, phone)').order('created_at', { ascending: false }).limit(5),
    supabase.storage.from('property-images').list(),
    supabase.from('listings').select('*, area:areas(name), property_type:property_types(name)').order('created_at', { ascending: false }),
    supabase.from('listings').select('views_count')
  ])

  // Calculate total views
  const totalViews = viewsData?.reduce((acc, listing) => acc + (listing.views_count || 0), 0) || 0

  // Calculate storage usage
  const totalStorageBytes = storageData?.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) || 0
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2)
  const storageLimit = 1024
  const storagePercentage = ((parseFloat(totalStorageMB) / storageLimit) * 100).toFixed(1)

  // Prepare chart data
  const monthlyData = prepareMonthlyData(allListings || [])
  const areaData = preparePhaseData(allListings || [])
  const typeData = prepareTypeData(allListings || [])
  const statusData = prepareStatusData(totalListings || 0, pendingListings || 0, approvedListings || 0, rejectedListings || 0)

  const stats = [
    { title: 'Total Listings', value: totalListings || 0, icon: 'FileText', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', trend: '+12%' },
    { title: 'Total Users', value: totalUsers || 0, icon: 'Users', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', trend: '+5%' },
    { title: 'Total Views', value: totalViews, icon: 'Eye', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', trend: '+18%' },
    { title: 'Storage Used', value: `${totalStorageMB} MB`, subtitle: `${storagePercentage}% of 1 GB`, icon: 'HardDrive', iconBg: parseFloat(storagePercentage) > 80 ? 'bg-red-100' : 'bg-green-100', iconColor: parseFloat(storagePercentage) > 80 ? 'text-red-600' : 'text-green-600' },
  ]

  return (
    <AdminDashboardClient
      stats={stats}
      recentListings={recentListings || []}
      chartData={{
        monthly: monthlyData,
        byPhase: areaData,
        byType: typeData,
        byStatus: statusData,
        revenue: prepareRevenueData(),
        activity: prepareActivityData()
      }}
    />
  )
}

function prepareRevenueData() {
  return [
    { month: 'Jan', revenue: 45000, target: 50000 },
    { month: 'Feb', revenue: 52000, target: 50000 },
    { month: 'Mar', revenue: 48000, target: 50000 },
    { month: 'Apr', revenue: 61000, target: 55000 },
    { month: 'May', revenue: 55000, target: 55000 },
    { month: 'Jun', revenue: 67000, target: 60000 }
  ]
}

function prepareActivityData() {
  return [
    { day: 'Mon', views: 245, clicks: 89, conversions: 12 },
    { day: 'Tue', views: 312, clicks: 124, conversions: 18 },
    { day: 'Wed', views: 289, clicks: 98, conversions: 15 },
    { day: 'Thu', views: 356, clicks: 145, conversions: 22 },
    { day: 'Fri', views: 398, clicks: 167, conversions: 28 },
    { day: 'Sat', views: 423, clicks: 189, conversions: 31 },
    { day: 'Sun', views: 367, clicks: 142, conversions: 24 }
  ]
}

function prepareMonthlyData(listings: any[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const data = months.map(month => ({
    month,
    listings: Math.floor(Math.random() * 20) + 5
  }))
  
  // Use actual data if available
  const now = new Date()
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return d.toLocaleString('default', { month: 'short' })
  })
  
  return last6Months.map((month, i) => ({
    month,
    listings: listings.filter(l => {
      const created = new Date(l.created_at)
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return created.getMonth() === targetMonth.getMonth() && created.getFullYear() === targetMonth.getFullYear()
    }).length
  }))
}

function preparePhaseData(listings: any[]) {
  const areas: any = {}
  listings.forEach(l => {
    const areaName = l.area?.name || 'Unknown'
    areas[areaName] = (areas[areaName] || 0) + 1
  })
  return Object.entries(areas).map(([phase, count]) => ({ phase, count }))
}

function prepareTypeData(listings: any[]) {
  const sale = listings.filter(l => l.purpose === 'sale').length
  const rent = listings.filter(l => l.purpose === 'rent').length
  return [
    { name: 'Sale', value: sale },
    { name: 'Rent', value: rent }
  ]
}

function prepareStatusData(total: number, pending: number, approved: number, rejected: number) {
  return [
    { status: 'Approved', count: approved },
    { status: 'Pending', count: pending },
    { status: 'Rejected', count: rejected }
  ]
}

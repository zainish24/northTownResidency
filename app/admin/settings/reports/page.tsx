'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  BarChart3, Download, Loader2, TrendingUp, Users, Building2, Eye,
  Calendar, Filter, RefreshCw, ChevronRight, PieChart, LineChart as LineChartIcon,
  Home, Store, MapPin, Clock, Star, Award, Target, Rocket,
  Bell, Settings, User, Grid3x3, List, MoreVertical, Copy,
  AlertCircle, CheckCircle, XCircle, Mail, Phone, Globe,
  DollarSign, Percent, Activity, ArrowUpRight, ArrowDownRight, FileText
} from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RePieChart,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter
} from 'recharts'

const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316',
  indigo: '#6366f1',
  cyan: '#06b6d4'
}

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'
]

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')
  const [activeTab, setActiveTab] = useState('overview')
  const [exportDialog, setExportDialog] = useState(false)
  const [stats, setStats] = useState({
    totalListings: 0,
    totalUsers: 0,
    totalViews: 0,
    totalInquiries: 0,
    avgPrice: 0,
    conversionRate: 0,
    listingsByPhase: [] as any[],
    listingsByType: [] as any[],
    recentListings: [] as any[],
    userGrowth: [] as any[],
    listingTrends: [] as any[],
    topPerforming: [] as any[],
    activityLog: [] as any[]
  })

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const [listings, users, phases, inquiries] = await Promise.all([
      supabase.from('listings').select('*, phases(name), profiles(full_name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, created_at'),
      supabase.from('phases').select('name, id'),
      supabase.from('inquiries').select('*')
    ])

    const totalViews = listings.data?.reduce((sum, l) => sum + (l.views_count || 0), 0) || 0
    const avgPrice = listings.data?.reduce((sum, l) => sum + (l.price || 0), 0) || 0
    const avgPriceValue = listings.data?.length ? Math.round(avgPrice / listings.data.length) : 0

    // Listings by Phase
    const byPhase = phases.data?.map(phase => ({
      name: phase.name,
      value: listings.data?.filter(l => l.phases?.name === phase.name).length || 0
    })) || []

    // Listings by Type
    const byType = [
      { name: 'Residential Plot', value: listings.data?.filter(l => l.property_type === 'residential_plot').length || 0 },
      { name: 'Commercial Shop', value: listings.data?.filter(l => l.property_type === 'commercial_shop').length || 0 }
    ]

    // User Growth (last 6 months)
    const userGrowth = generateUserGrowth(users.data || [])
    
    // Listing Trends (last 6 months)
    const listingTrends = generateListingTrends(listings.data || [])

    // Top Performing Listings
    const topPerforming = listings.data
      ?.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      .slice(0, 5) || []

    // Recent Activity
    const activityLog = generateActivityLog(listings.data || [])

    setStats({
      totalListings: listings.data?.length || 0,
      totalUsers: users.data?.length || 0,
      totalViews,
      totalInquiries: inquiries.data?.length || 0,
      avgPrice: avgPriceValue,
      conversionRate: 2.4,
      listingsByPhase: byPhase,
      listingsByType: byType,
      recentListings: listings.data?.slice(0, 10) || [],
      userGrowth,
      listingTrends,
      topPerforming,
      activityLog
    })
    
    setLoading(false)
  }

  const generateUserGrowth = (users: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    
    return Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (now.getMonth() - 5 + i + 12) % 12
      const month = months[monthIndex]
      const year = now.getFullYear() - (monthIndex > now.getMonth() ? 1 : 0)
      
      const count = users.filter(u => {
        const date = new Date(u.created_at)
        return date.getMonth() === monthIndex && date.getFullYear() === year
      }).length

      return { month, users: count }
    })
  }

  const generateListingTrends = (listings: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    
    return Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (now.getMonth() - 5 + i + 12) % 12
      const month = months[monthIndex]
      const year = now.getFullYear() - (monthIndex > now.getMonth() ? 1 : 0)
      
      const count = listings.filter(l => {
        const date = new Date(l.created_at)
        return date.getMonth() === monthIndex && date.getFullYear() === year
      }).length

      return { month, listings: count }
    })
  }

  const generateActivityLog = (listings: any[]) => {
    return listings.slice(0, 5).map(l => ({
      id: l.id,
      title: l.title,
      action: 'New Listing Added',
      user: l.profiles?.full_name || 'Unknown',
      time: new Date(l.created_at).toLocaleDateString(),
      status: l.status
    }))
  }

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const csv = [
      ['Metric', 'Value'],
      ['Total Listings', stats.totalListings],
      ['Total Users', stats.totalUsers],
      ['Total Views', stats.totalViews],
      ['Total Inquiries', stats.totalInquiries],
      ['Average Price', `PKR ${stats.avgPrice.toLocaleString()}`],
      ['Conversion Rate', `${stats.conversionRate}%`],
      [''],
      ['Phase', 'Listings'],
      ...stats.listingsByPhase.map(p => [p.name, p.value]),
      [''],
      ['Property Type', 'Listings'],
      ...stats.listingsByType.map(t => [t.name, t.value]),
      [''],
      ['Monthly User Growth'],
      ['Month', 'Users'],
      ...stats.userGrowth.map(g => [g.month, g.users]),
      [''],
      ['Monthly Listing Trends'],
      ['Month', 'Listings'],
      ...stats.listingTrends.map(t => [t.month, t.listings])
    ].map(row => row.join(',')).join('\n')

    if (format === 'csv') {
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ntr-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } 
    else if (format === 'excel') {
      const data = [
        { Metric: 'Total Listings', Value: stats.totalListings },
        { Metric: 'Total Users', Value: stats.totalUsers },
        { Metric: 'Total Views', Value: stats.totalViews },
      ]
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Report')
      XLSX.writeFile(wb, `ntr-report-${new Date().toISOString().split('T')[0]}.xlsx`)
    }
    else if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('NTR Analytics Report', 14, 15)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22)
      
      autoTable(doc, {
        head: [['Metric', 'Value']],
        body: [
          ['Total Listings', stats.totalListings],
          ['Total Users', stats.totalUsers],
          ['Total Views', stats.totalViews],
        ],
        startY: 28,
      })
      
      doc.save(`ntr-report-${new Date().toISOString().split('T')[0]}.pdf`)
    }
    
    toast.success('Report exported successfully')
    setExportDialog(false)
  }

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `PKR ${(price / 10000000).toFixed(1)}Cr`
    } else if (price >= 100000) {
      return `PKR ${(price / 100000).toFixed(1)}L`
    }
    return `PKR ${price.toLocaleString()}`
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
        <div className="relative w-20 h-20 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-slate-600 font-medium">Loading analytics...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Reports & Analytics</h1>
                <p className="text-xs text-slate-500">Comprehensive platform insights and metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <Avatar className="h-8 w-8 bg-emerald-600">
                  <AvatarFallback className="bg-emerald-600 text-white">AD</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-900">Admin User</p>
                  <p className="text-xs text-slate-500">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button 
              onClick={fetchReports}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-white border-slate-200">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setExportDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white">Overview</TabsTrigger>
            <TabsTrigger value="listings" className="data-[state=active]:bg-white">Listings</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white">Users</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white">Performance</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">+12%</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">Total Listings</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalListings}</p>
                  <p className="text-xs text-slate-500 mt-2">↑ 24 new this month</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">+8%</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
                  <p className="text-xs text-slate-500 mt-2">↑ 56 new this month</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Eye className="h-6 w-6 text-purple-600" />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">+15%</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">Total Views</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalViews.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-2">↑ 2.4k this week</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-amber-600" />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">+5%</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">Avg. Price</p>
                  <p className="text-3xl font-bold text-slate-900">{formatPrice(stats.avgPrice)}</p>
                  <p className="text-xs text-slate-500 mt-2">↑ 2.3% increase</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">User Growth</CardTitle>
                      <p className="text-sm text-slate-500">Last 6 months</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stats.userGrowth}>
                      <defs>
                        <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke={COLORS.primary} 
                        strokeWidth={3}
                        fill="url(#userGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Listing Trends Chart */}
              <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <LineChartIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Listing Trends</CardTitle>
                      <p className="text-sm text-slate-500">Last 6 months</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.listingTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="listings" 
                        stroke={COLORS.secondary} 
                        strokeWidth={3}
                        dot={{ fill: COLORS.secondary, r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Listings by Phase */}
              <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <PieChart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Listings by Phase</CardTitle>
                      <p className="text-sm text-slate-500">Distribution across phases</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={stats.listingsByPhase}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.listingsByPhase.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {stats.listingsByPhase.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="text-xs text-slate-600">{item.name}</span>
                        <span className="text-xs font-medium text-slate-900 ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Listings by Type */}
              <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Listings by Type</CardTitle>
                      <p className="text-sm text-slate-500">Residential vs Commercial</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-8 mb-6">
                    {stats.listingsByType.map((item, index) => (
                      <div key={index} className="text-center">
                        <div className="text-3xl font-bold text-slate-900">{item.value}</div>
                        <div className="text-sm text-slate-500">{item.name}</div>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.listingsByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis dataKey="name" type="category" stroke="#64748b" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill={COLORS.primary} radius={[0, 8, 8, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Listings */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Award className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Top Performing Listings</CardTitle>
                      <p className="text-sm text-slate-500">Most viewed properties</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {stats.topPerforming.map((listing, index) => (
                    <div key={listing.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{listing.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {listing.phases?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {listing.views_count || 0} views
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{formatPrice(listing.price)}</p>
                        <Badge className="mt-1 text-xs">
                          {listing.property_type === 'residential_plot' ? 'Plot' : 'Shop'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <p className="text-sm text-slate-500">Latest platform actions</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {stats.activityLog.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                        <p className="text-xs text-slate-500">{activity.action} by {activity.user}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          activity.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          activity.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {activity.status}
                        </Badge>
                        <span className="text-xs text-slate-400">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Download className="h-5 w-5" />
              Export Report
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              Choose a format to export the analytics report
            </p>
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 hover:bg-emerald-50 hover:border-emerald-200"
                onClick={() => handleExport('csv')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">CSV File</p>
                    <p className="text-xs text-slate-500">Comma-separated values for Excel</p>
                  </div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => handleExport('excel')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Excel File</p>
                    <p className="text-xs text-slate-500">Microsoft Excel format (.xlsx)</p>
                  </div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 hover:bg-red-50 hover:border-red-200"
                onClick={() => handleExport('pdf')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">PDF Document</p>
                    <p className="text-xs text-slate-500">Portable document format</p>
                  </div>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
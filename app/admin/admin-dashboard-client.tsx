'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, Shield, TrendingUp, FileText, Users, Clock, CheckCircle, XCircle, HardDrive,
  Home, Store, MapPin, Filter, Download, Calendar, ArrowUpRight, ArrowDownRight,
  Eye, MessageCircle, Phone, Mail, Star, Award, Zap, BarChart3, PieChart as PieChartIcon, 
  LineChart as LineChartIcon, RefreshCw, MoreVertical, Settings, Bell,
  Search, ChevronRight, AlertCircle, DollarSign, Percent, Target, Rocket
} from 'lucide-react'
import Link from 'next/link'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface AdminDashboardClientProps {
  stats: any[]
  recentListings: any[]
  chartData: {
    monthly: any[]
    byPhase: any[]
    byType: any[]
    byStatus: any[]
    revenue: any[]
    activity: any[]
  }
}

const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316'
}

const STATUS_COLORS = {
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  rejected: 'bg-red-100 text-red-700 border-red-200'
}

const iconMap: any = {
  FileText, Users, Clock, CheckCircle, XCircle, HardDrive,
  Home, Store, MapPin, Eye, MessageCircle, Phone, Mail, Star, Award
}

export function AdminDashboardClient({ stats, recentListings, chartData }: AdminDashboardClientProps) {
  const [timeRange, setTimeRange] = useState('week')
  const [notifications, setNotifications] = useState(0)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [selectedListing, setSelectedListing] = useState<any>(null)

  useEffect(() => {
    loadNotificationCount()
  }, [])

  const loadNotificationCount = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    
    setNotifications(count || 0)
  }

  const openListingModal = async (listingId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('listings')
      .select('*, phase:phases(name), block:blocks(name), profile:profiles(full_name, phone), listing_images(*)')
      .eq('id', listingId)
      .single()

    if (!error && data) {
      setSelectedListing(data)
    }
  }

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    try {
      setExportLoading(true)
      
      const data = recentListings.map(l => ({
        Title: l.title,
        Phase: l.phase?.name || 'N/A',
        Block: l.block?.name || 'N/A',
        'Property Type': l.property_type,
        'Listing Type': l.listing_type,
        Price: l.price,
        Size: l.plot_size_sqyd || l.shop_size_sqft || 'N/A',
        Status: l.status,
        Owner: l.profile?.full_name || 'N/A',
        Phone: l.profile?.phone || 'N/A',
        'Created At': new Date(l.created_at).toLocaleDateString()
      }))

      if (format === 'csv') {
        const csv = [
          Object.keys(data[0]).join(','),
          ...data.map(row => Object.values(row).map(cell => `"${cell}"`).join(','))
        ].join('\n')
        
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } 
      else if (format === 'excel') {
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Dashboard')
        XLSX.writeFile(wb, `dashboard-export-${new Date().toISOString().split('T')[0]}.xlsx`)
      }
      else if (format === 'pdf') {
        const doc = new jsPDF()
        doc.setFontSize(16)
        doc.text('NTR Dashboard Report', 14, 15)
        doc.setFontSize(10)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22)
        
        autoTable(doc, {
          head: [Object.keys(data[0])],
          body: data.map(row => Object.values(row)),
          startY: 28,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [16, 185, 129], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        })
        
        doc.save(`dashboard-export-${new Date().toISOString().split('T')[0]}.pdf`)
      }
      
      setExportDialogOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-slate-900">AdminPanel</span>
              </div>
              <div className="hidden md:flex items-center gap-1">
                <Button variant="ghost" size="sm" className="text-emerald-600 bg-emerald-50">Dashboard</Button>
                <Button variant="ghost" size="sm">Listings</Button>
                <Button variant="ghost" size="sm">Users</Button>
                <Button variant="ghost" size="sm">Reports</Button>
                <Button variant="ghost" size="sm">Settings</Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-900">Admin User</p>
                  <p className="text-xs text-slate-500">admin@ntr.pk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Welcome back, Admin</h1>
            <p className="text-slate-500 text-xs">Here's what's happening with your platform today.</p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200">
              <Button 
                size="sm" 
                variant={timeRange === 'day' ? 'default' : 'ghost'}
                className={timeRange === 'day' ? 'bg-emerald-600 text-white' : ''}
                onClick={() => setTimeRange('day')}
              >
                Day
              </Button>
              <Button 
                size="sm" 
                variant={timeRange === 'week' ? 'default' : 'ghost'}
                className={timeRange === 'week' ? 'bg-emerald-600 text-white' : ''}
                onClick={() => setTimeRange('week')}
              >
                Week
              </Button>
              <Button 
                size="sm" 
                variant={timeRange === 'month' ? 'default' : 'ghost'}
                className={timeRange === 'month' ? 'bg-emerald-600 text-white' : ''}
                onClick={() => setTimeRange('month')}
              >
                Month
              </Button>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setExportDialogOpen(true)}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {stats.slice(0, 4).map((stat: any, index) => {
            const Icon = iconMap[stat.icon]
            return (
              <div key={index} className="bg-white rounded-lg p-3 border border-slate-200 hover:shadow-md transition-all hover:border-emerald-200 group">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {Icon && <Icon className={`h-4 w-4 ${stat.iconColor}`} />}
                  </div>
                  {stat.trend && (
                    <div className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      <TrendingUp className="h-3 w-3" />
                      {stat.trend}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 mb-0.5">{stat.title}</p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Charts Row 1 - Main Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Monthly Trend Chart */}
          <Card className="lg:col-span-2 border-0 shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="pb-2 border-b border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <LineChartIcon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Monthly Listings</CardTitle>
                    <p className="text-xs text-slate-500">Last 6 months</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData.monthly}>
                  <defs>
                    <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="listings" 
                    stroke={COLORS.primary} 
                    strokeWidth={3}
                    fill="url(#colorListings)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Phase Distribution */}
          <Card className="border-0 shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="pb-2 border-b border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PieChartIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-sm">Phase Distribution</CardTitle>
                  <p className="text-xs text-slate-500">By phase</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={chartData.byPhase}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {chartData.byPhase.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {chartData.byPhase.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] }} />
                    <span className="text-xs text-slate-600">{item.phase}</span>
                    <span className="text-xs font-medium text-slate-900 ml-auto">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 - Advanced Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Listing Type Distribution */}
          <Card className="border-0 shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="pb-2 border-b border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-sm">Listing Type</CardTitle>
                  <p className="text-xs text-slate-500">Sale vs Rent</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">For Sale</span>
                  <span className="text-sm font-semibold text-slate-900">65%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{width: '65%'}}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">For Rent</span>
                  <span className="text-sm font-semibold text-slate-900">35%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '35%'}}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Type Distribution */}
          <Card className="border-0 shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="pb-2 border-b border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-sm">Property Types</CardTitle>
                  <p className="text-xs text-slate-500">Res vs Com</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-6 mb-3">
                {chartData.byType.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{item.value}</div>
                    <div className="text-xs text-slate-500">{item.name}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={chartData.byType}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                  >
                    <Cell fill={COLORS.primary} />
                    <Cell fill={COLORS.secondary} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Listings Table */}
        <Card className="border-0 shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all">
          <CardHeader className="pb-2 border-b border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-sm">Recent Submissions</CardTitle>
                  <p className="text-xs text-slate-500">Latest listings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Link href="/admin/listings">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {recentListings?.map((listing) => (
                <div 
                  key={listing.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-200 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {listing.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing.phase?.name} • {listing.block?.name}
                      </span>
                      <span className="text-slate-600 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {listing.profile?.full_name || listing.profile?.phone}
                      </span>
                      <span className="text-slate-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openListingModal(listing.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {!recentListings?.length && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No recent submissions</p>
                  <p className="text-sm text-slate-500 mt-1">New listings will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Footer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <Button className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 h-auto py-3 gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Manage Users</p>
              <p className="text-xs text-slate-500">View profiles</p>
            </div>
          </Button>
          <Button className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 h-auto py-3 gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">All Listings</p>
              <p className="text-xs text-slate-500">Manage listings</p>
            </div>
          </Button>
          <Button className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 h-auto py-3 gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Reports</p>
              <p className="text-xs text-slate-500">View analytics</p>
            </div>
          </Button>
          <Button className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 h-auto py-3 gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Settings</p>
              <p className="text-xs text-slate-500">Configure</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Listing Detail Modal */}
      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {selectedListing && (
            <div className="divide-y divide-slate-200">
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
                <DialogTitle className="text-xl mb-2">{selectedListing.title}</DialogTitle>
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedListing.phase?.name} • {selectedListing.block?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedListing.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Images Grid */}
                {selectedListing.listing_images && selectedListing.listing_images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedListing.listing_images.slice(0, 4).map((img: any, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img src={img.image_url} alt={`Property ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <Home className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="text-sm font-semibold capitalize">{selectedListing.property_type?.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <Store className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Size</p>
                    <p className="text-sm font-semibold">
                      {selectedListing.plot_size_sqyd || selectedListing.shop_size_sqft} {selectedListing.plot_size_sqyd ? 'Sq. Yds' : 'Sq. Ft'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <Eye className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Views</p>
                    <p className="text-sm font-semibold">{selectedListing.views_count || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <Calendar className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Posted</p>
                    <p className="text-sm font-semibold">{new Date(selectedListing.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-1">Price</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    PKR {selectedListing.price?.toLocaleString()}
                    {selectedListing.price_type === 'negotiable' && (
                      <span className="text-sm font-normal text-slate-500 ml-2">(Negotiable)</span>
                    )}
                  </p>
                </div>

                {/* Description */}
                {selectedListing.description && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedListing.description}</p>
                  </div>
                )}

                {/* Features */}
                {(selectedListing.is_corner || selectedListing.is_road_facing || selectedListing.is_park_facing || selectedListing.is_west_open) && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedListing.is_corner && (
                        <Badge className="bg-orange-100 text-orange-700 border-0 px-3 py-1">
                          Corner Plot
                        </Badge>
                      )}
                      {selectedListing.is_road_facing && (
                        <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1">
                          Road Facing
                        </Badge>
                      )}
                      {selectedListing.is_park_facing && (
                        <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1">
                          Park Facing
                        </Badge>
                      )}
                      {selectedListing.is_west_open && (
                        <Badge className="bg-yellow-100 text-yellow-700 border-0 px-3 py-1">
                          West Open
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Owner Info */}
                <Card className="border-0 bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {selectedListing.profile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{selectedListing.profile?.full_name || 'User'}</p>
                          <p className="text-sm text-slate-500">{selectedListing.profile?.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={`tel:${selectedListing.profile?.phone}`}>
                          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <Phone className="h-4 w-4" />
                            Call
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rejection Reason */}
                {selectedListing.status === 'rejected' && selectedListing.rejection_reason && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-700 mb-1">Rejection Reason</p>
                          <p className="text-sm text-red-600">{selectedListing.rejection_reason}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-6 bg-slate-50 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedListing(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Download className="h-5 w-5" />
              Export Dashboard Data
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              Choose a format to export dashboard data
            </p>
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 hover:bg-emerald-50 hover:border-emerald-200"
                onClick={() => handleExport('csv')}
                disabled={exportLoading}
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
                disabled={exportLoading}
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
                disabled={exportLoading}
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
            <Button variant="outline" onClick={() => setExportDialogOpen(false)} disabled={exportLoading}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
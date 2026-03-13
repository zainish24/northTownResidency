'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Star, Search, Eye, MapPin, Users, Clock, RefreshCw, FileText, 
  Home, Store, Phone, User, CheckCircle, XCircle, Maximize, Calendar,
  Filter, Grid3x3, List, Download, Trash2, Edit, Copy, BarChart3,
  TrendingUp, Award, Shield, Sparkles, Bell, ChevronRight, Settings,
  AlertCircle, CheckCheck, X, MoreVertical, Share2, Printer, Mail, MessageCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Listing } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [allListings, setAllListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [rejectDialog, setRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null)
  const [sortBy, setSortBy] = useState('newest')

  const [shareDialog, setShareDialog] = useState(false)
  const [exportDialog, setExportDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchListings()
  }, [statusFilter, sortBy])

  const fetchListings = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Fetch all listings for stats (only active ones)
    const { data: allData } = await supabase
      .from('listings')
      .select('*, phase:phases(name), block:blocks(name), profile:profiles(full_name, phone), listing_images(image_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (allData) {
      setAllListings(allData as Listing[])
    }

    // Fetch filtered listings (only active ones)
    let query = supabase
      .from('listings')
      .select('*, phase:phases(name), block:blocks(name), profile:profiles(full_name, phone), listing_images(image_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query
    if (!error && data) {
      let sortedData = [...data]
      if (sortBy === 'price-high') {
        sortedData.sort((a, b) => b.price - a.price)
      } else if (sortBy === 'price-low') {
        sortedData.sort((a, b) => a.price - b.price)
      } else if (sortBy === 'views') {
        sortedData.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      }
      setListings(sortedData as Listing[])
    }
    setLoading(false)
  }

  const openListingModal = async (listingId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('listings')
      .select('*, phase:phases(name), block:blocks(name), profile:profiles(full_name, phone), listing_images(*)')
      .eq('id', listingId)
      .single()

    if (!error && data) {
      setSelectedListing(data as Listing)
    }
  }

  const handleApprove = async (listingId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('listings')
      .update({ status: 'approved' })
      .eq('id', listingId)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ 
        title: '✅ Success', 
        description: 'Listing approved successfully',
        className: 'bg-emerald-50 border-emerald-200'
      })
      fetchListings()
    }
  }

  const handleReject = async () => {
    if (!selectedListing || !rejectionReason) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('listings')
      .update({ status: 'rejected', rejection_reason: rejectionReason })
      .eq('id', selectedListing.id)

    if (!error) {
      // Log activity
      await supabase.from('activity_logs').insert({
        admin_id: user?.id,
        action: 'reject_listing',
        entity_type: 'listing',
        entity_id: selectedListing.id,
        details: { reason: rejectionReason, title: selectedListing.title }
      })
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ 
        title: '⛔ Rejected', 
        description: 'Listing has been rejected',
        className: 'bg-red-50 border-red-200'
      })
      setRejectDialog(false)
      setRejectionReason('')
      setSelectedListing(null)
      fetchListings()
    }
  }

  const handleFeature = async (listingId: string, isFeatured: boolean) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('listings')
      .update({ is_featured: !isFeatured })
      .eq('id', listingId)

    if (!error) {
      // Log activity
      await supabase.from('activity_logs').insert({
        admin_id: user?.id,
        action: isFeatured ? 'unfeature_listing' : 'feature_listing',
        entity_type: 'listing',
        entity_id: listingId,
        details: {}
      })
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ 
        title: isFeatured ? '⭐ Removed from featured' : '⭐ Added to featured',
        className: 'bg-amber-50 border-amber-200'
      })
      fetchListings()
    }
  }

  const handleDelete = async (listingId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)

    if (!error) {
      await supabase.from('activity_logs').insert({
        admin_id: user?.id,
        action: 'delete_listing',
        entity_type: 'listing',
        entity_id: listingId,
        details: {}
      })
      
      toast({ 
        title: '✅ Deleted', 
        description: 'Listing deleted successfully',
        className: 'bg-emerald-50 border-emerald-200'
      })
      setDeleteDialog(false)
      setListingToDelete(null)
      fetchListings()
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }



  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const data = filteredListings.map(l => ({
      Title: l.title,
      Phase: l.phase?.name || '',
      Block: l.block?.name || '',
      Type: l.property_type,
      Price: l.price,
      Status: l.status,
      Views: l.views_count || 0,
      Date: new Date(l.created_at).toLocaleDateString()
    }))

    if (format === 'csv') {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `listings-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } 
    else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Listings')
      XLSX.writeFile(wb, `listings-${new Date().toISOString().split('T')[0]}.xlsx`)
    }
    else if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('NTR Listings Report', 14, 15)
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
      
      doc.save(`listings-${new Date().toISOString().split('T')[0]}.pdf`)
    }
    
    toast({ 
      title: '✅ Exported', 
      description: `Data exported as ${format.toUpperCase()}`,
      className: 'bg-emerald-50 border-emerald-200'
    })
    setExportDialog(false)
  }

  const handlePrint = () => {
    window.print()
    toast({ 
      title: '🖨️ Print', 
      description: 'Print dialog opened',
      className: 'bg-blue-50 border-blue-200'
    })
  }

  const handleShare = (platform: 'whatsapp' | 'email' | 'copy') => {
    const url = window.location.href
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank')
    } else if (platform === 'email') {
      window.location.href = `mailto:?subject=NTR Listings&body=${encodeURIComponent(url)}`
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      toast({ 
        title: '✅ Copied', 
        description: 'Link copied to clipboard',
        className: 'bg-emerald-50 border-emerald-200'
      })
    }
    setShareDialog(false)
  }



  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.phase?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.block?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const STATUS_COLORS = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    rejected: 'bg-red-100 text-red-700 border-red-200'
  }

  const stats = [
    { 
      label: 'Total Listings', 
      value: allListings.length,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
      trend: '+12%',
      change: 'up'
    },
    { 
      label: 'Pending Review', 
      value: allListings.filter(l => l.status === 'pending').length,
      icon: Clock,
      color: 'bg-amber-100 text-amber-600'
    },
    { 
      label: 'Approved', 
      value: allListings.filter(l => l.status === 'approved').length,
      icon: CheckCircle,
      color: 'bg-emerald-100 text-emerald-600',
      trend: '+8%',
      change: 'up'
    },
    { 
      label: 'Rejected', 
      value: allListings.filter(l => l.status === 'rejected').length,
      icon: XCircle,
      color: 'bg-red-100 text-red-600'
    },
    { 
      label: 'Featured', 
      value: allListings.filter(l => l.is_featured).length,
      icon: Star,
      color: 'bg-yellow-100 text-yellow-600'
    },
    { 
      label: 'Total Views', 
      value: allListings.reduce((acc, l) => acc + (l.views_count || 0), 0).toLocaleString(),
      icon: Eye,
      color: 'bg-purple-100 text-purple-600',
      trend: '+25%',
      change: 'up'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Listings Manager</h1>
                <p className="text-xs text-slate-500">Review & manage property listings</p>
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
        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button 
              onClick={fetchListings}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>

          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setExportDialog(true)}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShareDialog(true)}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const isClickable = [0, 1, 2, 3, 4, 5].includes(index)
            return (
              <div 
                key={index} 
                className={`bg-white rounded-xl p-4 border border-slate-200 hover:shadow-lg transition-all hover:border-emerald-200 group ${
                  isClickable ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (stat.label === 'Total Listings') setStatusFilter('')
                  else if (stat.label === 'Pending Review') setStatusFilter('pending')
                  else if (stat.label === 'Approved') setStatusFilter('approved')
                  else if (stat.label === 'Rejected') setStatusFilter('rejected')
                  else if (stat.label === 'Featured') {
                    setStatusFilter('')
                    // Fetch featured listings
                    fetchListings()
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {stat.trend && (
                    <Badge className={`${
                      stat.change === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    } border-0 text-xs`}>
                      {stat.trend}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Filters & Search */}
        <Card className="border-0 shadow-lg rounded-xl mb-8 bg-gradient-to-r from-emerald-50 to-blue-50">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by title, phase, block..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-0 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] bg-white border-0">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="views">Most Viewed</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center bg-white rounded-lg p-1 border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-emerald-600 text-white' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {searchQuery && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/30">
                <span className="text-xs text-slate-600">Active filters:</span>
                <Badge className="bg-white text-slate-700 border-0 px-2 py-1 text-xs">
                  Search: "{searchQuery}"
                  <button className="ml-1 hover:text-red-600" onClick={() => setSearchQuery('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
                <Button variant="link" size="sm" className="text-xs h-auto p-0 ml-auto" onClick={() => setSearchQuery('')}>
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>



        {/* Listings Grid/View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
              <div className="relative w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600 font-medium">Loading listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No listings found</h3>
              <p className="text-slate-500 mb-6">Try adjusting your filters or search query</p>
              <Button 
                onClick={() => {
                  setSearchQuery('')
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="group relative">
                <Card 
                  className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                  onClick={() => openListingModal(listing.id)}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300">
                    {listing.listing_images && listing.listing_images.length > 0 && listing.listing_images[0]?.image_url ? (
                      <Image 
                        src={listing.listing_images[0].image_url} 
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Home className="h-12 w-12 text-slate-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className={`${STATUS_COLORS[listing.status as keyof typeof STATUS_COLORS]} border shadow-lg`}>
                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Featured Badge */}
                    {listing.is_featured && (
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 shadow-lg">
                          <Star className="h-3 w-3 mr-1 fill-white" />
                          Featured
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {listing.title}
                      </h3>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{listing.phase?.name} • {listing.block?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        {listing.property_type === 'residential_plot' ? (
                          <Home className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Store className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                        <span className="capitalize">{listing.property_type.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-lg font-bold text-emerald-600">
                          PKR {listing.price.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Eye className="h-3 w-3" />
                          {listing.views_count || 0} views
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(listing.status === 'pending' || listing.status === 'approved') && (
                          <Link href={`/admin/listings/${listing.id}/edit`}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-600 hover:text-blue-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {listing.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApprove(listing.id)
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedListing(listing)
                                setRejectDialog(true)
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {listing.status === 'approved' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFeature(listing.id, listing.is_featured)
                            }}
                          >
                            <Star className={`h-4 w-4 ${listing.is_featured ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400'}`} />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            setListingToDelete(listing)
                            setDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-200">
              {filteredListings.map((listing) => (
                <div 
                  key={listing.id}
                  className="flex items-center p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => openListingModal(listing.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                      {listing.listing_images?.[0] ? (
                        <Image 
                          src={listing.listing_images[0].image_url} 
                          alt={listing.title}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <Home className="h-6 w-6 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{listing.title}</h3>
                        <Badge className={`${STATUS_COLORS[listing.status as keyof typeof STATUS_COLORS]} text-[10px] py-0`}>
                          {listing.status}
                        </Badge>
                        {listing.is_featured && (
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.phase?.name} • {listing.block?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {listing.views_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-emerald-600">PKR {listing.price.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{listing.profile?.full_name || 'User'}</p>
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      {listing.status === 'pending' && (
                        <>
                          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8">
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-slate-600">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredListings.length}</span> of <span className="font-medium">{listings.length}</span> listings
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-emerald-600 text-white border-emerald-600">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
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
                        <Image src={img.image_url} alt={`Property ${idx + 1}`} fill className="object-cover group-hover:scale-110 transition-transform" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <Home className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="text-sm font-semibold capitalize">{selectedListing.property_type.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <Maximize className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
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
                    PKR {selectedListing.price.toLocaleString()}
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
                        <Avatar className="h-12 w-12 bg-emerald-600">
                          <AvatarFallback className="bg-emerald-600 text-white">
                            {selectedListing.profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
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
              <div className="p-6 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`${STATUS_COLORS[selectedListing.status as keyof typeof STATUS_COLORS]} px-3 py-1`}>
                    Current Status: {selectedListing.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedListing(null)}>
                    Close
                  </Button>
                  {selectedListing.status === 'pending' && (
                    <>
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        onClick={() => handleApprove(selectedListing.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="gap-2"
                        onClick={() => setRejectDialog(true)}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Reject Listing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Please provide a reason for rejecting this listing. This will be shown to the user.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={!rejectionReason}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Listing
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 mb-1">Warning: This action cannot be undone</p>
                  <p className="text-sm text-red-600">You are about to permanently delete this listing.</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this listing? All associated data including images will be removed.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => listingToDelete && handleDelete(listingToDelete.id)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Download className="h-5 w-5" />
              Export Data
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              Choose a format to export {filteredListings.length} listing(s)
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

      {/* Share Dialog */}
      <Dialog open={shareDialog} onOpenChange={setShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Share2 className="h-5 w-5" />
              Share Listings
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              Share this page with others
            </p>
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 hover:bg-green-50 hover:border-green-200"
                onClick={() => handleShare('whatsapp')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">WhatsApp</p>
                    <p className="text-xs text-slate-500">Share via WhatsApp</p>
                  </div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => handleShare('email')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Email</p>
                    <p className="text-xs text-slate-500">Share via email</p>
                  </div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 hover:bg-slate-50 hover:border-slate-200"
                onClick={() => handleShare('copy')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Copy className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Copy Link</p>
                    <p className="text-xs text-slate-500">Copy URL to clipboard</p>
                  </div>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Sparkles, Plus, Edit, Trash2, Loader2, Shield, Zap, Building, 
  Home, Car, Wifi, Coffee, Dumbbell, Waves, TreePine, 
  Heart, Users, Clock, Sun, Moon, Wind, Droplets, Camera,
  CheckCircle, XCircle, Search, Filter, RefreshCw, Download,
  Grid3x3, List, MoreVertical, Copy, Eye, AlertCircle, Award,
  ChevronRight, Star, Bell, Settings, User, LogOut, FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ICON_OPTIONS = [
  { value: 'shield', label: 'Security', icon: Shield },
  { value: 'zap', label: 'Utilities', icon: Zap },
  { value: 'building', label: 'Building', icon: Building },
  { value: 'home', label: 'Home', icon: Home },
  { value: 'car', label: 'Parking', icon: Car },
  { value: 'wifi', label: 'WiFi', icon: Wifi },
  { value: 'coffee', label: 'Cafe', icon: Coffee },
  { value: 'dumbbell', label: 'Gym', icon: Dumbbell },
  { value: 'swimmer', label: 'Pool', icon: Waves },
  { value: 'tree-pine', label: 'Park', icon: TreePine },
  { value: 'heart', label: 'Healthcare', icon: Heart },
  { value: 'users', label: 'Community', icon: Users },
  { value: 'clock', label: '24/7', icon: Clock },
  { value: 'sun', label: 'Solar', icon: Sun },
  { value: 'wind', label: 'Ventilation', icon: Wind },
  { value: 'droplets', label: 'Water', icon: Droplets },
  { value: 'camera', label: 'CCTV', icon: Camera },
  { value: 'sparkles', label: 'Premium', icon: Sparkles },
  { value: 'award', label: 'Award', icon: Award },
  { value: 'star', label: 'Featured', icon: Star },
]

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General', icon: Sparkles, color: 'bg-slate-100 text-slate-700' },
  { value: 'security', label: 'Security', icon: Shield, color: 'bg-blue-100 text-blue-700' },
  { value: 'utilities', label: 'Utilities', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'facilities', label: 'Facilities', icon: Building, color: 'bg-purple-100 text-purple-700' },
  { value: 'outdoor', label: 'Outdoor', icon: TreePine, color: 'bg-green-100 text-green-700' },
  { value: 'lifestyle', label: 'Lifestyle', icon: Heart, color: 'bg-pink-100 text-pink-700' },
]

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState<any[]>([])
  const [filteredAmenities, setFilteredAmenities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editAmenity, setEditAmenity] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', category: 'general', icon: 'sparkles', description: '', is_active: true })
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [deleteDialog, setDeleteDialog] = useState(false)
  const [amenityToDelete, setAmenityToDelete] = useState<any>(null)
  const [exportDialog, setExportDialog] = useState(false)

  useEffect(() => {
    fetchAmenities()
  }, [])

  useEffect(() => {
    filterAmenities()
  }, [amenities, searchQuery, categoryFilter, statusFilter])

  const fetchAmenities = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('amenities')
      .select('*')
      .order('category')
      .order('display_order')

    if (data) {
      setAmenities(data)
    }
    setLoading(false)
  }

  const filterAmenities = () => {
    let filtered = [...amenities]

    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => 
        statusFilter === 'active' ? a.is_active : !a.is_active
      )
    }

    setFilteredAmenities(filtered)
  }

  const handleSave = async () => {
    const supabase = createClient()
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-')
    
    if (editAmenity) {
      const { error } = await supabase
        .from('amenities')
        .update({ ...form, slug, updated_at: new Date().toISOString() })
        .eq('id', editAmenity.id)

      if (!error) {
        toast.success('Amenity updated successfully')
      }
    } else {
      const { error } = await supabase
        .from('amenities')
        .insert([{ ...form, slug }])

      if (!error) {
        toast.success('Amenity added successfully')
      }
    }
    
    setDialog(false)
    setEditAmenity(null)
    setForm({ name: '', slug: '', category: 'general', icon: 'sparkles', description: '', is_active: true })
    fetchAmenities()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('amenities')
      .delete()
      .eq('id', id)

    if (!error) {
      toast.success('Amenity deleted successfully')
      fetchAmenities()
    }
    setDeleteDialog(false)
    setAmenityToDelete(null)
  }



  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const data = filteredAmenities.map(a => ({
      Name: a.name,
      Slug: a.slug,
      Category: a.category,
      Icon: a.icon,
      Status: a.is_active ? 'Active' : 'Inactive',
      Order: a.display_order || 0,
      Description: a.description || 'N/A'
    }))

    if (format === 'csv') {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `amenities-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } 
    else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Amenities')
      XLSX.writeFile(wb, `amenities-${new Date().toISOString().split('T')[0]}.xlsx`)
    }
    else if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('NTR Amenities Report', 14, 15)
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
      
      doc.save(`amenities-${new Date().toISOString().split('T')[0]}.pdf`)
    }
    
    toast.success(`Data exported as ${format.toUpperCase()}`)
    setExportDialog(false)
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('amenities')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) {
      console.error('Toggle error:', error)
      toast.error(`Failed to update status: ${error.message}`)
    } else {
      toast.success(currentStatus ? 'Amenity deactivated' : 'Amenity activated')
      fetchAmenities()
    }
  }



  const getCategoryIcon = (cat: string) => {
    const category = CATEGORY_OPTIONS.find(c => c.value === cat)
    return category?.icon || Sparkles
  }

  const getCategoryColor = (cat: string) => {
    const category = CATEGORY_OPTIONS.find(c => c.value === cat)
    return category?.color || 'bg-slate-100 text-slate-700'
  }

  const getIconComponent = (iconName: string) => {
    const icon = ICON_OPTIONS.find(i => i.value === iconName)
    return icon?.icon || Sparkles
  }

  const groupedAmenities = filteredAmenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) acc[amenity.category] = []
    acc[amenity.category].push(amenity)
    return acc
  }, {} as Record<string, any[]>)

  const stats = [
    { 
      label: 'Total Amenities', 
      value: amenities.length,
      icon: Sparkles,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      label: 'Active', 
      value: amenities.filter(a => a.is_active).length,
      icon: CheckCircle,
      color: 'bg-emerald-100 text-emerald-600'
    },
    { 
      label: 'Inactive', 
      value: amenities.filter(a => !a.is_active).length,
      icon: XCircle,
      color: 'bg-red-100 text-red-600'
    },
    { 
      label: 'Categories', 
      value: new Set(amenities.map(a => a.category)).size,
      icon: Grid3x3,
      color: 'bg-purple-100 text-purple-600'
    },
    { 
      label: 'Security', 
      value: amenities.filter(a => a.category === 'security').length,
      icon: Shield,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      label: 'Facilities', 
      value: amenities.filter(a => a.category === 'facilities').length,
      icon: Building,
      color: 'bg-amber-100 text-amber-600'
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
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Amenities & Features</h1>
                <p className="text-xs text-slate-500">Manage property amenities and features</p>
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
              onClick={fetchAmenities}
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
            <Button 
              onClick={() => { 
                setEditAmenity(null); 
                setForm({ name: '', slug: '', category: 'general', icon: 'sparkles', description: '', is_active: true }); 
                setDialog(true); 
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Amenity
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div 
                key={index} 
                className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-lg transition-all hover:border-emerald-200 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
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
                  placeholder="Search amenities by name, slug, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-0 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px] bg-white border-0">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORY_OPTIONS.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-white border-0">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
            {(categoryFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/30">
                <span className="text-xs text-slate-600">Active filters:</span>
                {categoryFilter !== 'all' && (
                  <Badge className="bg-white text-slate-700 border-0 px-2 py-1 text-xs">
                    Category: {CATEGORY_OPTIONS.find(c => c.value === categoryFilter)?.label}
                    <button className="ml-1 hover:text-red-600" onClick={() => setCategoryFilter('all')}>
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge className="bg-white text-slate-700 border-0 px-2 py-1 text-xs">
                    Status: {statusFilter}
                    <button className="ml-1 hover:text-red-600" onClick={() => setStatusFilter('all')}>
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge className="bg-white text-slate-700 border-0 px-2 py-1 text-xs">
                    Search: "{searchQuery}"
                    <button className="ml-1 hover:text-red-600" onClick={() => setSearchQuery('')}>
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="link" size="sm" className="text-xs h-auto p-0 ml-auto">
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>



        {/* Amenities Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
              <div className="relative w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600 font-medium">Loading amenities...</p>
          </div>
        ) : filteredAmenities.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No amenities found</h3>
              <p className="text-slate-500 mb-6">Try adjusting your filters or add a new amenity</p>
              <Button 
                onClick={() => {
                  setCategoryFilter('all')
                  setStatusFilter('all')
                  setSearchQuery('')
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="space-y-8">
            {Object.entries(groupedAmenities).map(([category, items]) => {
              const CategoryIcon = getCategoryIcon(category)
              const categoryColor = getCategoryColor(category)
              
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${categoryColor} flex items-center justify-center`}>
                      <CategoryIcon className="h-4 w-4" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 capitalize">{category}</h2>
                    <Badge variant="outline" className="ml-2">{items.length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((amenity) => {
                      const IconComponent = getIconComponent(amenity.icon)
                      
                      return (
                        <div key={amenity.id} className="group relative">
                          <Card className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-xl ${getCategoryColor(amenity.category)} flex items-center justify-center`}>
                                    <IconComponent className="h-6 w-6" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-slate-900">{amenity.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Slug: {amenity.slug}</p>
                                  </div>
                                </div>
                                <Badge className={amenity.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                                  {amenity.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>

                              {amenity.description && (
                                <p className="text-sm text-slate-600 mb-4">{amenity.description}</p>
                              )}

                              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    Order: {amenity.display_order || 0}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Switch 
                                    checked={amenity.is_active} 
                                    onCheckedChange={() => toggleActive(amenity.id, amenity.is_active)}
                                    className="mr-2"
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8"
                                    onClick={() => { 
                                      setEditAmenity(amenity); 
                                      setForm({ 
                                        name: amenity.name, 
                                        slug: amenity.slug, 
                                        category: amenity.category, 
                                        icon: amenity.icon,
                                        description: amenity.description || '',
                                        is_active: amenity.is_active
                                      }); 
                                      setDialog(true); 
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                    onClick={() => {
                                      setAmenityToDelete(amenity)
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
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* List View */
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Icon</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAmenities.map((amenity) => {
                    const IconComponent = getIconComponent(amenity.icon)
                    
                    return (
                      <tr key={amenity.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className={`w-8 h-8 rounded-lg ${getCategoryColor(amenity.category)} flex items-center justify-center`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{amenity.name}</p>
                            {amenity.description && (
                              <p className="text-xs text-slate-500 line-clamp-1">{amenity.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{amenity.slug}</td>
                        <td className="px-4 py-3">
                          <Badge className={getCategoryColor(amenity.category)}>
                            {amenity.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={amenity.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                            {amenity.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{amenity.display_order || 0}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Switch 
                              checked={amenity.is_active} 
                              onCheckedChange={() => toggleActive(amenity.id, amenity.is_active)}
                              className="mr-2"
                            />
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => { 
                                setEditAmenity(amenity); 
                                setForm({ 
                                  name: amenity.name, 
                                  slug: amenity.slug, 
                                  category: amenity.category, 
                                  icon: amenity.icon,
                                  description: amenity.description || '',
                                  is_active: amenity.is_active
                                }); 
                                setDialog(true); 
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => {
                                setAmenityToDelete(amenity)
                                setDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-slate-600">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredAmenities.length}</span> of <span className="font-medium">{amenities.length}</span> amenities
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

      {/* Add/Edit Amenity Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              {editAmenity ? 'Edit Amenity' : 'Add New Amenity'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="e.g. 24/7 Security"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({...form, slug: e.target.value})}
                placeholder="e.g. 24-7-security"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty to auto-generate from name</p>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Brief description of this amenity"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Icon</Label>
                <Select value={form.icon} onValueChange={(v) => setForm({...form, icon: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(icon => {
                      const Icon = icon.icon
                      return (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                checked={form.is_active} 
                onCheckedChange={(checked) => setForm({...form, is_active: checked})}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name} className="bg-emerald-600 hover:bg-emerald-700">
              {editAmenity ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Amenity
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to delete this amenity? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => amenityToDelete && handleDelete(amenityToDelete.id)}
            >
              Delete
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
              Choose a format to export {filteredAmenities.length} amenity(ies)
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



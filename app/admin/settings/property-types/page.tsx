'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Building2, Plus, Edit, Trash2, Loader2, GripVertical, Search, Filter,
  Home, Store, Briefcase, Factory, TreePine, Warehouse, Landmark,
  Eye, EyeOff, Download, Grid3x3, List, Copy, AlertCircle, CheckCircle,
  XCircle, Bell, Settings, User, ChevronRight, Star, Award, Target,
  RefreshCw, MoreVertical, Image as ImageIcon, Layers, MapPin, FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ICON_OPTIONS = [
  { value: 'building', label: 'Building', icon: Building2 },
  { value: 'home', label: 'Home', icon: Home },
  { value: 'store', label: 'Store', icon: Store },
  { value: 'briefcase', label: 'Office', icon: Briefcase },
  { value: 'factory', label: 'Industrial', icon: Factory },
  { value: 'tree-pine', label: 'Farm House', icon: TreePine },
  { value: 'warehouse', label: 'Warehouse', icon: Warehouse },
  { value: 'landmark', label: 'Landmark', icon: Landmark },
  { value: 'layers', label: 'Multi-story', icon: Layers },
  { value: 'map-pin', label: 'Plot', icon: MapPin },
]

export default function PropertyTypesPage() {
  const [types, setTypes] = useState<any[]>([])
  const [filteredTypes, setFilteredTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editType, setEditType] = useState<any>(null)
  const [form, setForm] = useState({ 
    name: '', 
    slug: '', 
    icon: 'building', 
    description: '',
    category: 'residential',
    meta_title: '',
    meta_description: '',
    image_url: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [deleteDialog, setDeleteDialog] = useState(false)
  const [typeToDelete, setTypeToDelete] = useState<any>(null)
  const [exportDialog, setExportDialog] = useState(false)
  const [viewDialog, setViewDialog] = useState(false)
  const [viewType, setViewType] = useState<any>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    residential: 0,
    commercial: 0,
    other: 0
  })

  useEffect(() => {
    fetchTypes()
  }, [])

  useEffect(() => {
    filterTypes()
  }, [types, searchQuery, statusFilter, categoryFilter])

  const fetchTypes = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('property_types')
      .select('*')
      .order('display_order')

    if (data) {
      setTypes(data)
      
      // Calculate stats
      setStats({
        total: data.length,
        active: data.filter(t => t.is_active).length,
        inactive: data.filter(t => !t.is_active).length,
        residential: data.filter(t => t.category === 'residential').length,
        commercial: data.filter(t => t.category === 'commercial').length,
        other: data.filter(t => !['residential', 'commercial'].includes(t.category || '')).length
      })
    }
    setLoading(false)
  }

  const filterTypes = () => {
    let filtered = [...types]

    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => 
        statusFilter === 'active' ? t.is_active : !t.is_active
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter)
    }

    setFilteredTypes(filtered)
  }

  const handleSave = async () => {
    const supabase = createClient()
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-')
    
    if (editType) {
      const { error } = await supabase
        .from('property_types')
        .update({ 
          ...form, 
          slug, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', editType.id)

      if (!error) {
        toast.success('Property type updated successfully')
      }
    } else {
      const { error } = await supabase
        .from('property_types')
        .insert([{ 
          ...form, 
          slug, 
          display_order: types.length + 1,
          created_at: new Date().toISOString()
        }])

      if (!error) {
        toast.success('Property type added successfully')
      }
    }
    
    setDialog(false)
    setEditType(null)
    setForm({ 
      name: '', 
      slug: '', 
      icon: 'building', 
      description: '',
      category: 'residential',
      meta_title: '',
      meta_description: '',
      image_url: ''
    })
    fetchTypes()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('property_types')
      .delete()
      .eq('id', id)

    if (!error) {
      toast.success('Property type deleted successfully')
      fetchTypes()
    }
    setDeleteDialog(false)
    setTypeToDelete(null)
  }



  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const data = filteredTypes.map(t => ({
      Name: t.name,
      Slug: t.slug,
      Category: t.category || 'N/A',
      Icon: t.icon,
      Status: t.is_active ? 'Active' : 'Inactive',
      Description: t.description || 'N/A'
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
      a.download = `property-types-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } 
    else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Property Types')
      XLSX.writeFile(wb, `property-types-${new Date().toISOString().split('T')[0]}.xlsx`)
    }
    else if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('NTR Property Types Report', 14, 15)
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
      
      doc.save(`property-types-${new Date().toISOString().split('T')[0]}.pdf`)
    }
    
    toast.success(`Data exported as ${format.toUpperCase()}`)
    setExportDialog(false)
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('property_types')
      .update({ 
        is_active: !currentStatus
      })
      .eq('id', id)

    if (error) {
      console.error('Toggle error:', error)
      toast.error(`Failed to update status: ${error.message}`)
    } else {
      toast.success(currentStatus ? 'Property type deactivated' : 'Property type activated')
      fetchTypes()
    }
  }

  const handleDuplicate = async (type: any) => {
    const supabase = createClient()
    const { name, icon, description, category } = type
    const { error } = await supabase
      .from('property_types')
      .insert([{ 
        name: `${name} (Copy)`, 
        slug: `${type.slug}-copy`,
        icon, 
        description, 
        category,
        display_order: types.length + 1,
        is_active: false 
      }])

    if (!error) {
      toast.success('Property type duplicated')
      fetchTypes()
    }
  }



  const getIconComponent = (iconName: string) => {
    const icon = ICON_OPTIONS.find(i => i.value === iconName)
    return icon?.icon || Building2
  }

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'residential':
        return 'bg-emerald-100 text-emerald-700'
      case 'commercial':
        return 'bg-blue-100 text-blue-700'
      case 'industrial':
        return 'bg-amber-100 text-amber-700'
      case 'agricultural':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const statsCards = [
    { 
      label: 'Total Types', 
      value: stats.total,
      icon: Building2,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      label: 'Active', 
      value: stats.active,
      icon: Eye,
      color: 'bg-emerald-100 text-emerald-600'
    },
    { 
      label: 'Inactive', 
      value: stats.inactive,
      icon: EyeOff,
      color: 'bg-red-100 text-red-600'
    },
    { 
      label: 'Residential', 
      value: stats.residential,
      icon: Home,
      color: 'bg-emerald-100 text-emerald-600'
    },
    { 
      label: 'Commercial', 
      value: stats.commercial,
      icon: Store,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      label: 'Other', 
      value: stats.other,
      icon: Briefcase,
      color: 'bg-purple-100 text-purple-600'
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
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Property Types</h1>
                <p className="text-xs text-slate-500">Manage property categories and types</p>
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
              onClick={fetchTypes}
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
                setEditType(null); 
                setForm({ 
                  name: '', 
                  slug: '', 
                  icon: 'building', 
                  description: '',
                  category: 'residential',
                  meta_title: '',
                  meta_description: '',
                  image_url: ''
                }); 
                setDialog(true); 
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Type
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statsCards.map((stat, index) => {
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
                  placeholder="Search property types..."
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
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-white border-0">
                    <Eye className="h-4 w-4 mr-2" />
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
                    Category: {categoryFilter}
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



        {/* Property Types Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
              <div className="relative w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600 font-medium">Loading property types...</p>
          </div>
        ) : filteredTypes.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No property types found</h3>
              <p className="text-slate-500 mb-6">Try adjusting your filters or add a new type</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTypes.map((type) => {
              const IconComponent = getIconComponent(type.icon)
              
              return (
                <div key={type.id} className="group relative">
                  <Card className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-14 h-14 rounded-xl ${getCategoryColor(type.category || 'other')} flex items-center justify-center`}>
                            <IconComponent className="h-7 w-7" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900">{type.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">Slug: {type.slug}</p>
                          </div>
                        </div>
                        <Badge className={type.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                          {type.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Category Badge */}
                      <div className="mb-3">
                        <Badge className={`${getCategoryColor(type.category || 'other')} border-0`}>
                          {type.category || 'other'}
                        </Badge>
                      </div>

                      {/* Description */}
                      {type.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {type.description}
                        </p>
                      )}

                      {/* Meta Info */}
                      {(type.meta_title || type.meta_description) && (
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                          {type.meta_title && (
                            <p className="text-xs font-medium text-slate-700">SEO: {type.meta_title}</p>
                          )}
                          {type.meta_description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{type.meta_description}</p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={type.is_active} 
                            onCheckedChange={() => toggleActive(type.id, type.is_active)}
                            className="scale-75"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => {
                              setViewType(type)
                              setViewDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => { 
                              setEditType(type); 
                              setForm({ 
                                name: type.name, 
                                slug: type.slug || '', 
                                icon: type.icon || 'building', 
                                description: type.description || '',
                                category: type.category || 'residential',
                                meta_title: type.meta_title || '',
                                meta_description: type.meta_description || '',
                                image_url: type.image_url || ''
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
                              setTypeToDelete(type)
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
        ) : (
          /* List View */
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Drag</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Icon</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTypes.map((type) => {
                    const IconComponent = getIconComponent(type.icon)
                    
                    return (
                      <tr key={type.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <GripVertical className="h-4 w-4 text-slate-400 cursor-move" />
                        </td>
                        <td className="px-4 py-3">
                          <div className={`w-8 h-8 rounded-lg ${getCategoryColor(type.category || 'other')} flex items-center justify-center`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{type.name}</p>
                            {type.description && (
                              <p className="text-xs text-slate-500 line-clamp-1">{type.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{type.slug}</td>
                        <td className="px-4 py-3">
                          <Badge className={getCategoryColor(type.category || 'other')}>
                            {type.category || 'other'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={type.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                            {type.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Switch 
                              checked={type.is_active} 
                              onCheckedChange={() => toggleActive(type.id, type.is_active)}
                              className="scale-75 mr-2"
                            />
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => {
                                setViewType(type)
                                setViewDialog(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => { 
                                setEditType(type); 
                                setForm({ 
                                  name: type.name, 
                                  slug: type.slug || '', 
                                  icon: type.icon || 'building', 
                                  description: type.description || '',
                                  category: type.category || 'residential',
                                  meta_title: type.meta_title || '',
                                  meta_description: type.meta_description || '',
                                  image_url: type.image_url || ''
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
                                setTypeToDelete(type)
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
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredTypes.length}</span> of <span className="font-medium">{types.length}</span> types
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

      {/* Add/Edit Property Type Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              {editType ? 'Edit Property Type' : 'Add New Property Type'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Residential Plot"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm({...form, slug: e.target.value})}
                  placeholder="residential-plot"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">Leave empty to auto-generate</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                    <SelectItem value="mixed">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="icon">Icon</Label>
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

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Detailed description of this property type..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="meta_title">SEO Title (Optional)</Label>
              <Input
                id="meta_title"
                value={form.meta_title}
                onChange={(e) => setForm({...form, meta_title: e.target.value})}
                placeholder="e.g. Residential Plots for Sale in NTR"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="meta_description">SEO Description (Optional)</Label>
              <Textarea
                id="meta_description"
                rows={2}
                value={form.meta_description}
                onChange={(e) => setForm({...form, meta_description: e.target.value})}
                placeholder="Brief description for search engines..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="image_url">Image URL (Optional)</Label>
              <Input
                id="image_url"
                value={form.image_url}
                onChange={(e) => setForm({...form, image_url: e.target.value})}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
              {form.image_url && (
                <div className="mt-2 relative h-24 rounded-lg overflow-hidden">
                  <img 
                    src={form.image_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name} className="bg-emerald-600 hover:bg-emerald-700">
              {editType ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Type Details Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewType && (() => {
                const Icon = getIconComponent(viewType.icon)
                return <Icon className="h-5 w-5 text-emerald-600" />
              })()}
              {viewType?.name}
            </DialogTitle>
          </DialogHeader>
          {viewType && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Slug</Label>
                  <p className="text-sm font-medium text-slate-900">{viewType.slug}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Category</Label>
                  <Badge className={getCategoryColor(viewType.category || 'other')}>
                    {viewType.category || 'other'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-500">Status</Label>
                <div className="mt-1">
                  <Badge className={viewType.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                    {viewType.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {viewType.description && (
                <div>
                  <Label className="text-xs text-slate-500">Description</Label>
                  <p className="text-sm text-slate-600 mt-1">{viewType.description}</p>
                </div>
              )}

              {viewType.meta_title && (
                <div>
                  <Label className="text-xs text-slate-500">SEO Title</Label>
                  <p className="text-sm text-slate-600 mt-1">{viewType.meta_title}</p>
                </div>
              )}

              {viewType.meta_description && (
                <div>
                  <Label className="text-xs text-slate-500">SEO Description</Label>
                  <p className="text-sm text-slate-600 mt-1">{viewType.meta_description}</p>
                </div>
              )}

              {viewType.image_url && (
                <div>
                  <Label className="text-xs text-slate-500">Image</Label>
                  <div className="mt-2 relative h-48 rounded-lg overflow-hidden">
                    <img 
                      src={viewType.image_url} 
                      alt={viewType.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-xs text-slate-500">Created</Label>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(viewType.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Last Updated</Label>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(viewType.updated_at || viewType.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(false)}>Close</Button>
            <Button 
              onClick={() => {
                setEditType(viewType)
                setForm({
                  name: viewType.name,
                  slug: viewType.slug || '',
                  icon: viewType.icon || 'building',
                  description: viewType.description || '',
                  category: viewType.category || 'residential',
                  meta_title: viewType.meta_title || '',
                  meta_description: viewType.meta_description || '',
                  image_url: viewType.image_url || ''
                })
                setViewDialog(false)
                setDialog(true)
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
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
              Delete Property Type
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to delete this property type? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => typeToDelete && handleDelete(typeToDelete.id)}
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
              Choose a format to export {filteredTypes.length} property type(s)
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



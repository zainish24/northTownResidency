'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MapPin, Plus, Edit, Trash2, Loader2, Search, Filter, RefreshCw,
  Home, Building2, Layers, Eye, EyeOff, Download, Grid3x3, List,
  MoreVertical, Copy, AlertCircle, CheckCircle, XCircle, Bell,
  Settings, User, ChevronRight, Star, Award, Target, TrendingUp,
  Clock, Globe, Shield, Zap, Sparkles, Compass, Navigation,
  Ruler, Calendar, Users, FileText, Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function PhasesPage() {
  const [phases, setPhases] = useState<any[]>([])
  const [filteredPhases, setFilteredPhases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editPhase, setEditPhase] = useState<any>(null)
  const [form, setForm] = useState({ 
    name: '', 
    location: '', 
    description: '',
    total_area: '',
    total_plots: '',
    available_plots: '',
    features: '',
    image_url: '',
    completion_date: '',
    developer: 'North Town Residency'
  })
  const [blocks, setBlocks] = useState<string[]>([])
  const [newBlock, setNewBlock] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [phaseToDelete, setPhaseToDelete] = useState<any>(null)
  const [exportDialog, setExportDialog] = useState(false)
  const [viewDialog, setViewDialog] = useState(false)
  const [viewPhase, setViewPhase] = useState<any>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalBlocks: 0,
    totalListings: 0,
    totalArea: 0
  })

  useEffect(() => {
    fetchPhases()
  }, [])

  useEffect(() => {
    filterPhases()
  }, [phases, searchQuery, statusFilter])

  const fetchPhases = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Fetch phases with related data
    const { data, error } = await supabase
      .from('phases')
      .select(`
        *,
        blocks:blocks(count),
        listings:listings(count)
      `)
      .order('name')

    if (data) {
      setPhases(data)
      
      // Calculate stats
      const totalBlocks = data.reduce((acc, phase) => acc + (phase.blocks?.[0]?.count || 0), 0)
      const totalListings = data.reduce((acc, phase) => acc + (phase.listings?.[0]?.count || 0), 0)
      
      setStats({
        total: data.length,
        active: data.filter(p => p.is_active).length,
        inactive: data.filter(p => !p.is_active).length,
        totalBlocks,
        totalListings,
        totalArea: data.reduce((acc, phase) => acc + (parseInt(phase.total_area) || 0), 0)
      })
    }
    setLoading(false)
  }

  const filterPhases = () => {
    let filtered = [...phases]

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.developer?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => 
        statusFilter === 'active' ? p.is_active : !p.is_active
      )
    }

    setFilteredPhases(filtered)
  }

  const handleSave = async () => {
    const supabase = createClient()
    
    if (editPhase) {
      const updateData = {
        name: form.name,
        location: form.location || null,
        description: form.description || null,
        image_url: form.image_url || null,
        is_active: editPhase.is_active
      }

      const { error } = await supabase
        .from('phases')
        .update(updateData)
        .eq('id', editPhase.id)

      if (error) {
        console.error('Update error:', error)
        toast.error(`Failed to update: ${error.message}`)
        return
      }
      toast.success('Phase updated successfully')
    } else {
      const insertData = {
        name: form.name,
        location: form.location || null,
        description: form.description || null,
        image_url: form.image_url || null,
        display_order: phases.length + 1,
        is_active: true
      }

      const { data: phaseData, error: phaseError } = await supabase
        .from('phases')
        .insert([insertData])
        .select()
        .single()

      if (!phaseError && phaseData) {
        // Add blocks if any
        if (blocks.length > 0) {
          const blocksData = blocks.map((blockName, index) => ({
            name: blockName,
            phase_id: phaseData.id,
            display_order: index + 1,
            is_active: true
          }))
          
          await supabase.from('blocks').insert(blocksData)
        }
        
        toast.success('Phase and blocks added successfully')
      }
    }
    
    setDialog(false)
    setBlocks([])
    setNewBlock('')
    fetchPhases()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('phases')
      .delete()
      .eq('id', id)

    if (!error) {
      toast.success('Phase deleted successfully')
      fetchPhases()
    }
    setDeleteDialog(false)
    setPhaseToDelete(null)
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return
    
    const supabase = createClient()
    const { error } = await supabase
      .from('phases')
      .delete()
      .in('id', selectedItems)

    if (!error) {
      toast.success(`${selectedItems.length} phases deleted`)
      setSelectedItems([])
      fetchPhases()
    }
  }

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const data = filteredPhases.map(p => ({
      Name: p.name,
      Location: p.location || 'N/A',
      Developer: p.developer || 'N/A',
      Status: p.is_active ? 'Active' : 'Inactive',
      'Total Area': p.total_area ? `${p.total_area} acres` : 'N/A',
      'Total Plots': p.total_plots || 'N/A',
      'Available Plots': p.available_plots || 'N/A',
      Blocks: p.blocks?.[0]?.count || 0,
      Listings: p.listings?.[0]?.count || 0
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
      a.download = `phases-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } 
    else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Phases')
      XLSX.writeFile(wb, `phases-${new Date().toISOString().split('T')[0]}.xlsx`)
    }
    else if (format === 'pdf') {
      const doc = new jsPDF('landscape')
      doc.setFontSize(16)
      doc.text('NTR Phases Report', 14, 15)
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
      
      doc.save(`phases-${new Date().toISOString().split('T')[0]}.pdf`)
    }
    
    toast.success(`Data exported as ${format.toUpperCase()}`)
    setExportDialog(false)
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('phases')
      .update({ 
        is_active: !currentStatus
      })
      .eq('id', id)

    if (error) {
      console.error('Toggle error:', error)
      toast.error(`Failed to update status: ${error.message}`)
    } else {
      toast.success(currentStatus ? 'Phase deactivated' : 'Phase activated')
      fetchPhases()
    }
  }

  const handleDuplicate = async (phase: any) => {
    const supabase = createClient()
    const { name, location, description, total_area, developer } = phase
    const { error } = await supabase
      .from('phases')
      .insert([{ 
        name: `${name} (Copy)`, 
        location, 
        description, 
        total_area,
        developer,
        display_order: phases.length + 1,
        is_active: false 
      }])

    if (!error) {
      toast.success('Phase duplicated')
      fetchPhases()
    }
  }

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredPhases.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredPhases.map(p => p.id))
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const statsCards = [
    { 
      label: 'Total Phases', 
      value: stats.total,
      icon: Layers,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      label: 'Active Phases', 
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
      label: 'Total Blocks', 
      value: stats.totalBlocks,
      icon: Grid3x3,
      color: 'bg-purple-100 text-purple-600'
    },
    { 
      label: 'Total Listings', 
      value: stats.totalListings,
      icon: FileText,
      color: 'bg-amber-100 text-amber-600'
    },
    { 
      label: 'Total Area', 
      value: stats.totalArea > 0 ? `${stats.totalArea} acres` : '-',
      icon: Ruler,
      color: 'bg-pink-100 text-pink-600'
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
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Phase Management</h1>
                <p className="text-xs text-slate-500">Manage NTR development phases</p>
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
              onClick={fetchPhases}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {selectedItems.length > 0 && (
              <Button 
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete {selectedItems.length} Selected
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setExportDialog(true)}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              onClick={() => { 
                setEditPhase(null); 
                setForm({ 
                  name: '', 
                  location: '', 
                  description: '',
                  total_area: '',
                  total_plots: '',
                  available_plots: '',
                  features: '',
                  image_url: '',
                  completion_date: '',
                  developer: 'North Town Residency'
                }); 
                setDialog(true); 
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Phase
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
                  placeholder="Search phases by name, location, developer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-0 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
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
            {(statusFilter !== 'all' || searchQuery) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/30">
                <span className="text-xs text-slate-600">Active filters:</span>
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

        {/* Phases Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
              <div className="relative w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600 font-medium">Loading phases...</p>
          </div>
        ) : filteredPhases.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No phases found</h3>
              <p className="text-slate-500 mb-6">Try adjusting your filters or add a new phase</p>
              <Button 
                onClick={() => {
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
            {filteredPhases.map((phase) => (
              <div key={phase.id} className="group relative">

                <Card className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Phase Image */}
                  <div className="relative h-48 bg-gradient-to-br from-emerald-600 to-blue-600">
                    {phase.image_url ? (
                      <Image 
                        src={phase.image_url} 
                        alt={phase.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="h-16 w-16 text-white/30" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className={getStatusColor(phase.is_active)}>
                        {phase.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Phase Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                      <h3 className="text-xl font-bold text-white">{phase.name}</h3>
                      {phase.location && (
                        <p className="text-sm text-white/80 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {phase.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-5">
                    {/* Description */}
                    {phase.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {phase.description}
                      </p>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <p className="text-sm font-semibold text-slate-900">
                          {phase.blocks?.[0]?.count || 0}
                        </p>
                        <p className="text-xs text-slate-500">Blocks</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <p className="text-sm font-semibold text-slate-900">
                          {phase.listings?.[0]?.count || 0}
                        </p>
                        <p className="text-xs text-slate-500">Listings</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <p className="text-sm font-semibold text-slate-900">
                          {phase.total_plots || '-'}
                        </p>
                        <p className="text-xs text-slate-500">Plots</p>
                      </div>
                    </div>

                    {/* Features */}
                    {phase.features && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {phase.features.split(',').map((feature: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Developer & Completion */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {phase.developer || 'NTR'}
                      </span>
                      {phase.completion_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(phase.completion_date)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={phase.is_active} 
                          onCheckedChange={() => toggleActive(phase.id, phase.is_active)}
                          className="scale-75"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={() => {
                            setViewPhase(phase)
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
                            setEditPhase(phase); 
                            setForm({ 
                              name: phase.name, 
                              location: phase.location || '', 
                              description: phase.description || '',
                              total_area: phase.total_area || '',
                              total_plots: phase.total_plots || '',
                              available_plots: phase.available_plots || '',
                              features: phase.features || '',
                              image_url: phase.image_url || '',
                              completion_date: phase.completion_date || '',
                              developer: phase.developer || 'North Town Residency'
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
                            setPhaseToDelete(phase)
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phase</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Blocks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Listings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Developer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPhases.map((phase) => (
                    <tr key={phase.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{phase.name}</p>
                          {phase.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">{phase.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="h-3 w-3" />
                          {phase.location || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(phase.is_active)}>
                          {phase.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{phase.blocks?.[0]?.count || 0}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{phase.listings?.[0]?.count || 0}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{phase.developer || 'NTR'}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Switch 
                            checked={phase.is_active} 
                            onCheckedChange={() => toggleActive(phase.id, phase.is_active)}
                            className="scale-75 mr-2"
                          />
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => {
                              setViewPhase(phase)
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
                              setEditPhase(phase); 
                              setForm({ 
                                name: phase.name, 
                                location: phase.location || '', 
                                description: phase.description || '',
                                total_area: phase.total_area || '',
                                total_plots: phase.total_plots || '',
                                available_plots: phase.available_plots || '',
                                features: phase.features || '',
                                image_url: phase.image_url || '',
                                completion_date: phase.completion_date || '',
                                developer: phase.developer || 'North Town Residency'
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
                              setPhaseToDelete(phase)
                              setDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-slate-600">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredPhases.length}</span> of <span className="font-medium">{phases.length}</span> phases
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

      {/* Add/Edit Phase Dialog */}
      <Dialog open={dialog} onOpenChange={(open) => {
        setDialog(open)
        if (!open) {
          setEditPhase(null)
          setBlocks([])
          setNewBlock('')
          setForm({ 
            name: '', 
            location: '', 
            description: '',
            total_area: '',
            total_plots: '',
            available_plots: '',
            features: '',
            image_url: '',
            completion_date: '',
            developer: 'North Town Residency'
          })
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              {editPhase ? 'Edit Phase' : 'Add New Phase'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Phase Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Phase 1"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="developer">Developer</Label>
                <Input
                  id="developer"
                  value={form.developer}
                  onChange={(e) => setForm({...form, developer: e.target.value})}
                  placeholder="e.g. North Town Residency"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({...form, location: e.target.value})}
                placeholder="e.g. Near 4K Chowrangi, Karachi"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Detailed description of the phase..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="total_area">Total Area (acres)</Label>
                <Input
                  id="total_area"
                  type="number"
                  value={form.total_area}
                  onChange={(e) => setForm({...form, total_area: e.target.value})}
                  placeholder="e.g. 100"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="total_plots">Total Plots</Label>
                <Input
                  id="total_plots"
                  type="number"
                  value={form.total_plots}
                  onChange={(e) => setForm({...form, total_plots: e.target.value})}
                  placeholder="e.g. 500"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="available_plots">Available Plots</Label>
                <Input
                  id="available_plots"
                  type="number"
                  value={form.available_plots}
                  onChange={(e) => setForm({...form, available_plots: e.target.value})}
                  placeholder="e.g. 150"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="features">Features (comma separated)</Label>
              <Input
                id="features"
                value={form.features}
                onChange={(e) => setForm({...form, features: e.target.value})}
                placeholder="e.g. Parks, Schools, Hospitals, Commercial Area"
                className="mt-1"
              />
            </div>

            {!editPhase && (
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Grid3x3 className="h-4 w-4 text-emerald-600" />
                  Add Blocks
                </Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newBlock}
                      onChange={(e) => setNewBlock(e.target.value)}
                      placeholder="e.g. Block A, Block B, Block C"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newBlock.trim()) {
                          e.preventDefault()
                          setBlocks([...blocks, newBlock.trim()])
                          setNewBlock('')
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (newBlock.trim()) {
                          setBlocks([...blocks, newBlock.trim()])
                          setNewBlock('')
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {blocks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {blocks.map((block, index) => (
                        <Badge key={index} className="bg-emerald-100 text-emerald-700 px-3 py-1">
                          {block}
                          <button
                            onClick={() => setBlocks(blocks.filter((_, i) => i !== index))}
                            className="ml-2 hover:text-red-600"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500">Press Enter or click + to add blocks</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image_url">Image URL</Label>
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

              <div>
                <Label htmlFor="completion_date">Completion Date</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={form.completion_date}
                  onChange={(e) => setForm({...form, completion_date: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name} className="bg-emerald-600 hover:bg-emerald-700">
              {editPhase ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Phase Details Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              {viewPhase?.name}
            </DialogTitle>
          </DialogHeader>
          {viewPhase && (
            <div className="space-y-4 py-4">
              {viewPhase.image_url && (
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <img 
                    src={viewPhase.image_url} 
                    alt={viewPhase.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Location</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPhase.location || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Developer</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPhase.developer || 'NTR'}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-500">Status</Label>
                <div className="mt-1">
                  <Badge className={getStatusColor(viewPhase.is_active)}>
                    {viewPhase.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {viewPhase.description && (
                <div>
                  <Label className="text-xs text-slate-500">Description</Label>
                  <p className="text-sm text-slate-600 mt-1">{viewPhase.description}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Total Area</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPhase.total_area ? `${viewPhase.total_area} acres` : '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Total Plots</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPhase.total_plots || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Available Plots</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPhase.available_plots || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Blocks</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPhase.blocks?.[0]?.count || 0}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Listings</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPhase.listings?.[0]?.count || 0}</p>
                </div>
              </div>

              {viewPhase.features && (
                <div>
                  <Label className="text-xs text-slate-500">Features</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewPhase.features.split(',').map((feature: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewPhase.completion_date && (
                <div>
                  <Label className="text-xs text-slate-500">Completion Date</Label>
                  <p className="text-sm font-medium text-slate-900">{formatDate(viewPhase.completion_date)}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-xs text-slate-500">Created</Label>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(viewPhase.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Last Updated</Label>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(viewPhase.updated_at || viewPhase.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(false)}>Close</Button>
            <Button 
              onClick={() => {
                setEditPhase(viewPhase)
                setForm({
                  name: viewPhase.name,
                  location: viewPhase.location || '',
                  description: viewPhase.description || '',
                  total_area: viewPhase.total_area || '',
                  total_plots: viewPhase.total_plots || '',
                  available_plots: viewPhase.available_plots || '',
                  features: viewPhase.features || '',
                  image_url: viewPhase.image_url || '',
                  completion_date: viewPhase.completion_date || '',
                  developer: viewPhase.developer || 'North Town Residency'
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
              Delete Phase
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to delete this phase? All associated blocks and data will also be deleted. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => phaseToDelete && handleDelete(phaseToDelete.id)}
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
              Choose a format to export {filteredPhases.length} phase(s)
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


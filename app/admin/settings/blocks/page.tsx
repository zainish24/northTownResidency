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
  Grid3x3, Plus, Edit, Trash2, Loader2, Search, Filter, RefreshCw,
  Home, Building2, Store, MapPin, Layers, Eye, EyeOff, Download,
  Grid, List, MoreVertical, Copy, AlertCircle, CheckCircle, XCircle,
  Bell, Settings, User, ChevronRight, Star, Award, Target, TrendingUp,
  Clock, Globe, Shield, Zap, Sparkles, FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BLOCK_TYPES = [
  { value: 'residential', label: 'Residential', icon: Home, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'commercial', label: 'Commercial', icon: Store, color: 'bg-blue-100 text-blue-700' },
  { value: 'mixed', label: 'Mixed Use', icon: Building2, color: 'bg-purple-100 text-purple-700' },
  { value: 'luxury', label: 'Luxury', icon: Star, color: 'bg-amber-100 text-amber-700' },
  { value: 'executive', label: 'Executive', icon: Award, color: 'bg-pink-100 text-pink-700' },
]

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<any[]>([])
  const [filteredBlocks, setFilteredBlocks] = useState<any[]>([])
  const [phases, setPhases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editBlock, setEditBlock] = useState<any>(null)
  const [form, setForm] = useState({ 
    phase_id: '', 
    name: '', 
    block_type: 'mixed', 
    description: '',
    total_plots: '',
    available_plots: '',
    price_per_sqyd: '',
    features: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [blockToDelete, setBlockToDelete] = useState<any>(null)
  const [exportDialog, setExportDialog] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterBlocks()
  }, [blocks, searchQuery, phaseFilter, typeFilter, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    const supabase = createClient()
    const [blocksRes, phasesRes] = await Promise.all([
      supabase.from('blocks').select('*, phases(name, display_order)').order('created_at'),
      supabase.from('phases').select('*').eq('is_active', true).order('display_order')
    ])
    if (blocksRes.data) setBlocks(blocksRes.data)
    if (phasesRes.data) setPhases(phasesRes.data)
    setLoading(false)
  }

  const filterBlocks = () => {
    let filtered = [...blocks]

    if (searchQuery) {
      filtered = filtered.filter(b => 
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.phases?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.block_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (phaseFilter !== 'all') {
      filtered = filtered.filter(b => b.phase_id === phaseFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(b => b.block_type === typeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => 
        statusFilter === 'active' ? b.is_active : !b.is_active
      )
    }

    setFilteredBlocks(filtered)
  }

  const handleSave = async () => {
    const supabase = createClient()
    
    if (editBlock) {
      const { error } = await supabase
        .from('blocks')
        .update({ 
          ...form, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', editBlock.id)

      if (!error) {
        toast.success('Block updated successfully')
      }
    } else {
      const { error } = await supabase
        .from('blocks')
        .insert([{ ...form }])

      if (!error) {
        toast.success('Block added successfully')
      }
    }
    
    setDialog(false)
    setEditBlock(null)
    setForm({ 
      phase_id: '', 
      name: '', 
      block_type: 'mixed', 
      description: '',
      total_plots: '',
      available_plots: '',
      price_per_sqyd: '',
      features: ''
    })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', id)

    if (!error) {
      toast.success('Block deleted successfully')
      fetchData()
    }
    setDeleteDialog(false)
    setBlockToDelete(null)
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return
    
    const supabase = createClient()
    const { error } = await supabase
      .from('blocks')
      .delete()
      .in('id', selectedItems)

    if (!error) {
      toast.success(`${selectedItems.length} blocks deleted`)
      setSelectedItems([])
      fetchData()
    }
  }

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const data = filteredBlocks.map(b => ({
      Name: b.name,
      Phase: b.phases?.name || 'N/A',
      Type: BLOCK_TYPES.find(t => t.value === b.block_type)?.label || b.block_type,
      Status: b.is_active ? 'Active' : 'Inactive',
      'Total Plots': b.total_plots || 'N/A',
      'Available Plots': b.available_plots || 'N/A',
      'Price/Sq.Yd': b.price_per_sqyd || 'N/A'
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
      a.download = `blocks-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } 
    else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Blocks')
      XLSX.writeFile(wb, `blocks-${new Date().toISOString().split('T')[0]}.xlsx`)
    }
    else if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('NTR Blocks Report', 14, 15)
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
      
      doc.save(`blocks-${new Date().toISOString().split('T')[0]}.pdf`)
    }
    
    toast.success(`Data exported as ${format.toUpperCase()}`)
    setExportDialog(false)
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('blocks')
      .update({ 
        is_active: !isActive, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)

    if (!error) {
      toast.success(isActive ? 'Block deactivated' : 'Block activated')
      fetchData()
    }
  }

  const handleDuplicate = async (block: any) => {
    const supabase = createClient()
    const { name, phase_id, block_type, description, total_plots, available_plots, price_per_sqyd, features } = block
    const { error } = await supabase
      .from('blocks')
      .insert([{ 
        name: `${name} (Copy)`, 
        phase_id, 
        block_type, 
        description, 
        total_plots, 
        available_plots, 
        price_per_sqyd, 
        features,
        is_active: false 
      }])

    if (!error) {
      toast.success('Block duplicated')
      fetchData()
    }
  }

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredBlocks.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredBlocks.map(b => b.id))
    }
  }

  const getTypeIcon = (type: string) => {
    const blockType = BLOCK_TYPES.find(t => t.value === type)
    return blockType?.icon || Building2
  }

  const getTypeColor = (type: string) => {
    const blockType = BLOCK_TYPES.find(t => t.value === type)
    return blockType?.color || 'bg-slate-100 text-slate-700'
  }

  const stats = [
    { 
      label: 'Total Blocks', 
      value: blocks.length,
      icon: Grid3x3,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      label: 'Active', 
      value: blocks.filter(b => b.is_active).length,
      icon: Eye,
      color: 'bg-emerald-100 text-emerald-600'
    },
    { 
      label: 'Inactive', 
      value: blocks.filter(b => !b.is_active).length,
      icon: EyeOff,
      color: 'bg-red-100 text-red-600'
    },
    { 
      label: 'Residential', 
      value: blocks.filter(b => b.block_type === 'residential').length,
      icon: Home,
      color: 'bg-emerald-100 text-emerald-600'
    },
    { 
      label: 'Commercial', 
      value: blocks.filter(b => b.block_type === 'commercial').length,
      icon: Store,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      label: 'Mixed Use', 
      value: blocks.filter(b => b.block_type === 'mixed').length,
      icon: Building2,
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
                <Grid3x3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Blocks Management</h1>
                <p className="text-xs text-slate-500">Manage property blocks across all phases</p>
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
              onClick={fetchData}
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
                setEditBlock(null); 
                setForm({ 
                  phase_id: '', 
                  name: '', 
                  block_type: 'mixed', 
                  description: '',
                  total_plots: '',
                  available_plots: '',
                  price_per_sqyd: '',
                  features: ''
                }); 
                setDialog(true); 
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Block
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
                  placeholder="Search blocks by name, phase, type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-0 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                  <SelectTrigger className="w-[160px] bg-white border-0">
                    <Layers className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {phases.map(phase => (
                      <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px] bg-white border-0">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Block Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {BLOCK_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
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
                    <Grid className="h-4 w-4" />
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
            {(phaseFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/30">
                <span className="text-xs text-slate-600">Active filters:</span>
                {phaseFilter !== 'all' && (
                  <Badge className="bg-white text-slate-700 border-0 px-2 py-1 text-xs">
                    Phase: {phases.find(p => p.id === phaseFilter)?.name}
                    <button className="ml-1 hover:text-red-600" onClick={() => setPhaseFilter('all')}>
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {typeFilter !== 'all' && (
                  <Badge className="bg-white text-slate-700 border-0 px-2 py-1 text-xs">
                    Type: {BLOCK_TYPES.find(t => t.value === typeFilter)?.label}
                    <button className="ml-1 hover:text-red-600" onClick={() => setTypeFilter('all')}>
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

        {/* Select All Bar */}
        {filteredBlocks.length > 0 && (
          <div className="flex items-center justify-between bg-white rounded-lg p-3 mb-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedItems.length === filteredBlocks.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-600">
                {selectedItems.length} of {filteredBlocks.length} selected
              </span>
            </div>
          </div>
        )}

        {/* Blocks Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
              <div className="relative w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600 font-medium">Loading blocks...</p>
          </div>
        ) : filteredBlocks.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Grid3x3 className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No blocks found</h3>
              <p className="text-slate-500 mb-6">Try adjusting your filters or add a new block</p>
              <Button 
                onClick={() => {
                  setPhaseFilter('all')
                  setTypeFilter('all')
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
            {filteredBlocks.map((block) => {
              const TypeIcon = getTypeIcon(block.block_type)
              const typeColor = getTypeColor(block.block_type)
              
              return (
                <div key={block.id} className="group relative">
                  {/* Selection Checkbox */}
                  <div className="absolute top-3 left-3 z-20">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(block.id)}
                      onChange={() => toggleSelectItem(block.id)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>

                  <Card className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl ${typeColor} flex items-center justify-center`}>
                            <TypeIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{block.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">
                              {block.phases?.name}
                            </p>
                          </div>
                        </div>
                        <Badge className={block.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                          {block.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Type Badge */}
                      <div className="mb-4">
                        <Badge className={`${typeColor} border-0`}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {BLOCK_TYPES.find(t => t.value === block.block_type)?.label || block.block_type}
                        </Badge>
                      </div>

                      {/* Description */}
                      {block.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {block.description}
                        </p>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {block.total_plots && (
                          <div className="text-center p-2 bg-slate-50 rounded-lg">
                            <p className="text-sm font-semibold text-slate-900">{block.total_plots}</p>
                            <p className="text-xs text-slate-500">Total</p>
                          </div>
                        )}
                        {block.available_plots && (
                          <div className="text-center p-2 bg-slate-50 rounded-lg">
                            <p className="text-sm font-semibold text-emerald-600">{block.available_plots}</p>
                            <p className="text-xs text-slate-500">Available</p>
                          </div>
                        )}
                        {block.price_per_sqyd && (
                          <div className="text-center p-2 bg-slate-50 rounded-lg">
                            <p className="text-sm font-semibold text-slate-900">PKR {block.price_per_sqyd}</p>
                            <p className="text-xs text-slate-500">Per Sq.Yd</p>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      {block.features && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {block.features.split(',').map((feature: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {feature.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={block.is_active} 
                            onCheckedChange={() => toggleActive(block.id, block.is_active)}
                            className="scale-75"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => handleDuplicate(block)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => { 
                              setEditBlock(block); 
                              setForm({ 
                                phase_id: block.phase_id, 
                                name: block.name, 
                                block_type: block.block_type, 
                                description: block.description || '',
                                total_plots: block.total_plots || '',
                                available_plots: block.available_plots || '',
                                price_per_sqyd: block.price_per_sqyd || '',
                                features: block.features || ''
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
                              setBlockToDelete(block)
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
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredBlocks.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Block</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phase</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plots</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBlocks.map((block) => {
                    const TypeIcon = getTypeIcon(block.block_type)
                    const typeColor = getTypeColor(block.block_type)
                    
                    return (
                      <tr key={block.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(block.id)}
                            onChange={() => toggleSelectItem(block.id)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{block.name}</p>
                            {block.description && (
                              <p className="text-xs text-slate-500 line-clamp-1">{block.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {block.phases?.name}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={typeColor}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {BLOCK_TYPES.find(t => t.value === block.block_type)?.label || block.block_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={block.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                            {block.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {block.available_plots && block.total_plots ? (
                            <div className="text-sm">
                              <span className="font-medium text-emerald-600">{block.available_plots}</span>
                              <span className="text-slate-500">/{block.total_plots}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Switch 
                              checked={block.is_active} 
                              onCheckedChange={() => toggleActive(block.id, block.is_active)}
                              className="scale-75 mr-2"
                            />
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => handleDuplicate(block)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => { 
                                setEditBlock(block); 
                                setForm({ 
                                  phase_id: block.phase_id, 
                                  name: block.name, 
                                  block_type: block.block_type, 
                                  description: block.description || '',
                                  total_plots: block.total_plots || '',
                                  available_plots: block.available_plots || '',
                                  price_per_sqyd: block.price_per_sqyd || '',
                                  features: block.features || ''
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
                                setBlockToDelete(block)
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
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredBlocks.length}</span> of <span className="font-medium">{blocks.length}</span> blocks
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

      {/* Add/Edit Block Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5 text-emerald-600" />
              {editBlock ? 'Edit Block' : 'Add New Block'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phase">Phase</Label>
                <Select value={form.phase_id} onValueChange={(v) => setForm({...form, phase_id: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          {phase.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Block Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Titanium Block"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="block_type">Block Type</Label>
              <Select value={form.block_type} onValueChange={(v) => setForm({...form, block_type: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Brief description of the block"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="total_plots">Total Plots</Label>
                <Input
                  id="total_plots"
                  type="number"
                  value={form.total_plots}
                  onChange={(e) => setForm({...form, total_plots: e.target.value})}
                  placeholder="e.g. 100"
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
                  placeholder="e.g. 45"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="price_per_sqyd">Price per Sq.Yd</Label>
                <Input
                  id="price_per_sqyd"
                  type="number"
                  value={form.price_per_sqyd}
                  onChange={(e) => setForm({...form, price_per_sqyd: e.target.value})}
                  placeholder="e.g. 25000"
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
                placeholder="e.g. Park View, Corner Plot, Road Facing"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.phase_id || !form.name} className="bg-emerald-600 hover:bg-emerald-700">
              {editBlock ? 'Update' : 'Save'}
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
              Delete Block
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to delete this block? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => blockToDelete && handleDelete(blockToDelete.id)}
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
              Choose a format to export {filteredBlocks.length} block(s)
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
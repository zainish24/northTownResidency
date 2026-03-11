'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Ban, CheckCircle, Search, Users, UserCheck, UserX, Calendar, Mail, Phone,
  Shield, UserCog, MoreVertical, Download, RefreshCw, Filter, X, Star,
  Award, Clock, Eye, MessageCircle, TrendingUp, AlertCircle, Bell, Settings,
  ChevronRight, Grid3x3, List, Trash2, Edit, Copy, Printer, ShieldAlert, User, Share2, FileText
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import type { Profile } from '@/lib/types'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [blockDialog, setBlockDialog] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [actionType, setActionType] = useState<'block' | 'unblock'>('block')
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null)
  const [exportDialog, setExportDialog] = useState(false)
  const [shareDialog, setShareDialog] = useState(false)
  const [totalListings, setTotalListings] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
    fetchTotalListings()
  }, [roleFilter, statusFilter, sortBy])

  const fetchTotalListings = async () => {
    const supabase = createClient()
    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
    setTotalListings(count || 0)
  }

  const fetchUsers = async () => {
    setLoading(true)
    const supabase = createClient()
    
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter)
    }
    if (statusFilter === 'active') {
      query = query.eq('is_blocked', false)
    } else if (statusFilter === 'blocked') {
      query = query.eq('is_blocked', true)
    }

    const { data, error } = await query

    if (!error && data) {
      let sortedData = [...data]
      if (sortBy === 'name-asc') {
        sortedData.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
      } else if (sortBy === 'name-desc') {
        sortedData.sort((a, b) => (b.full_name || '').localeCompare(a.full_name || ''))
      } else if (sortBy === 'oldest') {
        sortedData.reverse()
      }
      setUsers(sortedData)
    }
    setLoading(false)
  }

  const handleBlockUser = async (userId: string, currentBlockedStatus: boolean, reason: string = '') => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const newBlockedStatus = !currentBlockedStatus
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_blocked: newBlockedStatus,
        blocked_reason: newBlockedStatus ? reason : null,
        blocked_at: newBlockedStatus ? new Date().toISOString() : null
      })
      .eq('id', userId)

    if (!error) {
      // Log activity
      await supabase.from('activity_logs').insert({
        admin_id: user?.id,
        action: newBlockedStatus ? 'block_user' : 'unblock_user',
        entity_type: 'user',
        entity_id: userId,
        details: { reason }
      })
    }

    if (error) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      })
    } else {
      toast({ 
        title: newBlockedStatus ? '⛔ User Blocked' : '✅ User Unblocked', 
        description: newBlockedStatus 
          ? 'User has been blocked from the platform' 
          : 'User has been unblocked',
        className: newBlockedStatus ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
      })
      
      setBlockDialog(false)
      setBlockReason('')
      setSelectedUser(null)
      fetchUsers()
    }
  }

  const handleBulkAction = async (action: 'block' | 'unblock') => {
    if (selectedItems.length === 0) return
    
    const supabase = createClient()
    const newBlockedStatus = action === 'block'
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_blocked: newBlockedStatus,
        blocked_reason: newBlockedStatus ? 'Bulk action' : null,
        blocked_at: newBlockedStatus ? new Date().toISOString() : null
      })
      .in('id', selectedItems)

    if (!error) {
      toast({ 
        title: action === 'block' ? '⛔ Users Blocked' : '✅ Users Unblocked', 
        description: `${selectedItems.length} users ${action === 'block' ? 'blocked' : 'unblocked'}`,
        className: action === 'block' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
      })
      setSelectedItems([])
      fetchUsers()
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (!error) {
      await supabase.from('activity_logs').insert({
        admin_id: user?.id,
        action: 'delete_user',
        entity_type: 'user',
        entity_id: userId,
        details: {}
      })
      
      toast({ 
        title: '✅ Deleted', 
        description: 'User deleted successfully',
        className: 'bg-emerald-50 border-emerald-200'
      })
      setDeleteDialog(false)
      setUserToDelete(null)
      fetchUsers()
    } else {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      })
    }
  }

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const data = filteredUsers.map(u => ({
      Name: u.full_name || 'N/A',
      Phone: u.phone || 'N/A',
      Role: u.role,
      Status: u.is_blocked ? 'Blocked' : 'Active',
      Joined: new Date(u.created_at).toLocaleDateString()
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
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } 
    else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Users')
      XLSX.writeFile(wb, `users-${new Date().toISOString().split('T')[0]}.xlsx`)
    }
    else if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('NTR Users Report', 14, 15)
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
      
      doc.save(`users-${new Date().toISOString().split('T')[0]}.pdf`)
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
      window.location.href = `mailto:?subject=NTR Users&body=${encodeURIComponent(url)}`
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

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredUsers.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredUsers.map(u => u.id))
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const openUserModal = async (user: Profile) => {
    const supabase = createClient()
    
    // Fetch user's listings count
    const { data: listingsData } = await supabase
      .from('listings')
      .select('id, status')
      .eq('user_id', user.id)
    
    const totalListings = listingsData?.length || 0
    const activeListings = listingsData?.filter(l => l.status === 'approved').length || 0
    
    setSelectedUser({ ...user, totalListings, activeListings } as any)
  }

  const filteredUsers = users.filter(user =>
    (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (roleFilter === 'all' || user.role === roleFilter) &&
    (statusFilter === 'all' || 
     (statusFilter === 'active' && !user.is_blocked) ||
     (statusFilter === 'blocked' && user.is_blocked))
  )

  const stats = [
    { 
      label: 'Total Users', 
      value: users.length,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      trend: '+12%',
      change: 'up'
    },
    { 
      label: 'Active Users', 
      value: users.filter(u => !u.is_blocked).length,
      icon: UserCheck,
      color: 'bg-emerald-100 text-emerald-600',
      trend: '+8%',
      change: 'up'
    },
    { 
      label: 'Blocked Users', 
      value: users.filter(u => u.is_blocked).length,
      icon: UserX,
      color: 'bg-red-100 text-red-600',
      trend: '-2%',
      change: 'down'
    },
    { 
      label: 'Admins', 
      value: users.filter(u => u.role === 'admin').length,
      icon: Shield,
      color: 'bg-purple-100 text-purple-600'
    },
    { 
      label: 'New This Month', 
      value: users.filter(u => {
        const date = new Date(u.created_at)
        const now = new Date()
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }).length,
      icon: UserCog,
      color: 'bg-amber-100 text-amber-600',
      trend: '+5%',
      change: 'up'
    },
    { 
      label: 'Total Listings', 
      value: totalListings.toLocaleString(),
      icon: Eye,
      color: 'bg-teal-100 text-teal-600',
      trend: '+15%',
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
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">User Management</h1>
                <p className="text-xs text-slate-500">Manage platform users and permissions</p>
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
              onClick={fetchUsers}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {selectedItems.length > 0 && (
              <>
                <Button 
                  onClick={() => handleBulkAction('block')}
                  className="bg-red-600 hover:bg-red-700 text-white gap-2"
                >
                  <Ban className="h-4 w-4" />
                  Block {selectedItems.length}
                </Button>
                <Button 
                  onClick={() => handleBulkAction('unblock')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Unblock {selectedItems.length}
                </Button>
              </>
            )}
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
                  placeholder="Search by name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-0 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px] bg-white border-0">
                    <Shield className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-white border-0">
                    <UserCheck className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] bg-white border-0">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
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
            {(roleFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/30">
                <span className="text-xs text-slate-600">Active filters:</span>
                {roleFilter !== 'all' && (
                  <Badge className="bg-white text-slate-700 border-0 px-2 py-1 text-xs">
                    Role: {roleFilter}
                    <button className="ml-1 hover:text-red-600" onClick={() => setRoleFilter('all')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge className="bg-white text-slate-700 border-0 px-2 py-1 text-xs">
                    Status: {statusFilter}
                    <button className="ml-1 hover:text-red-600" onClick={() => setStatusFilter('all')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge className="bg-white text-slate-700 border-0 px-2 py-1 text-xs">
                    Search: "{searchQuery}"
                    <button className="ml-1 hover:text-red-600" onClick={() => setSearchQuery('')}>
                      <X className="h-3 w-3" />
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

        {/* Users Grid/List View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
              <div className="relative w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600 font-medium">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No users found</h3>
              <p className="text-slate-500 mb-6">Try adjusting your filters or search query</p>
              <Button 
                onClick={() => {
                  setRoleFilter('all')
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <div key={user.id} className="group relative">

                <Card 
                  className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                  onClick={() => openUserModal(user)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar */}
                      <div className="relative mb-4">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-blue-600 text-white text-2xl">
                            {user.full_name ? getInitials(user.full_name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Status Badge */}
                        <div className="absolute -bottom-2 right-0">
                          {user.is_blocked ? (
                            <Badge className="bg-red-500 text-white border-0 px-2 py-1">
                              Blocked
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500 text-white border-0 px-2 py-1">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* User Info */}
                      <h3 className="font-semibold text-lg text-slate-900 mb-1">
                        {user.full_name || 'Unnamed User'}
                      </h3>
                      
                      <Badge className={`mb-3 ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700 border-purple-200' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="h-3 w-3 mr-1" />
                        ) : (
                          <User className="h-3 w-3 mr-1" />
                        )}
                        {user.role}
                      </Badge>

                      {/* Contact Info */}
                      <div className="w-full space-y-2 mb-4">
                        {user.phone && (
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                            <Phone className="h-4 w-4 text-emerald-600" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-center gap-4 w-full pt-4 border-t border-slate-100">
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-900">0</p>
                          <p className="text-xs text-slate-500">Listings</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-900">
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">Joined</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 w-full">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedUser(user)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {user.role !== 'admin' && (
                          <>
                            <Button
                              size="sm"
                              variant={user.is_blocked ? 'default' : 'destructive'}
                              className={user.is_blocked ? 'bg-emerald-600 hover:bg-emerald-700 flex-1' : 'flex-1'}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedUser(user)
                                setActionType(user.is_blocked ? 'unblock' : 'block')
                                setBlockDialog(true)
                              }}
                            >
                              {user.is_blocked ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                setUserToDelete(user)
                                setDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Listings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => openUserModal(user)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-blue-600 text-white">
                              {user.full_name ? getInitials(user.full_name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{user.full_name || 'Unnamed User'}</p>
                            <p className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {user.phone && <p className="text-sm">{user.phone}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={user.is_blocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}>
                          {user.is_blocked ? 'Blocked' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">0</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant={user.is_blocked ? 'default' : 'destructive'}
                              className={user.is_blocked ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType(user.is_blocked ? 'unblock' : 'block')
                                setBlockDialog(true)
                              }}
                            >
                              {user.is_blocked ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>
                          )}
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
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{users.length}</span> users
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

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {selectedUser && (
            <div className="divide-y divide-slate-200">
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
                <DialogTitle className="text-xl mb-2">User Profile</DialogTitle>
                <p className="text-sm text-white/80">Detailed user information and activity</p>
              </div>

              <div className="p-6 space-y-6">
                {/* User Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-blue-600 text-white text-2xl">
                      {selectedUser.full_name ? getInitials(selectedUser.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedUser.full_name || 'Unnamed User'}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className={selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}>
                        {selectedUser.role}
                      </Badge>
                      <Badge className={selectedUser.is_blocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}>
                        {selectedUser.is_blocked ? 'Blocked' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 gap-4">
                  {selectedUser.phone && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">{selectedUser.phone}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900">{(selectedUser as any).totalListings || 0}</p>
                    <p className="text-xs text-slate-500">Total Listings</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900">{(selectedUser as any).activeListings || 0}</p>
                    <p className="text-xs text-slate-500">Active Listings</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">Member Since</p>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Recent Activity</h3>
                  {(selectedUser as any).totalListings > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Posted {(selectedUser as any).totalListings} listing(s)</p>
                          <p className="text-xs text-slate-500">{(selectedUser as any).activeListings} active • {(selectedUser as any).totalListings - (selectedUser as any).activeListings} pending/rejected</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">No activity yet</p>
                    </div>
                  )}
                </div>

                {/* Block Info */}
                {selectedUser.is_blocked && selectedUser.blocked_reason && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-700 mb-1">Blocked User</p>
                          <p className="text-sm text-red-600">{selectedUser.blocked_reason}</p>
                          <p className="text-xs text-red-500 mt-1">
                            Blocked on: {new Date(selectedUser.blocked_at || '').toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
                {selectedUser.role !== 'admin' && (
                  <Button
                    variant={selectedUser.is_blocked ? 'default' : 'destructive'}
                    className={selectedUser.is_blocked ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    onClick={() => {
                      setActionType(selectedUser.is_blocked ? 'unblock' : 'block')
                      setBlockDialog(true)
                    }}
                  >
                    {selectedUser.is_blocked ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Unblock User
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-2" />
                        Block User
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block/Unblock Dialog */}
      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${actionType === 'block' ? 'text-red-600' : 'text-emerald-600'}`}>
              {actionType === 'block' ? (
                <Ban className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              {actionType === 'block' ? 'Block User' : 'Unblock User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionType === 'block' ? (
              <>
                <p className="text-sm text-slate-600">
                  Please provide a reason for blocking this user. This will be recorded for audit purposes.
                </p>
                <Textarea
                  placeholder="Enter reason for blocking..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={4}
                  className="resize-none focus:ring-2 focus:ring-red-500/20"
                />
              </>
            ) : (
              <p className="text-sm text-slate-600">
                Are you sure you want to unblock this user? They will be able to access the platform again.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBlockDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'block' ? 'destructive' : 'default'}
              className={actionType === 'unblock' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              onClick={() => selectedUser && handleBlockUser(selectedUser.id, selectedUser.is_blocked, blockReason)}
              disabled={actionType === 'block' && !blockReason}
            >
              {actionType === 'block' ? (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Block User
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Unblock User
                </>
              )}
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
              Delete User
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 mb-1">Warning: This action cannot be undone</p>
                  <p className="text-sm text-red-600">You are about to permanently delete this user.</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this user? All associated data will be removed.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete User
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
              Choose a format to export {filteredUsers.length} user(s)
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
              Share Users
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

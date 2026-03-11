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
  Bell, Plus, Send, Loader2, Users, CheckCircle, XCircle, AlertCircle,
  Search, Filter, RefreshCw, Download, Grid3x3, List, MoreVertical,
  Copy, Eye, EyeOff, Calendar, Clock, Star, Award, Target, TrendingUp,
  Home, MessageCircle, Mail, Phone, User, Settings, Shield, Zap, Sparkles,
  ChevronRight, AlertTriangle, Info, Megaphone, Gift, Rocket,
  BarChart3, PieChart, Activity, Globe, Hash, Link2, ImageIcon, MousePointer,
  Edit, Trash2, FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const NOTIFICATION_TYPES = [
  { value: 'announcement', label: 'Announcement', icon: Megaphone, color: 'bg-blue-100 text-blue-700' },
  { value: 'alert', label: 'Alert', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
  { value: 'update', label: 'Update', icon: Info, color: 'bg-purple-100 text-purple-700' },
  { value: 'promotion', label: 'Promotion', icon: Gift, color: 'bg-amber-100 text-amber-700' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700' },
  { value: 'success', label: 'Success', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'feature', label: 'Feature Update', icon: Rocket, color: 'bg-pink-100 text-pink-700' },
]

const TARGET_AUDIENCES = [
  { value: 'all', label: 'All Users', icon: Users, color: 'bg-slate-100 text-slate-700' },
  { value: 'specific', label: 'Specific User', icon: User, color: 'bg-blue-100 text-blue-700' },
  { value: 'admins', label: 'Admins', icon: Settings, color: 'bg-amber-100 text-amber-700' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ 
    title: '', 
    message: '', 
    type: 'announcement', 
    target_audience: 'all',
    specific_user_id: '',
    link_url: '',
    image_url: '',
    priority: 'normal',
    expires_at: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [audienceFilter, setAudienceFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [users, setUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')

  const [deleteDialog, setDeleteDialog] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<any>(null)
  const [previewDialog, setPreviewDialog] = useState(false)
  const [previewNotification, setPreviewNotification] = useState<any>(null)
  const [exportDialog, setExportDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    scheduled: 0,
    draft: 0,
    read: 0,
    clicked: 0
  })

  useEffect(() => {
    fetchNotifications()
    fetchUsers()
  }, [])

  useEffect(() => {
    filterNotifications()
  }, [notifications, searchQuery, typeFilter, audienceFilter, activeTab])

  const fetchNotifications = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // First try with join
    let { data, error } = await supabase
      .from('notifications')
      .select('*, created_by_profile:profiles!created_by(full_name, phone, email)')
      .order('created_at', { ascending: false })

    // If join fails, fetch without join
    if (error) {
      console.log('Fetching without join...')
      const result = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
      
      data = result.data
      error = result.error
    }

    if (data) {
      setNotifications(data)
      
      // Calculate stats
      const now = new Date()
      setStats({
        total: data.length,
        sent: data.filter(n => n.is_sent).length,
        scheduled: data.filter(n => n.scheduled_for && new Date(n.scheduled_for) > now).length,
        draft: data.filter(n => !n.is_sent && !n.scheduled_for).length,
        read: data.reduce((acc, n) => acc + (n.read_count || 0), 0),
        clicked: data.reduce((acc, n) => acc + (n.click_count || 0), 0)
      })
    }
    setLoading(false)
  }

  const fetchUsers = async () => {
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .order('full_name', { ascending: true })
      
      if (dbError) {
        console.error('Database error:', dbError)
        setUsers([])
      } else {
        if (data && data.length > 0) {
          console.log('Sample user phone:', data[0]?.phone)
          // Process phone numbers - handle both +92 and 03 formats
          const processedUsers = data.map(u => {
            let displayPhone = u.phone || ''
            // If starts with +92, replace with 0
            if (displayPhone.startsWith('+92')) {
              displayPhone = '0' + displayPhone.substring(3)
            }
            // If starts with 92 (without +), replace with 0
            else if (displayPhone.startsWith('92') && displayPhone.length > 10) {
              displayPhone = '0' + displayPhone.substring(2)
            }
            return {
              ...u,
              displayPhone: displayPhone,
              originalPhone: u.phone
            }
          })
          console.log('Processed phone:', processedUsers[0]?.displayPhone)
          setUsers(processedUsers)
        } else {
          setUsers([])
        }
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
  }

  const filterNotifications = () => {
    let filtered = [...notifications]

    // Apply tab filter
    if (activeTab === 'sent') {
      filtered = filtered.filter(n => n.is_sent)
    } else if (activeTab === 'scheduled') {
      const now = new Date()
      filtered = filtered.filter(n => n.scheduled_for && new Date(n.scheduled_for) > now)
    } else if (activeTab === 'draft') {
      filtered = filtered.filter(n => !n.is_sent && !n.scheduled_for)
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.type?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter)
    }

    // Apply audience filter
    if (audienceFilter !== 'all') {
      filtered = filtered.filter(n => n.target_audience === audienceFilter)
    }

    setFilteredNotifications(filtered)
  }

  const handleSend = async () => {
    setSending(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Prepare notification data
    const notificationData: any = {
      title: form.title,
      message: form.message,
      type: form.type,
      target_audience: form.target_audience,
      priority: form.priority,
      created_by: user?.id,
      is_sent: true,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    
    // Only add optional fields if they have values
    if (form.link_url) notificationData.link_url = form.link_url
    if (form.image_url) notificationData.image_url = form.image_url
    if (form.expires_at) notificationData.expires_at = form.expires_at
    
    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      console.error('Notification error:', error)
      toast.error('Failed to send notification: ' + error.message)
      setSending(false)
      return
    }

    // Get target users
    let query = supabase.from('profiles').select('id')
    
    if (form.target_audience === 'specific') {
      if (!form.specific_user_id) {
        toast.error('Please select a specific user')
        setSending(false)
        return
      }
      query = query.eq('id', form.specific_user_id)
    } else if (form.target_audience === 'admins') {
      query = query.eq('role', 'admin')
    }
    // 'all' means no filter

    const { data: users } = await query

    // Create user notifications
    if (users && users.length > 0) {
      const userNotifications = users.map(u => ({
        user_id: u.id,
        notification_id: notification.id,
        created_at: new Date().toISOString()
      }))
      await supabase.from('user_notifications').insert(userNotifications)
    }

    toast.success(`Notification sent to ${users?.length || 0} users`)
    setDialog(false)
    setForm({ 
      title: '', 
      message: '', 
      type: 'announcement', 
      target_audience: 'all',
      specific_user_id: '',
      link_url: '',
      image_url: '',
      priority: 'normal',
      expires_at: ''
    })
    setUserSearch('')
    setSending(false)
    fetchNotifications()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (!error) {
      toast.success('Notification deleted successfully')
      fetchNotifications()
    }
    setDeleteDialog(false)
    setNotificationToDelete(null)
  }



  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const data = filteredNotifications.map(n => ({
      Title: n.title,
      Message: n.message.substring(0, 100),
      Type: NOTIFICATION_TYPES.find(t => t.value === n.type)?.label || n.type,
      Audience: TARGET_AUDIENCES.find(a => a.value === n.target_audience)?.label || n.target_audience,
      Status: n.is_sent ? 'Sent' : n.scheduled_for ? 'Scheduled' : 'Draft',
      Reads: n.read_count || 0,
      Clicks: n.click_count || 0,
      Sent: n.sent_at ? new Date(n.sent_at).toLocaleDateString() : 'N/A'
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
      a.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } 
    else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Notifications')
      XLSX.writeFile(wb, `notifications-${new Date().toISOString().split('T')[0]}.xlsx`)
    }
    else if (format === 'pdf') {
      const doc = new jsPDF('landscape')
      doc.setFontSize(16)
      doc.text('NTR Notifications Report', 14, 15)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22)
      
      autoTable(doc, {
        head: [Object.keys(data[0])],
        body: data.map(row => Object.values(row)),
        startY: 28,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })
      
      doc.save(`notifications-${new Date().toISOString().split('T')[0]}.pdf`)
    }
    
    toast.success(`Data exported as ${format.toUpperCase()}`)
    setExportDialog(false)
  }

  const handleResend = async (notification: any) => {
    setForm({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      target_audience: notification.target_audience,
      specific_user_id: '',
      link_url: notification.link_url || '',
      image_url: notification.image_url || '',
      priority: notification.priority || 'normal',
      expires_at: notification.expires_at || ''
    })
    setDialog(true)
  }

  const handleDuplicate = async (notification: any) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('notifications')
      .insert({ 
        title: `${notification.title} (Copy)`,
        message: notification.message,
        type: notification.type,
        target_audience: notification.target_audience,
        link_url: notification.link_url,
        image_url: notification.image_url,
        priority: notification.priority,
        created_by: user?.id,
        is_sent: false
      })

    if (!error) {
      toast.success('Notification duplicated')
      fetchNotifications()
    }
  }



  const getTypeIcon = (type: string) => {
    const notificationType = NOTIFICATION_TYPES.find(t => t.value === type)
    return notificationType?.icon || Bell
  }

  const getTypeColor = (type: string) => {
    const notificationType = NOTIFICATION_TYPES.find(t => t.value === type)
    return notificationType?.color || 'bg-slate-100 text-slate-700'
  }

  const getAudienceIcon = (audience: string) => {
    const target = TARGET_AUDIENCES.find(t => t.value === audience)
    return target?.icon || Users
  }

  const getAudienceColor = (audience: string) => {
    const target = TARGET_AUDIENCES.find(t => t.value === audience)
    return target?.color || 'bg-slate-100 text-slate-700'
  }

  const getPriorityBadge = (priority: string) => {
    const option = PRIORITY_OPTIONS.find(p => p.value === priority)
    return (
      <Badge className={option?.color || 'bg-slate-100 text-slate-700'}>
        {option?.label || priority}
      </Badge>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffTime = Math.abs(now.getTime() - notifDate.getTime())
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return formatDate(date)
  }

  const statsCards = [
    { 
      label: 'Total Notifications', 
      value: stats.total,
      icon: Bell,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      label: 'Sent', 
      value: stats.sent,
      icon: Send,
      color: 'bg-emerald-100 text-emerald-600'
    },
    { 
      label: 'Scheduled', 
      value: stats.scheduled,
      icon: Calendar,
      color: 'bg-purple-100 text-purple-600'
    },
    { 
      label: 'Drafts', 
      value: stats.draft,
      icon: Edit,
      color: 'bg-amber-100 text-amber-600'
    },
    { 
      label: 'Total Reads', 
      value: stats.read.toLocaleString(),
      icon: Eye,
      color: 'bg-pink-100 text-pink-600'
    },
    { 
      label: 'Total Clicks', 
      value: stats.clicked.toLocaleString(),
      icon: MousePointer,
      color: 'bg-indigo-100 text-indigo-600'
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
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Notification Center</h1>
                <p className="text-xs text-slate-500">Manage and send notifications to users</p>
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
              onClick={fetchNotifications}
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
                setForm({ 
                  title: '', 
                  message: '', 
                  type: 'announcement', 
                  target_audience: 'all',
                  specific_user_id: '',
                  link_url: '',
                  image_url: '',
                  priority: 'normal',
                  expires_at: ''
                })
                setUserSearch('')
                setDialog(true)
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              New Notification
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
                <p className="text-xs text-slate-600 mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-white">All</TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-white">Sent</TabsTrigger>
            <TabsTrigger value="scheduled" className="data-[state=active]:bg-white">Scheduled</TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-white">Drafts</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters & Search */}
        <Card className="border-0 shadow-lg rounded-xl mb-8 bg-gradient-to-r from-emerald-50 to-blue-50">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search notifications by title, message, type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-0 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px] bg-white border-0">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {NOTIFICATION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                  <SelectTrigger className="w-[160px] bg-white border-0">
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Audiences</SelectItem>
                    {TARGET_AUDIENCES.map(audience => (
                      <SelectItem key={audience.value} value={audience.value}>
                        <div className="flex items-center gap-2">
                          <audience.icon className="h-4 w-4" />
                          {audience.label}
                        </div>
                      </SelectItem>
                    ))}
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
            {(typeFilter !== 'all' || audienceFilter !== 'all' || searchQuery) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/30">
                <span className="text-xs text-slate-600">Active filters:</span>
                {typeFilter !== 'all' && (
                  <Badge className="bg-white text-slate-700 border-0 px-2 py-1 text-xs">
                    Type: {NOTIFICATION_TYPES.find(t => t.value === typeFilter)?.label}
                    <button className="ml-1 hover:text-red-600" onClick={() => setTypeFilter('all')}>
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {audienceFilter !== 'all' && (
                  <Badge className="bg-white text-slate-700 border-0 px-2 py-1 text-xs">
                    Audience: {TARGET_AUDIENCES.find(a => a.value === audienceFilter)?.label}
                    <button className="ml-1 hover:text-red-600" onClick={() => setAudienceFilter('all')}>
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



        {/* Notifications Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
              <div className="relative w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600 font-medium">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No notifications found</h3>
              <p className="text-slate-500 mb-6">Try adjusting your filters or create a new notification</p>
              <Button 
                onClick={() => {
                  setTypeFilter('all')
                  setAudienceFilter('all')
                  setSearchQuery('')
                  setActiveTab('all')
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotifications.map((notification) => {
              const TypeIcon = getTypeIcon(notification.type)
              const typeColor = getTypeColor(notification.type)
              const AudienceIcon = getAudienceIcon(notification.target_audience)
              const audienceColor = getAudienceColor(notification.target_audience)
              
              return (
                <div key={notification.id} className="group relative">
                  <Card className="border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    {/* Header with Image */}
                    {notification.image_url && (
                      <div className="relative h-40 bg-slate-200">
                        <Image 
                          src={notification.image_url} 
                          alt={notification.title}
                          fill
                          className="object-cover"
                        />
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge className={notification.is_sent ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}>
                            {notification.is_sent ? 'Sent' : notification.scheduled_for ? 'Scheduled' : 'Draft'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <CardContent className="p-5">
                      {/* Header without Image */}
                      {!notification.image_url && (
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl ${typeColor} flex items-center justify-center`}>
                              <TypeIcon className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                              <p className="text-xs text-slate-500 mt-1">
                                {getTimeAgo(notification.created_at)}
                              </p>
                            </div>
                          </div>
                          <Badge className={notification.is_sent ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                            {notification.is_sent ? 'Sent' : notification.scheduled_for ? 'Scheduled' : 'Draft'}
                          </Badge>
                        </div>
                      )}

                      {/* Title if image exists */}
                      {notification.image_url && (
                        <div className="mb-3">
                          <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {getTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      )}

                      {/* Message */}
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Type & Audience */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className={`${typeColor} border-0`}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {NOTIFICATION_TYPES.find(t => t.value === notification.type)?.label || notification.type}
                        </Badge>
                        <Badge className={`${audienceColor} border-0`}>
                          <AudienceIcon className="h-3 w-3 mr-1" />
                          {TARGET_AUDIENCES.find(a => a.value === notification.target_audience)?.label || notification.target_audience}
                        </Badge>
                        {getPriorityBadge(notification.priority || 'normal')}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-sm font-semibold text-slate-900">{notification.read_count || 0}</p>
                          <p className="text-xs text-slate-500">Reads</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-sm font-semibold text-slate-900">{notification.click_count || 0}</p>
                          <p className="text-xs text-slate-500">Clicks</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-sm font-semibold text-slate-900">
                            {notification.sent_at ? formatDate(notification.sent_at) : '-'}
                          </p>
                          <p className="text-xs text-slate-500">Sent</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="text-xs text-slate-500">
                          By: {notification.created_by_profile?.full_name || 'System'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => {
                              setPreviewNotification(notification)
                              setPreviewDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => handleResend(notification)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => {
                              setNotificationToDelete(notification)
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Audience</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stats</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredNotifications.map((notification) => {
                    const TypeIcon = getTypeIcon(notification.type)
                    const typeColor = getTypeColor(notification.type)
                    
                    return (
                      <tr key={notification.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{notification.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{notification.message}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={typeColor}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {NOTIFICATION_TYPES.find(t => t.value === notification.type)?.label || notification.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {TARGET_AUDIENCES.find(a => a.value === notification.target_audience)?.label || notification.target_audience}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={
                            notification.is_sent ? 'bg-emerald-100 text-emerald-700' : 
                            notification.scheduled_for ? 'bg-purple-100 text-purple-700' : 
                            'bg-amber-100 text-amber-700'
                          }>
                            {notification.is_sent ? 'Sent' : notification.scheduled_for ? 'Scheduled' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-slate-400" />
                              {notification.read_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointer className="h-3 w-3 text-slate-400" />
                              {notification.click_count || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {notification.sent_at ? formatDate(notification.sent_at) : '-'}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => {
                                setPreviewNotification(notification)
                                setPreviewDialog(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => handleResend(notification)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => {
                                setNotificationToDelete(notification)
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
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredNotifications.length}</span> of <span className="font-medium">{notifications.length}</span> notifications
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

      {/* Send Notification Dialog */}
      <Dialog open={dialog} onOpenChange={(open) => {
        if (!open) {
          // Delay reset to avoid glitch during close animation
          setTimeout(() => {
            setForm({ 
              title: '', 
              message: '', 
              type: 'announcement', 
              target_audience: 'all',
              specific_user_id: '',
              link_url: '',
              image_url: '',
              priority: 'normal',
              expires_at: ''
            })
            setUserSearch('')
          }, 200)
        }
        setDialog(open)
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-600" />
              Send New Notification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="Notification title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map(type => (
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
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={4}
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
                placeholder="Notification message"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_audience">Target Audience</Label>
                <Select value={form.target_audience} onValueChange={(v) => setForm({...form, target_audience: v, specific_user_id: ''})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_AUDIENCES.map(audience => (
                      <SelectItem key={audience.value} value={audience.value}>
                        <div className="flex items-center gap-2">
                          <audience.icon className="h-4 w-4" />
                          {audience.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({...form, priority: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <Badge className={priority.color}>{priority.label}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Specific User Selection */}
            {form.target_audience === 'specific' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="specific_user">Select User</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchUsers}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reload Users
                  </Button>
                </div>
                <div className="mt-1 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={userSearch}
                      onChange={(e) => {
                        const value = e.target.value
                        setUserSearch(value)
                        console.log('=== SEARCH DEBUG ===')
                        console.log('Search value:', value)
                        console.log('Total users:', users.length)
                        
                        if (users.length > 0) {
                          console.log('\nFirst 3 users data:')
                          users.slice(0, 3).forEach((u, i) => {
                            console.log(`User ${i + 1}:`, {
                              name: u.full_name,
                              phone: u.phone,
                              displayPhone: u.displayPhone
                            })
                          })
                        }
                        
                        const filtered = users.filter(u => {
                          if (!value || value.trim() === '') return true
                          const searchTerm = value.toLowerCase().trim()
                          const userName = (u.full_name || '').toLowerCase()
                          const userPhone = (u.displayPhone || u.phone || '').toLowerCase()
                          
                          const nameMatch = userName.includes(searchTerm)
                          const phoneMatch = userPhone.includes(searchTerm)
                          
                          if (nameMatch || phoneMatch) {
                            console.log('\nMatch found:', {
                              name: u.full_name,
                              phone: userPhone,
                              searchTerm,
                              nameMatch,
                              phoneMatch
                            })
                          }
                          
                          return nameMatch || phoneMatch
                        })
                        console.log('\nFiltered users:', filtered.length)
                        console.log('===================')
                      }}
                      className="pl-10"
                    />
                  </div>
                  
                  {users.length === 0 ? (
                    <div className="border rounded-lg p-8 text-center bg-slate-50">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 text-slate-400 animate-spin" />
                      <p className="text-sm text-slate-500 mb-2">Loading users...</p>
                      <p className="text-xs text-slate-400">Check browser console (F12) for details</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchUsers}
                        className="mt-3"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-lg max-h-60 overflow-y-auto bg-white">
                      {users
                        .filter(u => {
                          if (!userSearch || userSearch.trim() === '') return true
                          
                          const searchTerm = userSearch.toLowerCase().trim()
                          const userName = (u.full_name || '').toLowerCase()
                          const userPhone = (u.displayPhone || u.phone || '').toLowerCase()
                          
                          return userName.includes(searchTerm) || userPhone.includes(searchTerm)
                        })
                        .slice(0, 50)
                        .map(user => (
                          <div
                            key={user.id}
                            onClick={() => setForm({...form, specific_user_id: user.id})}
                            className={`p-3 cursor-pointer hover:bg-slate-50 border-b last:border-0 transition-colors ${
                              form.specific_user_id === user.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-slate-900">{user.full_name || 'No Name'}</p>
                                <p className="text-xs text-slate-500">
                                  {user.displayPhone || user.phone || 'No phone'}
                                  {user.role && <span className="ml-2 text-slate-400">({user.role})</span>}
                                </p>
                              </div>
                              {form.specific_user_id === user.id && (
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      {users.filter(u => {
                        if (!userSearch || userSearch.trim() === '') return true
                        
                        const searchTerm = userSearch.toLowerCase().trim()
                        const userName = (u.full_name || '').toLowerCase()
                        const userPhone = (u.displayPhone || u.phone || '').toLowerCase()
                        
                        return userName.includes(searchTerm) || userPhone.includes(searchTerm)
                      }).length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                          <User className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                          <p className="text-sm">No users found</p>
                          <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {form.specific_user_id && (
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700 font-medium">
                        {users.find(u => u.id === form.specific_user_id)?.full_name || 'User'} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm({...form, specific_user_id: ''})}
                        className="ml-auto text-emerald-600 hover:text-emerald-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-500">
                    Total users: {users.length} | Showing: {Math.min(50, users.filter(u => {
                      if (!userSearch || userSearch.trim() === '') return true
                      
                      const searchTerm = userSearch.toLowerCase().trim()
                      const userName = (u.full_name || '').toLowerCase()
                      const userPhone = (u.displayPhone || u.phone || '').toLowerCase()
                      
                      return userName.includes(searchTerm) || userPhone.includes(searchTerm)
                    }).length)}
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="link_url">Link URL (Optional)</Label>
              <Input
                id="link_url"
                value={form.link_url}
                onChange={(e) => setForm({...form, link_url: e.target.value})}
                placeholder="https://example.com/page"
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
                <div className="mt-2 relative h-32 rounded-lg overflow-hidden">
                  <img 
                    src={form.image_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({...form, expires_at: e.target.value})}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDialog(false)
                // Reset after animation
                setTimeout(() => {
                  setForm({ 
                    title: '', 
                    message: '', 
                    type: 'announcement', 
                    target_audience: 'all',
                    specific_user_id: '',
                    link_url: '',
                    image_url: '',
                    priority: 'normal',
                    expires_at: ''
                  })
                  setUserSearch('')
                }, 200)
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={!form.title || !form.message || sending} 
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Notification Preview</DialogTitle>
          </DialogHeader>
          {previewNotification && (
            <div className="space-y-4 py-4">
              {previewNotification.image_url && (
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <Image 
                    src={previewNotification.image_url} 
                    alt={previewNotification.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{previewNotification.title}</h3>
                <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{previewNotification.message}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={getTypeColor(previewNotification.type)}>
                  {NOTIFICATION_TYPES.find(t => t.value === previewNotification.type)?.label}
                </Badge>
                <Badge variant="outline">
                  {TARGET_AUDIENCES.find(a => a.value === previewNotification.target_audience)?.label}
                </Badge>
                {getPriorityBadge(previewNotification.priority || 'normal')}
              </div>

              {previewNotification.link_url && (
                <div className="text-sm">
                  <span className="text-slate-500">Link: </span>
                  <a href={previewNotification.link_url} target="_blank" rel="noopener noreferrer" 
                     className="text-emerald-600 hover:underline">
                    {previewNotification.link_url}
                  </a>
                </div>
              )}

              <div className="text-xs text-slate-500 border-t pt-4">
                <div className="flex justify-between">
                  <span>Created: {formatDate(previewNotification.created_at)}</span>
                  <span>By: {previewNotification.created_by_profile?.full_name || 'System'}</span>
                </div>
                {previewNotification.sent_at && (
                  <div className="mt-1">Sent: {formatDate(previewNotification.sent_at)}</div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Notification
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to delete this notification? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => notificationToDelete && handleDelete(notificationToDelete.id)}
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
              Choose a format to export {filteredNotifications.length} notification(s)
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



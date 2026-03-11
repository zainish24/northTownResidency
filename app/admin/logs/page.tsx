'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  Activity, Search, Filter, Download, Printer, RefreshCw, Calendar, 
  Users, TrendingUp, Award, Clock, Bell, FileText, Grid3x3, List, Eye
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { ActivityLog } from '@/lib/types'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [exportDialog, setExportDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, admin:profiles(full_name, phone)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setLogs(data as ActivityLog[])
    }
    setLoading(false)
  }

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const data = filteredLogs.map(log => ({
      Date: new Date(log.created_at).toLocaleString(),
      Admin: log.admin?.full_name || log.admin?.phone || 'System',
      Action: log.action,
      Entity: log.entity_type,
      Details: log.details && typeof log.details === 'object' && 'reason' in log.details
        ? (log.details as { reason: string }).reason
        : '-'
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
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs')
      XLSX.writeFile(wb, `activity-logs-${new Date().toISOString().split('T')[0]}.xlsx`)
    } else if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Activity Logs Report', 14, 15)
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
      
      doc.save(`activity-logs-${new Date().toISOString().split('T')[0]}.pdf`)
    }
    
    toast({ 
      title: '✅ Exported', 
      description: `Logs exported as ${format.toUpperCase()}`,
      className: 'bg-emerald-50 border-emerald-200'
    })
  }

  const handlePrint = () => {
    window.print()
    toast({ 
      title: '🖨️ Print', 
      description: 'Print dialog opened',
      className: 'bg-blue-50 border-blue-200'
    })
  }

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      approve: 'default',
      reject_listing: 'destructive',
      block_user: 'destructive',
      unblock_user: 'default',
      feature_listing: 'secondary',
      unfeature_listing: 'secondary',
      bulk_delete_listings: 'destructive',
      bulk_delete_users: 'destructive',
    }
    return <Badge variant={variants[action] || 'secondary'}>{action.replace(/_/g, ' ')}</Badge>
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin?.phone?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter
    
    let matchesDate = true
    if (dateRange === 'today') {
      const today = new Date()
      const logDate = new Date(log.created_at)
      matchesDate = logDate.toDateString() === today.toDateString()
    } else if (dateRange === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDate = new Date(log.created_at) >= weekAgo
    } else if (dateRange === 'month') {
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)
      matchesDate = new Date(log.created_at) >= monthAgo
    }

    return matchesSearch && matchesAction && matchesEntity && matchesDate
  })

  const stats = [
    { 
      label: 'Total Logs', 
      value: logs.length,
      icon: Activity,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      label: 'Today', 
      value: logs.filter(l => {
        const today = new Date()
        const logDate = new Date(l.created_at)
        return logDate.toDateString() === today.toDateString()
      }).length,
      icon: Calendar,
      color: 'bg-emerald-100 text-emerald-600'
    },
    { 
      label: 'This Week', 
      value: logs.filter(l => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(l.created_at) >= weekAgo
      }).length,
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600'
    },
    { 
      label: 'Unique Admins', 
      value: new Set(logs.map(l => l.admin_id)).size,
      icon: Users,
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
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Activity Logs</h1>
                <p className="text-xs text-slate-500">Track all admin actions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
              </Button>
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <Avatar className="h-8 w-8 bg-emerald-600">
                  <AvatarFallback className="bg-emerald-600 text-white">AD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button onClick={fetchLogs} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 gap-2">
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
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-lg transition-all">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg rounded-xl mb-8 bg-gradient-to-r from-emerald-50 to-blue-50">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-0"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[160px] bg-white border-0">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="block_user">Block</SelectItem>
                    <SelectItem value="unblock_user">Unblock</SelectItem>
                    <SelectItem value="feature_listing">Feature</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-[160px] bg-white border-0">
                    <FileText className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="listing">Listings</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[160px] bg-white border-0">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="border-0 shadow-lg rounded-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Admin</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8">Loading...</td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        No activity logs found
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(log.created_at).toLocaleString('en-PK', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {log.admin?.full_name || log.admin?.phone || 'System'}
                        </td>
                        <td className="px-4 py-3">{getActionBadge(log.action)}</td>
                        <td className="px-4 py-3 text-sm capitalize">{log.entity_type}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {log.details && typeof log.details === 'object' && 'reason' in log.details
                            ? (log.details as { reason: string }).reason
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-slate-600">
            Showing {filteredLogs.length} of {logs.length} logs
          </p>
        </div>
      </div>

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
              Choose a format to export {filteredLogs.length} log(s)
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

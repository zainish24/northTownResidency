'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { MessageSquare, Phone, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react'

export function OTPUsageTab() {
  const [stats, setStats] = useState({
    provider: 'Not Configured',
    totalSent: 0,
    successful: 0,
    failed: 0,
    monthlyLimit: 100,
    lastSent: null as string | null,
    percentage: 0,
    remaining: 100
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/sms/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching SMS stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchStats()
  }



  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            SMS Provider Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-slate-600">Current Provider</Label>
              <p className="text-lg font-semibold text-slate-900 mt-1">{stats.provider}</p>
            </div>
            <div>
              <Label className="text-sm text-slate-600">Status</Label>
              <div className="mt-1">
                <Badge className="bg-emerald-100 text-emerald-700 border-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </div>


        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-600" />
              Monthly Usage
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-slate-600" />
                <span className="text-sm text-slate-600">Total Sent</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalSent}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600">Successful</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.successful}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">Failed</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-slate-600">Monthly Quota</Label>
              <span className="text-sm font-semibold text-slate-900">{stats.totalSent} / {stats.monthlyLimit} SMS</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-3 rounded-full transition-all"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">{stats.remaining} SMS remaining ({stats.percentage}% used)</p>
          </div>

          {stats.percentage > 80 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium mb-1">Approaching Limit</p>
                  <p className="text-xs">You've used {stats.percentage}% of your monthly SMS quota.</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-4">
            <Label className="text-sm text-slate-600">Last SMS Sent</Label>
            <p className="text-sm font-medium text-slate-900 mt-1">
              {stats.lastSent ? new Date(stats.lastSent).toLocaleString() : 'No activity yet'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

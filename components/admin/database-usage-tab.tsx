'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, ImageIcon, Activity, Home, Users, Camera, RefreshCw, Zap, Award, Clock, TrendingUp, Database, HardDrive, Wifi } from 'lucide-react'
import { toast } from 'sonner'

export function DatabaseUsageTab() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    databaseSize: 0,
    storageUsed: 0,
    bandwidth: 0,
    listings: 0,
    users: 0,
    images: 0,
    plan: 'Free'
  })

  const loadStats = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { count: listingsCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
      
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      const { count: imagesCount } = await supabase
        .from('listing_images')
        .select('*', { count: 'exact', head: true })
      
      const dbSize = Math.round((listingsCount || 0) * 0.01 + (usersCount || 0) * 0.005)
      
      setStats({
        databaseSize: dbSize,
        storageUsed: Math.round((imagesCount || 0) * 0.5),
        bandwidth: Math.round((listingsCount || 0) * 0.1),
        listings: listingsCount || 0,
        users: usersCount || 0,
        images: imagesCount || 0,
        plan: 'Free'
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Failed to load usage statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleUpgrade = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const projectId = supabaseUrl.split('//')[1]?.split('.')[0] || ''
    if (projectId) {
      window.open(`https://supabase.com/dashboard/project/${projectId}/settings/billing`, '_blank')
    } else {
      toast.error('Supabase project not configured')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  const usageData = [
    {
      label: 'Database',
      used: stats.databaseSize,
      total: 500,
      unit: 'MB',
      icon: Database,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600'
    },
    {
      label: 'Storage',
      used: stats.storageUsed,
      total: 1024,
      unit: 'MB',
      icon: HardDrive,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      label: 'Bandwidth',
      used: stats.bandwidth,
      total: 5120,
      unit: 'MB',
      icon: Wifi,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{stats.plan} Plan</h2>
                  <p className="text-white/60 text-sm">Supabase Free Tier</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleUpgrade}
              className="bg-white text-slate-900 hover:bg-white/90 gap-2 shadow-xl"
            >
              <Zap className="h-4 w-4" />
              Upgrade Now
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-emerald-400" />
                <span className="text-white/60 text-sm">Listings</span>
              </div>
              <p className="text-3xl font-bold">{stats.listings}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-white/60 text-sm">Users</span>
              </div>
              <p className="text-3xl font-bold">{stats.users}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-4 w-4 text-purple-400" />
                <span className="text-white/60 text-sm">Images</span>
              </div>
              <p className="text-3xl font-bold">{stats.images}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Cards */}
      <div className="grid gap-6">
        {usageData.map((item, index) => {
          const Icon = item.icon
          const percentage = Math.round((item.used / item.total) * 100)
          const remaining = item.total - item.used
          
          return (
            <Card key={index} className="border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all">
              <CardContent className="p-0">
                <div className="flex items-center">
                  {/* Left Section - Icon & Info */}
                  <div className={`${item.bgColor} p-8 flex items-center gap-6`}>
                    <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold ${item.textColor} mb-1`}>{item.label}</h3>
                      <p className="text-slate-600 text-sm">Resource usage</p>
                    </div>
                  </div>

                  {/* Right Section - Stats */}
                  <div className="flex-1 p-8">
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-4xl font-bold text-slate-900">
                          {item.used} <span className="text-xl text-slate-400">{item.unit}</span>
                        </p>
                        <p className="text-sm text-slate-500 mt-1">of {item.total} {item.unit}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${item.bgColor}`}>
                          <TrendingUp className={`h-4 w-4 ${item.textColor}`} />
                          <span className={`font-bold ${item.textColor}`}>{percentage}%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{remaining} {item.unit} left</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Last updated</p>
            <p className="text-sm text-slate-500">Just now</p>
          </div>
        </div>
        <Button 
          onClick={loadStats}
          variant="outline"
          className="gap-2 border-2 hover:border-emerald-600 hover:text-emerald-600"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Stats
        </Button>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Settings, Building2, Sparkles, Bell, Image, BarChart3, MapPin, Grid3x3,
  Shield, Users, Globe, Mail, Phone, MessageSquare, Facebook, Instagram,
  Twitter, Youtube, Linkedin, CreditCard, DollarSign, Percent, Lock,
  Key, Eye, EyeOff, Download, Upload, RefreshCw, ChevronRight, Star,
  Award, Target, TrendingUp, PieChart, Activity, Clock, Calendar,
  Home, Store, Warehouse, TreePine, Landmark, Briefcase, Factory,
  Zap, Droplets, Wind, Sun, Moon, Coffee, Dumbbell, Swimmer, Car,
  Wifi, Shield as ShieldIcon, Heart, User, LogOut, Menu, X
} from 'lucide-react'

const settingsCategories = [
  {
    title: 'Core Settings',
    description: 'Essential platform configuration',
    items: [
      { title: 'Site Settings', desc: 'Platform name, contact info, social links', icon: Settings, href: '/admin/settings/site', color: 'bg-blue-100 text-blue-600', count: 12 },
      { title: 'Property Types', desc: 'Manage property categories', icon: Building2, href: '/admin/settings/property-types', color: 'bg-emerald-100 text-emerald-600', count: 4 },
      { title: 'Amenities', desc: 'Custom property features', icon: Sparkles, href: '/admin/settings/amenities', color: 'bg-purple-100 text-purple-600', count: 24 },
      { title: 'Phases', desc: 'Manage NTR phases', icon: MapPin, href: '/admin/settings/phases', color: 'bg-teal-100 text-teal-600', count: 4 },
      { title: 'Blocks', desc: 'Manage blocks within phases', icon: Grid3x3, href: '/admin/settings/blocks', color: 'bg-cyan-100 text-cyan-600', count: 18 },
    ]
  },
  {
    title: 'Communication',
    description: 'User engagement tools',
    items: [
      { title: 'Notifications', desc: 'Send announcements to users', icon: Bell, href: '/admin/settings/notifications', color: 'bg-orange-100 text-orange-600', count: 3 },
      { title: 'Email Templates', desc: 'Manage email communications', icon: Mail, href: '/admin/settings/email-templates', color: 'bg-indigo-100 text-indigo-600', count: 8 },
      { title: 'SMS Settings', desc: 'Configure SMS notifications', icon: Phone, href: '/admin/settings/sms', color: 'bg-pink-100 text-pink-600', count: 2 },
    ]
  },
  {
    title: 'Content & Marketing',
    description: 'Promotional and content management',
    items: [
      { title: 'Blog & Articles', desc: 'Manage blog posts', icon: FileText, href: '/admin/settings/blog', color: 'bg-amber-100 text-amber-600', count: 15 },
      { title: 'Testimonials', desc: 'User reviews and feedback', icon: Star, href: '/admin/settings/testimonials', color: 'bg-yellow-100 text-yellow-600', count: 9 },
    ]
  },
  {
    title: 'Analytics & Reports',
    description: 'Data and performance monitoring',
    items: [
      { title: 'Reports', desc: 'Analytics and data export', icon: BarChart3, href: '/admin/settings/reports', color: 'bg-indigo-100 text-indigo-600', count: 5 },
      { title: 'User Analytics', desc: 'User behavior tracking', icon: Users, href: '/admin/settings/user-analytics', color: 'bg-purple-100 text-purple-600', count: 7 },
      { title: 'Performance', desc: 'System performance metrics', icon: Activity, href: '/admin/settings/performance', color: 'bg-red-100 text-red-600', count: 3 },
    ]
  },
  {
    title: 'Security & Access',
    description: 'Platform security settings',
    items: [
      { title: 'Security Settings', desc: 'Authentication and security', icon: Shield, href: '/admin/settings/security', color: 'bg-red-100 text-red-600', count: 9 },
      { title: 'User Roles', desc: 'Manage permissions and roles', icon: Users, href: '/admin/settings/roles', color: 'bg-emerald-100 text-emerald-600', count: 4 },
      { title: 'API Keys', desc: 'Manage API integrations', icon: Key, href: '/admin/settings/api', color: 'bg-amber-100 text-amber-600', count: 2 },
    ]
  },
  {
    title: 'Payment & Billing',
    description: 'Monetization settings',
    items: [
      { title: 'Payment Gateways', desc: 'Configure payment methods', icon: CreditCard, href: '/admin/settings/payments', color: 'bg-green-100 text-green-600', count: 3 },
      { title: 'Pricing Plans', desc: 'Manage subscription plans', icon: DollarSign, href: '/admin/settings/pricing', color: 'bg-blue-100 text-blue-600', count: 4 },
      { title: 'Tax Settings', desc: 'Configure tax rates', icon: Percent, href: '/admin/settings/tax', color: 'bg-purple-100 text-purple-600', count: 2 },
    ]
  }
]

// Flatten all items for quick stats
const allItems = settingsCategories.flatMap(cat => cat.items)

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Settings & Management</h1>
                <p className="text-xs text-slate-500">Configure platform settings and manage content</p>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Welcome back, Admin</h2>
          <p className="text-slate-500 mt-1">Manage your platform settings and configurations</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm rounded-xl hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="outline" className="text-xs">Total</Badge>
              </div>
              <p className="text-2xl font-bold text-slate-900">{allItems.length}</p>
              <p className="text-xs text-slate-500 mt-1">Settings Modules</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-xl hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <Badge variant="outline" className="text-xs bg-emerald-50">Active</Badge>
              </div>
              <p className="text-2xl font-bold text-slate-900">6</p>
              <p className="text-xs text-slate-500 mt-1">Core Modules</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-xl hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <Badge variant="outline" className="text-xs">3</Badge>
              </div>
              <p className="text-2xl font-bold text-slate-900">1,234</p>
              <p className="text-xs text-slate-500 mt-1">Active Users</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-xl hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50">New</Badge>
              </div>
              <p className="text-2xl font-bold text-slate-900">5</p>
              <p className="text-xs text-slate-500 mt-1">Pending Actions</p>
            </CardContent>
          </Card>
        </div>

        {/* Settings Categories */}
        <div className="space-y-8">
          {settingsCategories.map((category, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{category.title}</h3>
                  <p className="text-sm text-slate-500">{category.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {category.items.length} modules
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.items.map((feature) => (
                  <Link key={feature.href} href={feature.href} className="group">
                    <Card className="border-0 shadow-sm rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <feature.icon className="h-6 w-6" />
                          </div>
                          {feature.count && (
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                              {feature.count}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
                          {feature.title}
                        </h3>
                        
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                          {feature.desc}
                        </p>

                        <div className="flex items-center text-xs font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Configure
                          <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-lg rounded-xl mt-8">
          <CardHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Recent Configuration Changes</CardTitle>
                  <p className="text-sm text-slate-500">Latest updates to platform settings</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">Site Settings Updated</p>
                      <span className="text-xs text-slate-400">2 hours ago</span>
                    </div>
                    <p className="text-xs text-slate-500">Contact information and social links were modified by Admin</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Modified</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Missing imports
import { CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
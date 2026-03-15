'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Settings, Building2, Sparkles, BarChart3, MapPin, Grid3x3,
  ChevronRight, Globe, Users, Activity
} from 'lucide-react'

const settingsCategories = [
  {
    title: 'Platform',
    items: [
      { title: 'Site Settings', desc: 'Platform name, logo, colors, contact info, social links', icon: Globe, href: '/admin/settings/site', color: 'bg-blue-100 text-blue-600' },
      { title: 'Property Types', desc: 'Manage property categories (House, Apartment, Plot...)', icon: Building2, href: '/admin/settings/property-types', color: 'bg-emerald-100 text-emerald-600' },
      { title: 'Amenities', desc: 'Manage property amenities and features', icon: Sparkles, href: '/admin/settings/amenities', color: 'bg-purple-100 text-purple-600' },
    ]
  },
  {
    title: 'Locations & Projects',
    items: [
      { title: 'Areas', desc: 'Manage Karachi areas (DHA, Clifton, Bahria Town...)', icon: MapPin, href: '/admin/settings/areas', color: 'bg-teal-100 text-teal-600' },
      { title: 'Projects', desc: 'Manage housing projects and developments', icon: Grid3x3, href: '/admin/settings/projects', color: 'bg-cyan-100 text-cyan-600' },
      { title: 'Developers', desc: 'Manage real estate developers', icon: Building2, href: '/admin/settings/developers', color: 'bg-indigo-100 text-indigo-600' },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { title: 'Reports', desc: 'Analytics, data export and performance reports', icon: BarChart3, href: '/admin/settings/reports', color: 'bg-amber-100 text-amber-600' },
    ]
  },
]

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Settings & Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Configure your Karachi Estates platform</p>
        </div>

        <div className="space-y-8">
          {settingsCategories.map((cat, i) => (
            <div key={i}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{cat.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.items.map((item) => (
                  <Link key={item.href} href={item.href} className="group">
                    <Card className="border-0 shadow-sm rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <item.icon className="h-6 w-6" />
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, FileText, Users, Settings, Activity, 
  LogOut, ChevronLeft, Menu, Building2, Sparkles, Bell, 
  Image, BarChart3, MapPin, Grid3x3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [settings, setSettings] = useState({
    platform_name: 'Karachi Estates',
    tagline: 'Admin Panel',
    logo_url: '',
    primary_color: '#10b981',
    secondary_color: '#3b82f6',
  })

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  useEffect(() => {
    // Update content margin when sidebar collapses
    const content = document.getElementById('admin-content')
    if (content) {
      if (window.innerWidth >= 1024) {
        content.style.marginLeft = collapsed ? '80px' : '256px'
      }
    }
  }, [collapsed])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: FileText, label: 'Listings', href: '/admin/listings' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: Activity, label: 'Activity Logs', href: '/admin/logs' },
    { 
      icon: Settings, 
      label: 'Settings', 
      href: '/admin/settings',
      children: [
        { icon: Settings, label: 'Site Settings', href: '/admin/settings/site' },
        { icon: Building2, label: 'Property Types', href: '/admin/settings/property-types' },
        { icon: Sparkles, label: 'Amenities', href: '/admin/settings/amenities' },
        { icon: Bell, label: 'Notifications', href: '/admin/settings/notifications' },
        { icon: BarChart3, label: 'Reports', href: '/admin/settings/reports' },
        { icon: MapPin, label: 'Phases & Blocks', href: '/admin/settings/phases' },
      ]
    },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200 transition-all duration-300 z-40 ${
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {!collapsed ? (
            <Link href="/admin" className="flex items-center gap-2 group">
              {settings.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt={settings.platform_name} 
                  className="h-12 w-auto group-hover:scale-105 transition-transform" 
                />
              ) : (
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-md group-hover:shadow-lg transition-all group-hover:scale-105" 
                  style={{ background: `linear-gradient(to bottom right, ${settings.primary_color}, ${settings.secondary_color})` }}
                >
                  <Building2 className="h-6 w-6" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-900 leading-tight">{settings.platform_name}</span>
                <span className="text-[10px] text-slate-500">Admin Panel</span>
              </div>
            </Link>
          ) : (
            <Link href="/admin" className="flex items-center justify-center w-full group">
              {settings.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt={settings.platform_name} 
                  className="h-8 w-auto group-hover:scale-105 transition-transform" 
                />
              ) : (
                <div 
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-md group-hover:shadow-lg transition-all group-hover:scale-105" 
                  style={{ background: `linear-gradient(to bottom right, ${settings.primary_color}, ${settings.secondary_color})` }}
                >
                  <Building2 className="h-4 w-4" />
                </div>
              )}
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto" style={{ height: 'calc(100vh - 128px)' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href + '/'))
            const Icon = item.icon

            return (
              <div key={item.href}>
                <Link href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </div>
                </Link>

                {/* Sub-menu for Settings */}
                {item.children && !collapsed && pathname?.startsWith('/admin/settings') && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-slate-200 pl-3">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon
                      const isChildActive = pathname === child.href

                      return (
                        <Link key={child.href} href={child.href}>
                          <div
                            className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                              isChildActive
                                ? 'text-emerald-600 font-medium'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            <ChildIcon className="h-3.5 w-3.5" />
                            <span>{child.label}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200 bg-white space-y-1.5">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9 text-sm ${
                collapsed ? 'justify-center px-0' : ''
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="ml-2">User Panel</span>}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-9 text-sm ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  )
}

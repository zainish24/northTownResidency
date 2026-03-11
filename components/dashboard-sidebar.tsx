'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, User, Settings, LogOut,
  ChevronLeft, Menu, Building2, PlusCircle, Heart, MessageCircle,
  Bell, Star, Home, Store, BarChart3, HelpCircle, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userName, setUserName] = useState('User')
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    // Fetch user data
    const fetchUserData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        if (profile) setUserName(profile.full_name || 'User')
      }
    }
    
    // Fetch pending listings count
    const fetchPendingCount = async () => {
      const supabase = createClient()
      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      
      if (count) setPendingCount(count)
    }
    
    fetchUserData()
    fetchPendingCount()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/dashboard',
      exact: true 
    },
    { 
      icon: PlusCircle, 
      label: 'Add Listing', 
      href: '/dashboard/post' 
    },
    { 
      icon: FileText, 
      label: 'My Listings', 
      href: '/dashboard/listings',
      badge: pendingCount
    },
    { 
      icon: Heart, 
      label: 'Favorites', 
      href: '/dashboard/favorites' 
    },
    { 
      icon: MessageCircle, 
      label: 'Messages', 
      href: '/dashboard/messages',
      badge: 2
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      href: '/dashboard/notifications',
      badge: 3
    },
    { 
      icon: BarChart3, 
      label: 'Analytics', 
      href: '/dashboard/analytics' 
    },
    { 
      icon: User, 
      label: 'Profile', 
      href: '/dashboard/profile' 
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      href: '/dashboard/settings' 
    },
  ]

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname?.startsWith(href) ?? false
  }

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen(!mobileOpen)
    } else {
      setCollapsed(!collapsed)
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl w-12 h-12"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r border-slate-200 transition-all duration-300 z-40",
          collapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-slate-200 px-4",
          collapsed ? "lg:justify-center" : "lg:justify-between"
        )}>
          {!collapsed ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">NTR</span>
                </div>
                <span className="font-bold text-slate-900">Dashboard</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex h-8 w-8"
              >
                <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex h-8 w-8 mx-auto"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-16rem)]">
          {menuItems.map((item) => {
            const active = isActive(item.href, item.exact)
            const Icon = item.icon

            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setMobileOpen(false)}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative group",
                    active
                      ? "bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-600"
                      : "text-slate-600 hover:bg-slate-50",
                    collapsed && "lg:justify-center"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active && "text-emerald-600")} />
                  
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge className="bg-red-500 text-white text-xs px-1.5 min-w-[20px] h-5 flex items-center justify-center">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  
                  {collapsed && item.badge && item.badge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}

                  {/* Tooltip for collapsed mode */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      {item.label}
                      {item.badge ? ` (${item.badge})` : ''}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4",
          collapsed ? "lg:text-center" : ""
        )}>
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-gradient-to-br from-emerald-600 to-blue-600">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-blue-600 text-white">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">Free Plan</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-3 rounded-lg"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Avatar className="h-10 w-10 mx-auto bg-gradient-to-br from-emerald-600 to-blue-600">
                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-blue-600 text-white">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 mx-auto text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
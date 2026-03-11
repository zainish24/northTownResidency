'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { 
  Menu, X, User as UserIcon, LogOut, LayoutDashboard, Shield, 
  Home, Building2, PlusCircle, ChevronDown, Heart, Search,
  Store, MapPin, Bell
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [notificationModal, setNotificationModal] = useState(false)
  const [settings, setSettings] = useState({
    platform_name: 'NTR Properties',
    tagline: 'North Town Residency',
    logo_url: '',
    primary_color: '#10b981',
    secondary_color: '#3b82f6',
  })
  const [propertyTypes, setPropertyTypes] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    
    // Fetch site settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
      })
      .catch(err => console.error('Failed to load settings:', err))

    // Fetch active property types
    supabase
      .from('property_types')
      .select('id, name, slug, icon')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        if (data) setPropertyTypes(data)
      })
      .catch(err => console.error('Failed to load property types:', err))
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
        loadNotifications(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
        loadNotifications(session.user.id)
      } else {
        setProfile(null)
        setNotifications([])
        setUnreadCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) setProfile(data)
  }

  const loadNotifications = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('user_notifications')
      .select('*, notification:notifications(*)')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (data) {
      setNotifications(data)
      setUnreadCount(data.length)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user) return
    const supabase = createClient()
    await supabase
      .from('user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('notification_id', notificationId)
      .eq('user_id', user.id)
    
    loadNotifications(user.id)
  }

  const handleNotificationClick = (item: any) => {
    setSelectedNotification(item.notification)
    setNotificationModal(true)
    markAsRead(item.notification.id)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.platform_name} className="h-10 w-auto group-hover:scale-105 transition-transform" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105" style={{ background: `linear-gradient(to bottom right, ${settings.primary_color}, ${settings.secondary_color || '#3b82f6'})` }}>
                <Building2 className="h-5 w-5" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-base text-slate-900 leading-tight">{settings.platform_name}</span>
              <span className="text-[10px] text-slate-500">{settings.tagline}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
              Home
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild suppressHydrationWarning>
                <button className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all inline-flex items-center gap-1">
                  Properties
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/listings" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    All Properties
                  </Link>
                </DropdownMenuItem>
                {propertyTypes.map((type) => {
                  const Icon = type.slug === 'residential_plot' ? Home : 
                               type.slug === 'commercial_shop' ? Store : Building2
                  return (
                    <DropdownMenuItem key={type.id} asChild>
                      <Link href={`/listings?property_type=${type.slug}`} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.name}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/listings" className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
              <Search className="h-4 w-4" />
            </Link>

            {user && (
              <>
                <Link href="/dashboard/saved" className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                  <Heart className="h-4 w-4" />
                </Link>

                {/* Notifications Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild suppressHydrationWarning>
                    <button className="relative p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-0">
                          {unreadCount}
                        </Badge>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="px-3 py-2 border-b">
                      <p className="font-semibold text-sm">Notifications</p>
                      {unreadCount > 0 && (
                        <p className="text-xs text-slate-500">{unreadCount} unread</p>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-3 py-8 text-center text-sm text-slate-500">
                        No new notifications
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((item) => (
                          <div
                            key={item.id}
                            className="px-3 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                            onClick={() => handleNotificationClick(item)}
                          >
                            <p className="text-sm font-medium text-slate-900 line-clamp-1">
                              {item.notification.title}
                            </p>
                            <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                              {item.notification.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <div className="w-px h-4 bg-slate-200 mx-1"></div>

            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
              <Link href={user ? "/dashboard/post" : "/auth/login"}>
                <PlusCircle className="h-3 w-3 mr-1" />
                Post
              </Link>
            </Button>

            {!loading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild suppressHydrationWarning>
                  <button className="flex items-center gap-1 pl-2 pr-1 py-1 hover:bg-slate-100 rounded-lg transition-all">
                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="h-3 w-3 text-slate-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/saved" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Saved
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !loading && (
              <Button asChild variant="outline" size="sm" className="rounded-lg">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col gap-1">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-emerald-50">
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link href="/listings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-emerald-50">
                <Building2 className="h-4 w-4" />
                All Properties
              </Link>
              
              {user && (
                <>
                  <div className="h-px bg-slate-200 my-1"></div>
                  <Link href="/dashboard/post" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg">
                    <PlusCircle className="h-4 w-4" />
                    Post Property
                  </Link>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-emerald-50">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link href="/dashboard/saved" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-emerald-50">
                    <Heart className="h-4 w-4" />
                    Saved
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-purple-50">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  )}
                  <div className="h-px bg-slate-200 my-1"></div>
                  <button onClick={() => { setMobileMenuOpen(false); handleSignOut(); }} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-red-50 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              )}
              
              {!user && !loading && (
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <Dialog open={notificationModal} onOpenChange={setNotificationModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-600" />
              {selectedNotification?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4 py-4">
              {selectedNotification.image_url && (
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <img 
                    src={selectedNotification.image_url} 
                    alt={selectedNotification.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedNotification.message}</p>
              </div>

              {selectedNotification.link_url && (
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => {
                      window.location.href = selectedNotification.link_url
                      setNotificationModal(false)
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    View Details
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Settings, Save, Loader2, Facebook, Instagram, Phone, Mail, MessageSquare,
  Globe, Shield, Bell, Eye, EyeOff, Download, Upload, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Info, HelpCircle, Moon, Sun,
  Smartphone, Tablet, Laptop, Monitor, Zap, Clock, Calendar,
  Users, Building2, MapPin, Home, Store, Image as ImageIcon,
  FileText, Link2, Lock, Key, CreditCard, DollarSign, Percent,
  TrendingUp, BarChart3, PieChart, Activity, Award, Star,
  ChevronRight, ChevronLeft, Menu, X, Plus, Edit, Trash2,
  Linkedin, Youtube, Camera
} from 'lucide-react'
import { toast } from 'sonner'
import { DatabaseUsageTab } from '@/components/admin/database-usage-tab'
import { OTPUsageTab } from '@/components/admin/otp-usage-tab'

const SETTINGS_CATEGORIES = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'social', label: 'Social Media', icon: Facebook },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'seo', label: 'SEO', icon: TrendingUp },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'email', label: 'OTP/SMS', icon: Mail },
  { id: 'database', label: 'Usage', icon: BarChart3 },
]

export default function SiteSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [notificationCount, setNotificationCount] = useState(0)
  const [dbStats, setDbStats] = useState({
    listings: 0,
    users: 0,
    images: 0,
    storageUsed: 0,
    storageLimit: 1024, // 1GB in MB
    plan: 'Free',
    daysLeft: 30
  })
  const [dbSetup, setDbSetup] = useState({
    supabaseUrl: '',
    supabaseKey: '',
    connected: false,
    setupComplete: false,
    testing: false,
    settingUp: false
  })
  const [settings, setSettings] = useState({
    // General - map to database keys
    platform_name: 'Karachi Estates',
    tagline: 'Karachi Real Estate',
    logo_url: '/logo.png',
    favicon_url: '/favicon.ico',
    watermark_url: '',
    primary_color: '#10b981',
    secondary_color: '#3b82f6',
    timezone: 'Asia/Karachi',
    date_format: 'DD/MM/YYYY',
    
    // Contact
    contact_phone: '',
    contact_phone_2: '',
    contact_email: '',
    whatsapp_number: '',
    support_hours: '24/7',
    address: 'Karachi, Pakistan',
    map_url: '',
    
    // Social
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    youtube_url: '',
    
    // Content
    about_us: 'Karachi Estates is the premier platform for buying, selling, and renting properties in Karachi.',
    terms_conditions: '',
    privacy_policy: '',
    footer_text: `© ${new Date().getFullYear()} Karachi Estates. All rights reserved.`,
    
    // SEO
    meta_title: 'Karachi Estates - Karachi Real Estate',
    meta_description: 'Find residential plots, commercial shops, and properties in Karachi.',
    meta_keywords: 'Karachi property, real estate, plots for sale, commercial shops',
    google_analytics_id: '',
    google_site_verification: '',
    
    // Security
    enable_captcha: true,
    enable_2fa: false,
    session_timeout: 30,
    max_login_attempts: 5,
    
    // OTP/SMS
    sms_provider: 'mock',
    sms_api_key: '',
    sms_sender_id: 'KE',
    twilio_account_sid: '',
    twilio_auth_token: '',
    
    // Payment
    currency: 'PKR',
    tax_rate: 0,
    stripe_public_key: '',
    stripe_secret_key: '',
    easypaisa_enabled: true,
    jazzcash_enabled: true,
  })

  useEffect(() => {
    fetchSettings()
    loadNotificationCount()
    loadDatabaseStats()
  }, [])

  const loadNotificationCount = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    
    setNotificationCount(count || 0)
  }

  const loadDatabaseStats = async () => {
    const supabase = createClient()
    
    // Get counts
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
    
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    const { count: imagesCount } = await supabase
      .from('listing_images')
      .select('*', { count: 'exact', head: true })
    
    // Get storage usage (approximate)
    const { data: storageData } = await supabase.storage
      .from('property-images')
      .list()
    
    let totalSize = 0
    if (storageData) {
      storageData.forEach((file: any) => {
        totalSize += file.metadata?.size || 0
      })
    }
    
    setDbStats({
      listings: listingsCount || 0,
      users: usersCount || 0,
      images: imagesCount || 0,
      storageUsed: Math.round(totalSize / (1024 * 1024)), // Convert to MB
      storageLimit: 1024, // 1GB
      plan: 'Free',
      daysLeft: 30
    })
  }

  const fetchSettings = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value')

    if (data) {
      // Convert array to object
      const settingsObj: any = {}
      data.forEach(item => {
        settingsObj[item.setting_key] = item.setting_value || ''
      })
      setSettings(prev => ({ ...prev, ...settingsObj }))
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    
    try {
      // Update each setting individually
      const updates = Object.entries(settings).map(async ([key, value]) => {
        const { error } = await supabase
          .from('site_settings')
          .upsert({ 
            setting_key: key, 
            setting_value: String(value),
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            category: 'general'
          }, { onConflict: 'setting_key' })
        
        if (error) {
          console.error(`Error updating ${key}:`, error)
          throw error
        }
      })
      
      await Promise.all(updates)
      toast.success('Settings saved successfully')
      
      // Refresh to verify
      setTimeout(() => fetchSettings(), 500)
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message)
      console.error('Save error:', error)
    }
    setSaving(false)
  }



  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
          <div className="relative w-20 h-20 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-slate-600 font-medium">Loading settings...</p>
      </div>
    )
  }

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
                <h1 className="text-xl font-bold text-slate-900">Site Settings</h1>
                <p className="text-xs text-slate-500">Configure your platform preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
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
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Button 
            onClick={fetchSettings}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white gap-2 shadow-lg"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Settings Categories Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap">
            {SETTINGS_CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white px-4 py-2"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {cat.label}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-600" />
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Logo Upload */}
                <div>
                  <Label>Platform Logo</Label>
                  <div className="mt-2 flex items-center gap-6">
                    <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                      {settings.logo_url ? (
                        <img src={settings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Input 
                          type="file"
                          accept="image/*"
                          id="logo-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            
                            const supabase = createClient()
                            const fileName = `logo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`
                            
                            const { data, error } = await supabase.storage
                              .from('property-images')
                              .upload(`logos/${fileName}`, file)
                            
                            if (error) {
                              toast.error('Failed to upload logo')
                              return
                            }
                            
                            const { data: { publicUrl } } = supabase.storage
                              .from('property-images')
                              .getPublicUrl(`logos/${fileName}`)
                            
                            handleInputChange('logo_url', publicUrl)
                            toast.success('Logo uploaded successfully')
                          }}
                          className="hidden"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Logo File
                        </Button>
                      </div>
                      <Input 
                        value={settings.logo_url} 
                        onChange={(e) => handleInputChange('logo_url', e.target.value)}
                        placeholder="Or paste URL: https://example.com/logo.png"
                      />
                      <p className="text-xs text-slate-500">Recommended size: 200x50px</p>
                    </div>
                  </div>
                </div>

                {/* Favicon Upload */}
                <div>
                  <Label>Favicon (Browser Icon)</Label>
                  <div className="mt-2 flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                      {settings.favicon_url ? (
                        <img src={settings.favicon_url} alt="Favicon" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Input 
                          type="file"
                          accept="image/*"
                          id="favicon-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            
                            const supabase = createClient()
                            const fileName = `favicon-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`
                            
                            const { data, error } = await supabase.storage
                              .from('property-images')
                              .upload(`logos/${fileName}`, file)
                            
                            if (error) {
                              toast.error('Failed to upload favicon')
                              return
                            }
                            
                            const { data: { publicUrl } } = supabase.storage
                              .from('property-images')
                              .getPublicUrl(`logos/${fileName}`)
                            
                            handleInputChange('favicon_url', publicUrl)
                            toast.success('Favicon uploaded successfully')
                          }}
                          className="hidden"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => document.getElementById('favicon-upload')?.click()}
                          className="w-full border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Favicon File
                        </Button>
                      </div>
                      <Input 
                        value={settings.favicon_url} 
                        onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                        placeholder="Or paste URL: https://example.com/favicon.ico"
                      />
                      <p className="text-xs text-slate-500">Recommended size: 32x32px or 64x64px</p>
                    </div>
                  </div>
                </div>

                {/* Watermark Upload */}
                <div>
                  <Label>Watermark</Label>
                  <div className="mt-2 flex items-center gap-6">
                    <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                      {settings.watermark_url ? (
                        <img src={settings.watermark_url} alt="Watermark" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Input 
                          type="file"
                          accept="image/*"
                          id="watermark-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            
                            const supabase = createClient()
                            const fileName = `watermark-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`
                            
                            const { data, error } = await supabase.storage
                              .from('property-images')
                              .upload(`logos/${fileName}`, file)
                            
                            if (error) {
                              toast.error('Failed to upload watermark')
                              return
                            }
                            
                            const { data: { publicUrl } } = supabase.storage
                              .from('property-images')
                              .getPublicUrl(`logos/${fileName}`)
                            
                            handleInputChange('watermark_url', publicUrl)
                            toast.success('Watermark uploaded successfully')
                          }}
                          className="hidden"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => document.getElementById('watermark-upload')?.click()}
                          className="w-full border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Watermark File
                        </Button>
                      </div>
                      <Input 
                        value={settings.watermark_url} 
                        onChange={(e) => handleInputChange('watermark_url', e.target.value)}
                        placeholder="Or paste URL: https://example.com/watermark.png"
                      />
                      <p className="text-xs text-slate-500">Recommended: PNG with transparency</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Platform Name</Label>
                    <Input 
                      value={settings.platform_name} 
                      onChange={(e) => handleInputChange('platform_name', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Tagline</Label>
                    <Input 
                      value={settings.tagline} 
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={settings.primary_color} 
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      />
                      <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: settings.primary_color }} />
                    </div>
                  </div>
                  <div>
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={settings.secondary_color} 
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      />
                      <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: settings.secondary_color }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Timezone</Label>
                    <Input 
                      value={settings.timezone} 
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Date Format</Label>
                    <Input 
                      value={settings.date_format} 
                      onChange={(e) => handleInputChange('date_format', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Settings */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-emerald-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      Contact Phone
                    </Label>
                    <Input 
                      value={settings.contact_phone} 
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="+92 300 1234567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      Contact Phone 2 (Optional)
                    </Label>
                    <Input 
                      value={settings.contact_phone_2} 
                      onChange={(e) => handleInputChange('contact_phone_2', e.target.value)}
                      placeholder="+92 321 1234567"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      WhatsApp Number
                    </Label>
                    <Input 
                      value={settings.whatsapp_number} 
                      onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                      placeholder="+923001234567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-600" />
                      Contact Email
                    </Label>
                    <Input 
                      value={settings.contact_email} 
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="info@karachiestates.pk"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Office Address</Label>
                  <Textarea 
                    rows={2}
                    value={settings.address} 
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Karachi, Karachi"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Settings */}
          <TabsContent value="social" className="space-y-6">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-emerald-600" />
                  Social Media Links
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      Facebook URL
                    </Label>
                    <Input 
                      value={settings.facebook_url} 
                      onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                      placeholder="https://facebook.com/karachiestates"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      Instagram URL
                    </Label>
                    <Input 
                      value={settings.instagram_url} 
                      onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                      placeholder="https://instagram.com/karachiestates"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      X (Twitter) URL
                    </Label>
                    <Input 
                      value={settings.twitter_url} 
                      onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                      placeholder="https://twitter.com/karachiestates"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      LinkedIn URL
                    </Label>
                    <Input 
                      value={settings.linkedin_url} 
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/company/karachiestates"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-600" />
                    YouTube URL
                  </Label>
                  <Input 
                    value={settings.youtube_url} 
                    onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                    placeholder="https://youtube.com/@karachiestates"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Settings */}
          <TabsContent value="content" className="space-y-6">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Site Content
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label>About Us</Label>
                  <Textarea 
                    rows={6}
                    value={settings.about_us} 
                    onChange={(e) => handleInputChange('about_us', e.target.value)}
                    placeholder="Tell users about your platform..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Terms & Conditions</Label>
                  <Textarea 
                    rows={8}
                    value={settings.terms_conditions} 
                    onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                    placeholder="Enter terms and conditions..."
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div>
                  <Label>Privacy Policy</Label>
                  <Textarea 
                    rows={8}
                    value={settings.privacy_policy} 
                    onChange={(e) => handleInputChange('privacy_policy', e.target.value)}
                    placeholder="Enter privacy policy..."
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div>
                  <Label>Footer Text</Label>
                  <Input 
                    value={settings.footer_text} 
                    onChange={(e) => handleInputChange('footer_text', e.target.value)}
                    placeholder="© 2024 Karachi Estates. All rights reserved."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo" className="space-y-6">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  SEO & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input 
                    value={settings.meta_title} 
                    onChange={(e) => handleInputChange('meta_title', e.target.value)}
                    placeholder="Karachi Estates - Karachi Karachi"
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Recommended: 50-60 characters</p>
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <Textarea 
                    rows={3}
                    value={settings.meta_description} 
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    placeholder="Find residential plots, commercial shops, and properties in Karachi Karachi."
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Recommended: 150-160 characters</p>
                </div>

                <div>
                  <Label>Meta Keywords</Label>
                  <Input 
                    value={settings.meta_keywords} 
                    onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                    placeholder="Karachi, Karachi, Karachi property, real estate"
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Comma separated keywords</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Google Analytics ID</Label>
                    <Input 
                      value={settings.google_analytics_id} 
                      onChange={(e) => handleInputChange('google_analytics_id', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Google Site Verification</Label>
                    <Input 
                      value={settings.google_site_verification} 
                      onChange={(e) => handleInputChange('google_site_verification', e.target.value)}
                      placeholder="google-site-verification=..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  Security Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-slate-900">Enable CAPTCHA</p>
                      <p className="text-xs text-slate-500">Protect forms from spam</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.enable_captcha}
                    onCheckedChange={(checked) => handleInputChange('enable_captcha', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-slate-900">Enable Two-Factor Auth</p>
                      <p className="text-xs text-slate-500">Require 2FA for admin accounts</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.enable_2fa}
                    onCheckedChange={(checked) => handleInputChange('enable_2fa', checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Session Timeout (minutes)</Label>
                    <Input 
                      type="number"
                      value={settings.session_timeout} 
                      onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Max Login Attempts</Label>
                    <Input 
                      type="number"
                      value={settings.max_login_attempts} 
                      onChange={(e) => handleInputChange('max_login_attempts', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OTP/SMS Settings */}
          {/* OTP/SMS Usage Tab */}
          <TabsContent value="email" className="space-y-6">
            <OTPUsageTab />
          </TabsContent>

          {/* Payment Settings */}
          {/* Database Usage Tab */}
          <TabsContent value="database" className="space-y-6">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Database Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Listings Card */}
                  <div className="border border-slate-200 rounded-xl p-6 bg-gradient-to-br from-emerald-50 to-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Home className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Listings</p>
                          <p className="text-2xl font-bold text-slate-900">{dbStats.listings}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        (dbStats.listings / 100) * 100 >= 80 ? 'bg-red-100 text-red-700' :
                        (dbStats.listings / 100) * 100 >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {Math.round((dbStats.listings / 100) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          (dbStats.listings / 100) * 100 >= 80 ? 'bg-red-600' :
                          (dbStats.listings / 100) * 100 >= 50 ? 'bg-amber-600' :
                          'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min((dbStats.listings / 100) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Limit: 100 listings</p>
                  </div>

                  {/* Users Card */}
                  <div className="border border-slate-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Users</p>
                          <p className="text-2xl font-bold text-slate-900">{dbStats.users}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        (dbStats.users / 50) * 100 >= 80 ? 'bg-red-100 text-red-700' :
                        (dbStats.users / 50) * 100 >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {Math.round((dbStats.users / 50) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          (dbStats.users / 50) * 100 >= 80 ? 'bg-red-600' :
                          (dbStats.users / 50) * 100 >= 50 ? 'bg-amber-600' :
                          'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min((dbStats.users / 50) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Limit: 50 users</p>
                  </div>

                  {/* Images Card */}
                  <div className="border border-slate-200 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Camera className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Images</p>
                          <p className="text-2xl font-bold text-slate-900">{dbStats.images}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        (dbStats.images / 500) * 100 >= 80 ? 'bg-red-100 text-red-700' :
                        (dbStats.images / 500) * 100 >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {Math.round((dbStats.images / 500) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          (dbStats.images / 500) * 100 >= 80 ? 'bg-red-600' :
                          (dbStats.images / 500) * 100 >= 50 ? 'bg-amber-600' :
                          'bg-purple-600'
                        }`}
                        style={{ width: `${Math.min((dbStats.images / 500) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Limit: 500 images</p>
                  </div>

                  {/* Storage Card */}
                  <div className="border border-slate-200 rounded-xl p-6 bg-gradient-to-br from-amber-50 to-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Storage</p>
                          <p className="text-2xl font-bold text-slate-900">{dbStats.storageUsed} MB</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        (dbStats.storageUsed / dbStats.storageLimit) * 100 >= 80 ? 'bg-red-100 text-red-700' :
                        (dbStats.storageUsed / dbStats.storageLimit) * 100 >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {Math.round((dbStats.storageUsed / dbStats.storageLimit) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          (dbStats.storageUsed / dbStats.storageLimit) * 100 >= 80 ? 'bg-red-600' :
                          (dbStats.storageUsed / dbStats.storageLimit) * 100 >= 50 ? 'bg-amber-600' :
                          'bg-amber-600'
                        }`}
                        style={{ width: `${Math.min((dbStats.storageUsed / dbStats.storageLimit) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Limit: {dbStats.storageLimit} MB (1 GB)</p>
                  </div>
                </div>

                {(dbStats.listings >= 80 || dbStats.users >= 40 || dbStats.images >= 400 || dbStats.storageUsed >= dbStats.storageLimit * 0.8) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-900">
                        <p className="font-medium mb-1">Approaching Limits</p>
                        <p className="text-xs">You're using significant capacity. Contact support to upgrade your plan.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


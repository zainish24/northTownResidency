'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Building2, Phone, Mail, MapPin, Facebook, Twitter, 
  Instagram, Youtube, Linkedin, ArrowRight, Heart,
  Clock, Shield, Award, BadgeCheck, ChevronRight, Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function Footer() {
  const [settings, setSettings] = useState({
    platform_name: '',
    tagline: '',
    logo_url: '',
    contact_phone: '',
    contact_phone_2: '',
    contact_email: '',
    whatsapp_number: '',
    address: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    youtube_url: '',
    footer_text: '',
  })
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [phases, setPhases] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
        setSettingsLoaded(true)
      })
      .catch(err => { console.error('Failed to load settings:', err); setSettingsLoaded(true) })

    // Fetch phases
    const supabase = createClient()
    supabase
      .from('phases')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        if (data) setPhases(data)
      })
  }, [])
  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      {/* Main Footer - Compact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-3">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-2">
                {!settingsLoaded ? (
                  <>
                    <div className="h-10 w-10 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="flex flex-col gap-1">
                      <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                      <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse" />
                    </div>
                  </>
                ) : (
                  <>
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt={settings.platform_name} className="h-10 w-auto group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-blue-600 text-white shadow-lg group-hover:scale-105 transition-transform">
                        <Building2 className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-lg text-slate-900 block">{settings.platform_name || 'Karachi Estates'}</span>
                      <span className="text-[10px] text-slate-500">{settings.tagline || 'Karachi Real Estate'}</span>
                    </div>
                  </>
                )}
              </div>
            </Link>
            
            <p className="text-xs text-slate-600 leading-relaxed">
            Pakistan's trusted property marketplace in Karachi. Find verified residential & commercial properties.
            </p>

            {/* Trust Badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <BadgeCheck className="h-3 w-3 text-emerald-600" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Shield className="h-3 w-3 text-emerald-600" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Award className="h-3 w-3 text-emerald-600" />
                <span>Trusted</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 transition-all">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 transition-all">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {settings.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 transition-all">
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {settings.linkedin_url && (
                <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 transition-all">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {settings.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 transition-all">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-base">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'All Properties', href: '/listings' },
                { label: 'Residential Plots', href: '/listings?property_type=residential_plot' },
                { label: 'Commercial Shops', href: '/listings?property_type=commercial_shop' },
                { label: 'Post Property', href: '/dashboard/post' },
              ].map((link, i) => (
                <li key={i}>
                  <Link 
                    href={link.href}
                    className="text-xs text-slate-600 hover:text-emerald-600 hover:translate-x-1 inline-flex items-center gap-1 transition-all"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Phases */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-base">Browse by Phase</h4>
            <ul className="space-y-2">
              {phases.map((phase) => (
                <li key={phase.id}>
                  <Link 
                    href={`/listings?phase_id=${phase.id}`}
                    className="text-xs text-slate-600 hover:text-emerald-600 hover:translate-x-1 inline-flex items-center gap-1 transition-all"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {phase.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - Compact */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-base">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-3 w-3 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">{settings.address}</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-3 w-3 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">{settings.contact_phone}</p>
                  {settings.contact_phone_2 && (
                    <p className="text-xs text-slate-600 mt-1">{settings.contact_phone_2}</p>
                  )}
                </div>
              </li>
              {settings.whatsapp_number && (
                <li className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">{settings.whatsapp_number}</p>
                  </div>
                </li>
              )}
              <li className="flex items-start gap-2">
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-3 w-3 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">{settings.contact_email}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Compact */}
      <div className="border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-3 text-xs">
            <p className="text-slate-600">
              {settings.footer_text || `© ${new Date().getFullYear()} Karachi Estates. All rights reserved.`}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
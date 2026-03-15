'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MapPin, Home, Building2, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TABS = [
  { key: 'buy', label: 'Buy', purpose: 'sale' },
  { key: 'rent', label: 'Rent', purpose: 'rent' },
  { key: 'projects', label: 'New Projects', purpose: null },
]

export function HomeSearchBar() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('buy')
  const [areas, setAreas] = useState<any[]>([])
  const [propertyTypes, setPropertyTypes] = useState<any[]>([])
  const [areaId, setAreaId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [keyword, setKeyword] = useState('')
  const [isSticky, setIsSticky] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('areas').select('id,name,slug').eq('is_active', true).order('display_order').limit(20)
      .then(({ data }) => { if (data) setAreas(data) })
    supabase.from('property_types').select('id,name,slug').eq('is_active', true).order('display_order')
      .then(({ data }) => { if (data) setPropertyTypes(data) })
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (barRef.current) {
        const rect = barRef.current.getBoundingClientRect()
        setIsSticky(rect.top <= 64)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = () => {
    if (activeTab === 'projects') {
      const params = new URLSearchParams()
      if (areaId && areaId !== 'all') params.set('area_id', areaId)
      router.push(`/projects?${params.toString()}`)
      return
    }
    const tab = TABS.find(t => t.key === activeTab)
    const params = new URLSearchParams()
    if (tab?.purpose) params.set('purpose', tab.purpose)
    if (areaId && areaId !== 'all') params.set('area_id', areaId)
    if (typeId && typeId !== 'all') params.set('property_type_id', typeId)
    if (minPrice) params.set('min_price', minPrice)
    if (maxPrice) params.set('max_price', maxPrice)
    if (keyword) params.set('search', keyword)
    router.push(`/listings?${params.toString()}`)
  }

  return (
    <div ref={barRef} className="w-full max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 mb-0 justify-center">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
              activeTab === tab.key
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'bg-white/20 text-white/80 hover:bg-white/30 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Keyword */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={activeTab === 'projects' ? 'Search projects...' : 'Search by area, project, title...'}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-11 border-slate-200 rounded-xl text-sm"
            />
          </div>

          {/* Area */}
          <Select value={areaId || 'all'} onValueChange={v => setAreaId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-11 w-full sm:w-44 border-slate-200 rounded-xl text-sm">
              <MapPin className="h-4 w-4 text-slate-400 mr-1 shrink-0" />
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Property Type (not for projects tab) */}
          {activeTab !== 'projects' && (
            <Select value={typeId || 'all'} onValueChange={v => setTypeId(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-11 w-full sm:w-44 border-slate-200 rounded-xl text-sm">
                <Home className="h-4 w-4 text-slate-400 mr-1 shrink-0" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {propertyTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            className="h-11 px-8 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-semibold shadow-lg shrink-0"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Quick Price Filters (only for buy/rent) */}
        {activeTab !== 'projects' && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Quick:</span>
            {[
              { label: 'Under 50L', min: '', max: '5000000' },
              { label: '50L–1Cr', min: '5000000', max: '10000000' },
              { label: '1Cr–3Cr', min: '10000000', max: '30000000' },
              { label: '3Cr+', min: '30000000', max: '' },
            ].map(p => (
              <button
                key={p.label}
                onClick={() => { setMinPrice(p.min); setMaxPrice(p.max) }}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  minPrice === p.min && maxPrice === p.max
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600'
                }`}
              >
                {p.label}
              </button>
            ))}
            {(minPrice || maxPrice) && (
              <button onClick={() => { setMinPrice(''); setMaxPrice('') }} className="text-xs text-red-500 hover:underline ml-1">
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

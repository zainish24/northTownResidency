'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Search, Filter, ArrowDownUp, X, ChevronDown, Home, Store, MapPin, DollarSign, Ruler, Check, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function HomePageFilters() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [phase, setPhase] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [size, setSize] = useState('')
  const [showSort, setShowSort] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const sortRef = useRef<HTMLDivElement>(null)
  const [propertyTypes, setPropertyTypes] = useState<any[]>([])
  const [phases, setPhases] = useState<any[]>([])

  // Fetch property types and phases
  useEffect(() => {
    const supabase = createClient()
    
    supabase
      .from('property_types')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        if (data) setPropertyTypes(data)
      })

    supabase
      .from('phases')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        if (data) setPhases(data)
      })
  }, [])

  // Close sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSort(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (propertyType && propertyType !== 'all') params.set('property_type', propertyType)
    if (phase && phase !== 'all') params.set('phase_id', phase)
    
    // Price range handling
    if (priceRange) {
      switch(priceRange) {
        case 'under-50':
          params.set('max_price', '5000000')
          break
        case '50-1cr':
          params.set('min_price', '5000000')
          params.set('max_price', '10000000')
          break
        case '1cr-2cr':
          params.set('min_price', '10000000')
          params.set('max_price', '20000000')
          break
        case 'above-2cr':
          params.set('min_price', '20000000')
          break
      }
    }
    
    // Size handling
    if (size) {
      switch(size) {
        case '5-marla':
          params.set('plot_size_sqyd', '125')
          break
        case '10-marla':
          params.set('plot_size_sqyd', '250')
          break
        case '1-kanal':
          params.set('plot_size_sqyd', '500')
          break
        case '2-kanal':
          params.set('plot_size_sqyd', '1000')
          break
      }
    }
    
    // Sorting
    if (sortBy) {
      const [field, order] = sortBy.split('_')
      params.set('sort', order === 'desc' ? `-${field}` : field)
    }

    router.push(`/listings?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setPropertyType('')
    setPhase('')
    setPriceRange('')
    setSize('')
    setSortBy('newest')
  }

  const getActiveFilterCount = () => {
    return [searchTerm, propertyType, phase, priceRange, size].filter(Boolean).length
  }

  const activeFilterCount = getActiveFilterCount()

  const getFilterLabel = (value: string) => {
    const labels: Record<string, string> = {
      'residential_plot': 'Residential',
      'commercial_shop': 'Commercial',
      'farm_house': 'Farm House',
      'corner_plot': 'Corner Plot',
      'under-50': 'Under 50 Lacs',
      '50-1cr': '50 Lac - 1 Cr',
      '1cr-2cr': '1 Cr - 2 Cr',
      'above-2cr': 'Above 2 Cr',
      '5-marla': '5 Marla',
      '10-marla': '10 Marla',
      '1-kanal': '1 Kanal',
      '2-kanal': '2 Kanal',
    }
    return labels[value] || value
  }

  return (
    <div className="space-y-3">
      {/* Desktop Filters */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
            <input
              type="text"
              placeholder="Search by location, phase, or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Property Type */}
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="px-3 py-2.5 bg-slate-100 border-0 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 cursor-pointer hover:bg-slate-200 transition-colors min-w-[140px]"
        >
          <option value="">Property Type</option>
          {propertyTypes.map((type) => (
            <option key={type.id} value={type.slug}>{type.name}</option>
          ))}
        </select>

        {/* Phase */}
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value)}
          className="px-3 py-2.5 bg-slate-100 border-0 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 cursor-pointer hover:bg-slate-200 transition-colors min-w-[100px]"
        >
          <option value="">Phase</option>
          {phases.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Price Range */}
        <select
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className="px-3 py-2.5 bg-slate-100 border-0 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 cursor-pointer hover:bg-slate-200 transition-colors min-w-[130px]"
        >
          <option value="">Price Range</option>
          <option value="under-50">Under 50 Lacs</option>
          <option value="50-1cr">50 Lacs - 1 Cr</option>
          <option value="1cr-2cr">1 Cr - 2 Cr</option>
          <option value="above-2cr">Above 2 Cr</option>
        </select>

        {/* Size */}
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="px-3 py-2.5 bg-slate-100 border-0 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 cursor-pointer hover:bg-slate-200 transition-colors min-w-[110px]"
        >
          <option value="">Size</option>
          <option value="5-marla">5 Marla</option>
          <option value="10-marla">10 Marla</option>
          <option value="1-kanal">1 Kanal</option>
          <option value="2-kanal">2 Kanal</option>
        </select>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-lg px-5 py-2.5 h-auto shadow-md hover:shadow-lg transition-all group"
        >
          <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          Search
          {activeFilterCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{activeFilterCount}</span>
          )}
        </Button>

        {/* Sort Button */}
        <div className="relative" ref={sortRef}>
          <Button
            variant="outline"
            onClick={() => setShowSort(!showSort)}
            className="border-slate-200 hover:border-emerald-600 hover:text-emerald-600 rounded-lg px-3 py-2.5 h-auto"
          >
            <ArrowDownUp className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-sm">Sort</span>
            <ChevronDown className="h-3.5 w-3.5 ml-2" />
          </Button>

          {showSort && (
            <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
              {[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'price_asc', label: 'Price: Low to High' },
                { value: 'price_desc', label: 'Price: High to Low' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setSortBy(option.value); setShowSort(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                    sortBy === option.value ? 'text-emerald-600 font-medium' : 'text-slate-700'
                  }`}
                >
                  {option.label}
                  {sortBy === option.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-slate-500 hover:text-emerald-600 transition-colors underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Mobile Filters Bar */}
      <div className="md:hidden flex items-center gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="border-slate-200 rounded-lg px-3 py-2.5 h-auto relative"
        >
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        <Button
          onClick={handleSearch}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg px-4 py-2.5 h-auto"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Filters Panel */}
      {showMobileFilters && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Filters</h3>
            <button onClick={() => setShowMobileFilters(false)}>
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-4rem)]">
            {/* Property Type */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-100 border-0 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                {propertyTypes.map((type) => (
                  <option key={type.id} value={type.slug}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* Phase */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Phase</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-100 border-0 rounded-lg text-sm"
              >
                <option value="">All Phases</option>
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-100 border-0 rounded-lg text-sm"
              >
                <option value="">All Prices</option>
                <option value="under-50">Under 50 Lacs</option>
                <option value="50-1cr">50 Lacs - 1 Cr</option>
                <option value="1cr-2cr">1 Cr - 2 Cr</option>
                <option value="above-2cr">Above 2 Cr</option>
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-100 border-0 rounded-lg text-sm"
              >
                <option value="">All Sizes</option>
                <option value="5-marla">5 Marla</option>
                <option value="10-marla">10 Marla</option>
                <option value="1-kanal">1 Kanal</option>
                <option value="2-kanal">2 Kanal</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-100 border-0 rounded-lg text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1 border-slate-200"
              >
                Clear All
              </Button>
              <Button
                onClick={() => {
                  handleSearch()
                  setShowMobileFilters(false)
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Active:</span>
          
          {searchTerm && (
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs flex items-center gap-1">
              <Search className="h-3 w-3" />
              {searchTerm}
              <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-emerald-900">×</button>
            </span>
          )}
          
          {propertyType && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
              {propertyType === 'residential_plot' ? <Home className="h-3 w-3" /> : <Store className="h-3 w-3" />}
              {getFilterLabel(propertyType)}
              <button onClick={() => setPropertyType('')} className="ml-1 hover:text-blue-900">×</button>
            </span>
          )}
          
          {phase && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {phases.find(p => p.id === phase)?.name || `Phase ${phase}`}
              <button onClick={() => setPhase('')} className="ml-1 hover:text-purple-900">×</button>
            </span>
          )}
          
          {priceRange && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {getFilterLabel(priceRange)}
              <button onClick={() => setPriceRange('')} className="ml-1 hover:text-amber-900">×</button>
            </span>
          )}
          
          {size && (
            <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {getFilterLabel(size)}
              <button onClick={() => setSize('')} className="ml-1 hover:text-teal-900">×</button>
            </span>
          )}

          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-emerald-600 underline ml-auto"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
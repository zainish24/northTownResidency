'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import type { Phase, Block } from '@/lib/types'
import { 
  Filter, X, Search, MapPin, Home, Store, DollarSign, 
  CornerUpRight, Route, Trees, Sun, Hammer, ChevronDown,
  Sparkles, RotateCcw
} from 'lucide-react'
import { getIconComponent } from '@/lib/icon'

import type { Amenity } from '@/lib/types'

interface ListingsFiltersProps {
  phases: Phase[]
  blocks: Block[]
  amenities: Amenity[]
  propertyTypes?: any[]
}

export function ListingsFilters({ phases, blocks, amenities, propertyTypes = [] }: ListingsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(true)
  
  const [filters, setFilters] = useState<any>({
    phase_id: searchParams.get('phase_id') || '',
    block_id: searchParams.get('block_id') || '',
    property_type: searchParams.get('property_type') || '',
    listing_type: searchParams.get('listing_type') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    is_corner: searchParams.get('is_corner') === 'true',
    is_road_facing: searchParams.get('is_road_facing') === 'true',
    is_park_facing: searchParams.get('is_park_facing') === 'true',
    is_west_open: searchParams.get('is_west_open') === 'true',
    search: searchParams.get('search') || '',
  })

  // Filter blocks based on selected phase
  const filteredBlocks = filters.phase_id 
    ? blocks.filter(b => b.phase_id === filters.phase_id)
    : blocks

  // Update local state when URL params change
  useEffect(() => {
    setFilters({
      phase_id: searchParams.get('phase_id') || '',
      block_id: searchParams.get('block_id') || '',
      property_type: searchParams.get('property_type') || '',
      listing_type: searchParams.get('listing_type') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      is_corner: searchParams.get('is_corner') === 'true',
      is_road_facing: searchParams.get('is_road_facing') === 'true',
      is_park_facing: searchParams.get('is_park_facing') === 'true',
      is_west_open: searchParams.get('is_west_open') === 'true',
      search: searchParams.get('search') || '',
    })
  }, [searchParams])

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'amenities') {
        const arr: string[] = value || []
        if (arr.length) {
          params.set('amenities', arr.join(','))
        }
        return
      }
      if (value && value !== '' && value !== 'all' && value !== false) {
        params.set(key, String(value))
      }
    })

    router.push(`/listings?${params.toString()}`)
  }, [filters, router])

  const clearFilters = useCallback(() => {
    setFilters({
      phase_id: '',
      block_id: '',
      property_type: '',
      listing_type: '',
      min_price: '',
      max_price: '',
      is_corner: false,
      is_road_facing: false,
      is_park_facing: false,
      is_west_open: false,
      search: '',
    })
    router.push('/listings')
  }, [router])

  const hasFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search') return false
    return value && value !== '' && value !== false
  })

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'search') return false
      return value && value !== '' && value !== false
    }).length
  }

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden sticky top-24">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Filter className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Filters</h3>
            {hasFilters && (
              <p className="text-xs text-emerald-600">
                {getActiveFilterCount()} active filters
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                clearFilters()
              }}
              className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Filter Content */}
      {isOpen && (
        <CardContent className="p-5 space-y-5">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700 flex items-center gap-1">
              <Search className="h-3 w-3" />
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search properties..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9 h-9 text-sm rounded-lg border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters({ ...filters, search: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Location */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Location
            </h4>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Phase</Label>
                <Select
                  value={filters.phase_id || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, phase_id: value === 'all' ? '' : value, block_id: '' })}
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
                    <SelectValue placeholder="All Phases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Block</Label>
                <Select
                  value={filters.block_id || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, block_id: value === 'all' ? '' : value })}
                  disabled={!filters.phase_id}
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
                    <SelectValue placeholder={filters.phase_id ? "All Blocks" : "Select phase first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Blocks</SelectItem>
                    {filteredBlocks.map((block) => (
                      <SelectItem key={block.id} value={block.id}>
                        {block.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Property Type */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
              <Home className="h-4 w-4 text-emerald-600" />
              Property
            </h4>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Type</Label>
                <Select
                  value={filters.property_type || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, property_type: value === 'all' ? '' : value })}
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {propertyTypes.length > 0 ? (
                      propertyTypes.map((type) => {
                        const Icon = type.slug === 'residential_plot' ? Home : 
                                     type.slug === 'commercial_shop' ? Store : Building2
                        return (
                          <SelectItem key={type.id} value={type.slug}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-emerald-600" />
                              <span>{type.name}</span>
                            </div>
                          </SelectItem>
                        )
                      })
                    ) : (
                      <>
                        <SelectItem value="residential_plot">
                          <div className="flex items-center gap-2">
                            <Home className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Residential Plot</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="commercial_shop">
                          <div className="flex items-center gap-2">
                            <Store className="h-3.5 w-3.5 text-blue-600" />
                            <span>Commercial Shop</span>
                          </div>
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Listing Type</Label>
                <Select
                  value={filters.listing_type || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, listing_type: value === 'all' ? '' : value })}
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
                    <SelectValue placeholder="Sale or Rent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Listings</SelectItem>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Price Range */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Price Range
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Min (PKR)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.min_price}
                  onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                  className="h-9 text-sm rounded-lg border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Max (PKR)</Label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={filters.max_price}
                  onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                  className="h-9 text-sm rounded-lg border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Quick Price Options */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['50 Lacs', '1 Cr', '2 Cr', '5 Cr'].map((price) => (
                <button
                  key={price}
                  onClick={() => {
                    const value = price === '50 Lacs' ? '5000000' : 
                                 price === '1 Cr' ? '10000000' :
                                 price === '2 Cr' ? '20000000' : '50000000'
                    setFilters({ ...filters, min_price: value })
                  }}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  {price}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Position Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Position Features
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_corner"
                  checked={filters.is_corner}
                  onCheckedChange={(checked) => setFilters({ ...filters, is_corner: !!checked })}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <Label htmlFor="is_corner" className="text-xs font-normal cursor-pointer flex items-center gap-1">
                  <CornerUpRight className="h-3 w-3 text-slate-600" />
                  Corner Plot
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_road_facing"
                  checked={filters.is_road_facing}
                  onCheckedChange={(checked) => setFilters({ ...filters, is_road_facing: !!checked })}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <Label htmlFor="is_road_facing" className="text-xs font-normal cursor-pointer flex items-center gap-1">
                  <Route className="h-3 w-3 text-slate-600" />
                  Road Facing
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_park_facing"
                  checked={filters.is_park_facing}
                  onCheckedChange={(checked) => setFilters({ ...filters, is_park_facing: !!checked })}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <Label htmlFor="is_park_facing" className="text-xs font-normal cursor-pointer flex items-center gap-1">
                  <Trees className="h-3 w-3 text-slate-600" />
                  Park Facing
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_west_open"
                  checked={filters.is_west_open}
                  onCheckedChange={(checked) => setFilters({ ...filters, is_west_open: !!checked })}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <Label htmlFor="is_west_open" className="text-xs font-normal cursor-pointer flex items-center gap-1">
                  <Sun className="h-3 w-3 text-slate-600" />
                  West Open
                </Label>
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <Button 
            onClick={applyFilters} 
            className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-lg h-10 mt-2 shadow-md hover:shadow-lg transition-all"
          >
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
            {hasFilters && (
              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                {getActiveFilterCount()}
              </span>
            )}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
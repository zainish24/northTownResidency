'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import type { Area, Project, Amenity } from '@/lib/types'
import {
  Filter, X, Search, MapPin, Home, Building2, DollarSign,
  CornerUpRight, Route, Trees, Sun, Hammer, ChevronDown,
  Sparkles, RotateCcw, BedDouble
} from 'lucide-react'

interface ListingsFiltersProps {
  areas: Area[]
  projects: Project[]
  amenities: Amenity[]
  propertyTypes?: { id: string; name: string; slug: string }[]
}

function ListingsFiltersContent({ areas, projects, amenities, propertyTypes = [] }: ListingsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(true)

  const [filters, setFilters] = useState({
    area_id: searchParams.get('area_id') || '',
    project_id: searchParams.get('project_id') || '',
    property_type_id: searchParams.get('property_type_id') || '',
    purpose: searchParams.get('purpose') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    is_corner: searchParams.get('is_corner') === 'true',
    is_road_facing: searchParams.get('is_road_facing') === 'true',
    is_park_facing: searchParams.get('is_park_facing') === 'true',
    is_west_open: searchParams.get('is_west_open') === 'true',
    search: searchParams.get('search') || '',
  })

  const filteredProjects = filters.area_id
    ? projects.filter(p => p.area_id === filters.area_id)
    : projects

  useEffect(() => {
    setFilters({
      area_id: searchParams.get('area_id') || '',
      project_id: searchParams.get('project_id') || '',
      property_type_id: searchParams.get('property_type_id') || '',
      purpose: searchParams.get('purpose') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      bedrooms: searchParams.get('bedrooms') || '',
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
      if (typeof value === 'boolean') {
        if (value) params.set(key, 'true')
      } else if (value && value !== '') {
        params.set(key, value)
      }
    })
    router.push(`/listings?${params.toString()}`)
  }, [filters, router])

  const clearFilters = useCallback(() => {
    setFilters({
      area_id: '', project_id: '', property_type_id: '', purpose: '',
      min_price: '', max_price: '', bedrooms: '',
      is_corner: false, is_road_facing: false, is_park_facing: false, is_west_open: false,
      search: '',
    })
    router.push('/listings')
  }, [router])

  const activeCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return false
    if (typeof value === 'boolean') return value
    return value !== ''
  }).length

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden sticky top-24">
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
            {activeCount > 0 && <p className="text-xs text-emerald-600">{activeCount} active</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); clearFilters() }} className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <CardContent className="p-5 space-y-5">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700 flex items-center gap-1">
              <Search className="h-3 w-3" /> Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search properties..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9 h-9 text-sm rounded-lg border-slate-200"
              />
              {filters.search && (
                <button onClick={() => setFilters({ ...filters, search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Location */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
              <MapPin className="h-4 w-4 text-emerald-600" /> Location
            </h4>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Area</Label>
              <Select value={filters.area_id || 'all'} onValueChange={(v) => setFilters({ ...filters, area_id: v === 'all' ? '' : v, project_id: '' })}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200"><SelectValue placeholder="All Areas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Project</Label>
              <Select value={filters.project_id || 'all'} onValueChange={(v) => setFilters({ ...filters, project_id: v === 'all' ? '' : v })} disabled={!filters.area_id}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200"><SelectValue placeholder={filters.area_id ? 'All Projects' : 'Select area first'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {filteredProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Property */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
              <Home className="h-4 w-4 text-emerald-600" /> Property
            </h4>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Type</Label>
              <Select value={filters.property_type_id || 'all'} onValueChange={(v) => setFilters({ ...filters, property_type_id: v === 'all' ? '' : v })}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {propertyTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{t.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Purpose</Label>
              <Select value={filters.purpose || 'all'} onValueChange={(v) => setFilters({ ...filters, purpose: v === 'all' ? '' : v })}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200"><SelectValue placeholder="Sale or Rent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 flex items-center gap-1"><BedDouble className="h-3 w-3" /> Bedrooms</Label>
              <Select value={filters.bedrooms || 'all'} onValueChange={(v) => setFilters({ ...filters, bedrooms: v === 'all' ? '' : v })}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n}+ Beds</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Price Range */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-emerald-600" /> Price Range
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Min (PKR)</Label>
                <Input type="number" placeholder="0" value={filters.min_price} onChange={(e) => setFilters({ ...filters, min_price: e.target.value })} className="h-9 text-sm rounded-lg border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Max (PKR)</Label>
                <Input type="number" placeholder="Any" value={filters.max_price} onChange={(e) => setFilters({ ...filters, max_price: e.target.value })} className="h-9 text-sm rounded-lg border-slate-200" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[['50 Lacs', '5000000'], ['1 Cr', '10000000'], ['2 Cr', '20000000'], ['5 Cr', '50000000']].map(([label, value]) => (
                <button key={label} onClick={() => setFilters({ ...filters, min_price: value })} className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-emerald-600" /> Features
            </h4>
            <div className="space-y-2">
              {[
                { key: 'is_corner', label: 'Corner Plot', icon: CornerUpRight },
                { key: 'is_road_facing', label: 'Road Facing', icon: Route },
                { key: 'is_park_facing', label: 'Park Facing', icon: Trees },
                { key: 'is_west_open', label: 'West Open', icon: Sun },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={filters[key as keyof typeof filters] as boolean}
                    onCheckedChange={(checked) => setFilters({ ...filters, [key]: !!checked })}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <Label htmlFor={key} className="text-xs font-normal cursor-pointer flex items-center gap-1">
                    <Icon className="h-3 w-3 text-slate-600" /> {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={applyFilters} className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-lg h-10 mt-2">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
            {activeCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{activeCount}</span>}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

export function ListingsFilters({ areas, projects, amenities, propertyTypes = [] }: ListingsFiltersProps) {
  return (
    <Suspense fallback={<div className="border-0 shadow-lg rounded-xl overflow-hidden sticky top-24 h-96 bg-slate-50 animate-pulse" />}>
      <ListingsFiltersContent areas={areas} projects={projects} amenities={amenities} propertyTypes={propertyTypes} />
    </Suspense>
  )
}

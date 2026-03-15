'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, MapPin, Home, Store, Filter, ArrowRight } from 'lucide-react'
import type { Area, Project } from '@/lib/types'

interface HeroSearchProps {
  areas: Area[]
  projects: Project[]
  className?: string
}

export function HeroSearch({ areas, projects, className = '' }: HeroSearchProps) {
  const router = useRouter()
  const [areaId, setAreaId] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const [purpose, setPurpose] = useState<string>('')

  const filteredProjects = areaId
    ? projects.filter((p) => p.area_id === areaId)
    : projects

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (areaId && areaId !== 'all') params.set('area_id', areaId)
    if (projectId && projectId !== 'all') params.set('project_id', projectId)
    if (purpose && purpose !== 'all') params.set('purpose', purpose)
    router.push(`/listings?${params.toString()}`)
  }

  const clearFilters = () => {
    setAreaId('')
    setProjectId('')
    setPurpose('')
  }

  return (
    <Card className={`p-5 shadow-xl border-slate-200/80 bg-white/95 backdrop-blur rounded-xl ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Area */}
        <Select value={areaId} onValueChange={(v) => { setAreaId(v); setProjectId('') }}>
          <SelectTrigger className="h-12 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Select Area" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Project */}
        <Select value={projectId} onValueChange={setProjectId} disabled={!areaId}>
          <SelectTrigger className="h-12 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-slate-400" />
              <SelectValue placeholder={areaId ? 'Select Project' : 'Select Area First'} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {filteredProjects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Purpose */}
        <Select value={purpose} onValueChange={setPurpose}>
          <SelectTrigger className="h-12 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <SelectValue placeholder="For Sale/Rent" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Listings</SelectItem>
            <SelectItem value="sale">For Sale</SelectItem>
            <SelectItem value="rent">For Rent</SelectItem>
          </SelectContent>
        </Select>

        {/* Search Button */}
        <Button
          size="default"
          className="h-12 gap-2 w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all group"
          onClick={handleSearch}
        >
          <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />
          Search
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Active Filters */}
      {(areaId || projectId || purpose) && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">Active filters:</span>
          {areaId && areaId !== 'all' && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {areas.find(a => a.id === areaId)?.name}
              <button onClick={() => { setAreaId(''); setProjectId('') }} className="ml-1 hover:text-emerald-900">×</button>
            </span>
          )}
          {projectId && projectId !== 'all' && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
              {projects.find(p => p.id === projectId)?.name}
              <button onClick={() => setProjectId('')} className="ml-1 hover:text-blue-900">×</button>
            </span>
          )}
          {purpose && purpose !== 'all' && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
              {purpose === 'sale' ? 'For Sale' : 'For Rent'}
              <button onClick={() => setPurpose('')} className="ml-1 hover:text-amber-900">×</button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-emerald-600 underline ml-auto">
            Clear all
          </button>
        </div>
      )}
    </Card>
  )
}

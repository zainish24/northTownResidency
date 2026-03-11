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
import type { Phase, Block } from '@/lib/types'

interface HeroSearchProps {
  phases: Phase[]
  blocks: Block[]
  className?: string
}

export function HeroSearch({ phases, blocks, className = '' }: HeroSearchProps) {
  const router = useRouter()
  const [phaseId, setPhaseId] = useState<string>('')
  const [blockId, setBlockId] = useState<string>('')
  const [propertyType, setPropertyType] = useState<string>('')
  const [listingType, setListingType] = useState<string>('')

  const filteredBlocks = phaseId
    ? blocks.filter((block) => block.phase_id === phaseId)
    : blocks

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (phaseId && phaseId !== 'all') params.set('phase_id', phaseId)
    if (blockId && blockId !== 'all') params.set('block_id', blockId)
    if (propertyType && propertyType !== 'all') params.set('property_type', propertyType)
    if (listingType && listingType !== 'all') params.set('listing_type', listingType)
    
    router.push(`/listings?${params.toString()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setPhaseId('')
    setBlockId('')
    setPropertyType('')
    setListingType('')
  }

  return (
    <Card className={`p-5 shadow-xl border-slate-200/80 bg-white/95 backdrop-blur rounded-xl ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Phase */}
        <div className="relative">
          <Select value={phaseId} onValueChange={setPhaseId}>
            <SelectTrigger className="h-12 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Select Phase" />
              </div>
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

        {/* Block */}
        <div className="relative">
          <Select value={blockId} onValueChange={setBlockId} disabled={!phaseId}>
            <SelectTrigger className="h-12 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder={phaseId ? "Select Block" : "Select Phase First"} />
              </div>
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

        {/* Property Type */}
        <div className="relative">
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger className="h-12 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                {propertyType === 'residential_plot' ? (
                  <Home className="h-4 w-4 text-slate-400" />
                ) : propertyType === 'commercial_shop' ? (
                  <Store className="h-4 w-4 text-slate-400" />
                ) : (
                  <Filter className="h-4 w-4 text-slate-400" />
                )}
                <SelectValue placeholder="Property Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="residential_plot">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-emerald-600" />
                  <span>Residential Plot</span>
                </div>
              </SelectItem>
              <SelectItem value="commercial_shop">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-600" />
                  <span>Commercial Shop</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listing Type */}
        <div className="relative">
          <Select value={listingType} onValueChange={setListingType}>
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
        </div>

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

      {/* Active Filters Display */}
      {(phaseId || blockId || propertyType || listingType) && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">Active filters:</span>
          
          {phaseId && phaseId !== 'all' && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {phases.find(p => p.id === phaseId)?.name}
              <button onClick={() => setPhaseId('')} className="ml-1 hover:text-emerald-900">×</button>
            </span>
          )}
          
          {blockId && blockId !== 'all' && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {blocks.find(b => b.id === blockId)?.name}
              <button onClick={() => setBlockId('')} className="ml-1 hover:text-blue-900">×</button>
            </span>
          )}
          
          {propertyType && propertyType !== 'all' && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
              {propertyType === 'residential_plot' ? 'Residential' : 'Commercial'}
              <button onClick={() => setPropertyType('')} className="ml-1 hover:text-purple-900">×</button>
            </span>
          )}
          
          {listingType && listingType !== 'all' && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
              {listingType === 'sale' ? 'For Sale' : 'For Rent'}
              <button onClick={() => setListingType('')} className="ml-1 hover:text-amber-900">×</button>
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
    </Card>
  )
}
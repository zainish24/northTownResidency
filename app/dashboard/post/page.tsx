'use client'

// make sure phases, blocks, listings, listing_images tables have RLS disabled
// you can run the QUICK_FIX.sql script in Supabase SQL editor to disable row level security

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, ArrowRight, Upload, X, Sparkles, Building2, MapPin, Home, Store, Ruler, DollarSign, Camera, FileText, CheckCircle } from 'lucide-react'
import { getIconComponent } from '@/lib/icon'
import type { Phase, Block } from '@/lib/types'

export default function PostListingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditMode = !!editId
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [phases, setPhases] = useState<Phase[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [amenities, setAmenities] = useState<any[]>([])
  const [propertyTypes, setPropertyTypes] = useState<any[]>([])
  const [images, setImages] = useState<File[]>([])
  const [loadingPhases, setLoadingPhases] = useState(true)
  const [loadingBlocks, setLoadingBlocks] = useState(false)
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    phase_id: '',
    block_id: '',
    property_type: 'residential_plot' as 'residential_plot' | 'commercial_shop',
    listing_type: 'sale' as 'sale' | 'rent',
    plot_size_sqyd: '',
    shop_size_sqft: '',
    price: '',
    price_type: 'negotiable' as 'fixed' | 'negotiable',
    bedrooms: '',
    bathrooms: '',
    is_corner: false,
    is_road_facing: false,
    is_park_facing: false,
    is_west_open: false,
    has_construction: false,
    construction_status: 'empty' as 'empty' | 'under_construction' | 'completed',
    address_details: '',
    amenities: [] as string[],
  })

  // Load phases and amenities on mount
  useEffect(() => {
    const loadPhases = async () => {
      try {
        setLoadingPhases(true)
        const res = await fetch('/api/phases')
        const { phases, error } = await res.json()
        
        if (error) throw new Error(error)
        
        setPhases(phases)
      } catch (err: any) {
        console.error('Error:', err)
        toast({ title: 'Error', description: err.message, variant: 'destructive' })
      } finally {
        setLoadingPhases(false)
      }
    }
    
    const loadAmenities = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('amenities')
        .select('id,slug,name,icon')
        .eq('is_active', true)
        .order('display_order')
      if (data) setAmenities(data)
    }
    
    const loadPropertyTypes = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('property_types')
        .select('id,name,slug,icon')
        .eq('is_active', true)
        .order('display_order')
      if (data) setPropertyTypes(data)
    }
    
    loadPhases()
    loadAmenities()
    loadPropertyTypes()
  }, [])

  // Load listing data if in edit mode
  useEffect(() => {
    if (!isEditMode || !editId) return
    
    const loadListing = async () => {
      try {
        const supabase = createClient()
        const { data: listing, error } = await supabase
          .from('listings')
          .select(`*, listing_amenities(amenity_id)`) // need ids to pre-check
          .eq('id', editId)
          .single()
        
        if (error) throw error
        
        setForm({
          title: listing.title || '',
          description: listing.description || '',
          phase_id: listing.phase_id || '',
          block_id: listing.block_id || '',
          property_type: listing.property_type,
          listing_type: listing.listing_type,
          plot_size_sqyd: listing.plot_size_sqyd?.toString() || '',
          shop_size_sqft: listing.shop_size_sqft?.toString() || '',
          price: listing.price?.toString() || '',
          price_type: listing.price_type,
          bedrooms: listing.bedrooms?.toString() || '',
          bathrooms: listing.bathrooms?.toString() || '',
          is_corner: listing.is_corner || false,
          is_road_facing: listing.is_road_facing || false,
          is_park_facing: listing.is_park_facing || false,
          is_west_open: listing.is_west_open || false,
          has_construction: listing.has_construction || false,
          construction_status: listing.construction_status,
          address_details: listing.address_details || '',
          amenities: listing.listing_amenities ? listing.listing_amenities.map((la: any) => la.amenity_id) : []
        })
        
        if (listing.phase_id) {
          loadBlocks(listing.phase_id)
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' })
      }
    }
    loadListing()
  }, [isEditMode, editId])

  const loadBlocks = async (phaseId: string) => {
    try {
      setLoadingBlocks(true)
      setBlocks([])
      const res = await fetch(`/api/blocks?phase_id=${phaseId}`)
      const { blocks, error } = await res.json()
      
      if (error) throw new Error(error)
      
      setBlocks(blocks)
    } catch (err: any) {
      console.error('Error:', err)
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoadingBlocks(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).slice(0, 10 - images.length)
      setImages([...images, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    console.log('Submit clicked')
    console.log('Form data:', form)
    
    // Validation
    if (!form.title) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' })
      return
    }
    
    if (!form.description) {
      toast({ title: 'Error', description: 'Description is required', variant: 'destructive' })
      return
    }
    
    if (!form.price) {
      toast({ title: 'Error', description: 'Price is required', variant: 'destructive' })
      return
    }
    
    if (form.property_type === 'residential_plot' && !form.plot_size_sqyd) {
      toast({ title: 'Error', description: 'Plot size is required', variant: 'destructive' })
      return
    }
    
    if (form.property_type === 'commercial_shop' && !form.shop_size_sqft) {
      toast({ title: 'Error', description: 'Shop size is required', variant: 'destructive' })
      return
    }
    
    console.log('Validation passed')
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Get authenticated user (with fallback for testing)
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || '11111111-1111-1111-1111-111111111111'
      
      console.log('Post - User ID:', userId)
      console.log('Post - User object:', user)

      const listingData: any = {
        user_id: userId,
        title: form.title,
        description: form.description,
        phase_id: (form.phase_id && form.phase_id !== 'skip') ? form.phase_id : null,
        block_id: (form.block_id && form.block_id !== 'skip') ? form.block_id : null,
        property_type: form.property_type,
        listing_type: form.listing_type,
        plot_size_sqyd: form.property_type === 'residential_plot' ? parseFloat(form.plot_size_sqyd) : null,
        shop_size_sqft: form.property_type === 'commercial_shop' ? parseFloat(form.shop_size_sqft) : null,
        price: parseFloat(form.price),
        price_type: form.price_type,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        is_corner: form.is_corner,
        is_road_facing: form.is_road_facing,
        is_park_facing: form.is_park_facing,
        is_west_open: form.is_west_open,
        has_construction: form.has_construction,
        construction_status: form.construction_status,
        address_details: form.address_details,
        status: 'approved',
        views_count: 0,
        is_featured: false,
      }

      // send amenity_ids separately if creating / update when needed
      if (isEditMode && editId) {
        // update existing listing
        const { error } = await supabase
          .from('listings')
          .update(listingData)
          .eq('id', editId)
        if (error) throw error

        // sync amenities
        if (Array.isArray(form.amenities)) {
          await supabase
            .from('listing_amenities')
            .delete()
            .eq('listing_id', editId)

          if (form.amenities.length) {
            const rows = form.amenities.map((id: string) => ({ listing_id: editId, amenity_id: id }))
            await supabase.from('listing_amenities').insert(rows)
          }
        }

        toast({ title: 'Success', description: 'Listing updated successfully!' })
      } else {
        // Create new listing
        const { data: listing, error } = await supabase
          .from('listings')
          .insert(listingData)
          .select()
          .single()

        if (error) throw error

        // Insert amenities
        if (Array.isArray(form.amenities) && form.amenities.length > 0) {
          const rows = form.amenities.map((id: string) => ({ listing_id: listing.id, amenity_id: id }))
          await supabase.from('listing_amenities').insert(rows)
        }

        toast({ title: 'Success', description: 'Listing created successfully!' })

        // Upload images in background
        if (images.length > 0) {
          const formData = new FormData()
          formData.append('listing_id', listing.id)
          formData.append('user_id', userId)
          images.forEach(img => formData.append('images', img))

          fetch('/api/upload-images', {
            method: 'POST',
            body: formData
          }).catch(err => console.error('Image upload error:', err))
        }
      }

      router.push('/dashboard')
    } catch (error: any) {
      console.error('Submit error:', error)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Step titles and icons
  const steps = [
    { number: 1, title: 'Location', icon: MapPin },
    { number: 2, title: 'Size & Price', icon: Ruler },
    { number: 3, title: 'Description', icon: FileText },
    { number: 4, title: 'Images', icon: Camera },
  ]

  return (
    <>
      {/* Hero Section - Exactly like Listings Page */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden w-full -mt-8">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=600&fit=crop"
            alt="Post Listing"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80" />

          {/* Animated Overlay - 3 blobs */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full z-10">
          <div className="max-w-4xl mx-auto text-center space-y-5">
            {/* Badge with step info */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg">
              <Upload className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-medium text-white">Step {step} of 4</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {isEditMode ? 'Edit' : 'Post New'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Listing</span>
            </h1>

            {/* Quick Stats - Like Listings Page */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-1.5 text-white/90 text-sm">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>Location Details</span>
              </div>
              <div className="w-1 h-1 bg-white/30 rounded-full" />
              <div className="flex items-center gap-1.5 text-white/90 text-sm">
                <Ruler className="h-4 w-4 text-emerald-400" />
                <span>Size & Price</span>
              </div>
              <div className="w-1 h-1 bg-white/30 rounded-full" />
              <div className="flex items-center gap-1.5 text-white/90 text-sm">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>Description</span>
              </div>
              <div className="w-1 h-1 bg-white/30 rounded-full" />
              <div className="flex items-center gap-1.5 text-white/90 text-sm">
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>Images</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-10 relative z-30">
        <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                step >= s.number 
                  ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className={`text-xs mt-1 font-medium ${
                step >= s.number ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-2 h-1 bg-slate-200 rounded-full">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        </div>
      </div>

      {/* Rest of your form code... */}
      <div className="max-w-3xl mx-auto space-y-4 pb-8">
        {step === 1 && (
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Phase</Label>
                <Select value={form.phase_id} onValueChange={(v) => {
                  setForm({ ...form, phase_id: v, block_id: '' })
                  setBlocks([])
                  if (v && v !== 'skip') {
                    loadBlocks(v)
                  }
                }} disabled={loadingPhases}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select phase or skip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip - Will add later</SelectItem>
                    {phases.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Block</Label>
                <Select value={form.block_id} onValueChange={(v) => {
                  setForm({ ...form, block_id: v })
                }} disabled={!form.phase_id || form.phase_id === 'skip' || loadingBlocks}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select block or skip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip - Will add later</SelectItem>
                    {blocks.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!form.phase_id || form.phase_id === 'skip') && (
                  <p className="text-xs text-slate-500 mt-1">Select a phase first</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Property Type</Label>
                  <Select value={form.property_type} onValueChange={(v: any) => setForm({ ...form, property_type: v })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.length > 0 ? (
                        propertyTypes.map((type) => (
                          <SelectItem key={type.id} value={type.slug}>{type.name}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="residential_plot">Residential Plot</SelectItem>
                          <SelectItem value="commercial_shop">Commercial Shop</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Listing Type</Label>
                  <Select value={form.listing_type} onValueChange={(v: any) => setForm({ ...form, listing_type: v })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps 2-4 remain the same... */}
        {step === 2 && (
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ruler className="h-5 w-5 text-emerald-600" />
                Size & Price
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {form.property_type === 'residential_plot' ? (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium mb-1.5 block">Plot Size (Sq Yards)</Label>
                    <Input type="number" value={form.plot_size_sqyd} onChange={(e) => setForm({ ...form, plot_size_sqyd: e.target.value })} placeholder="e.g., 120" className="rounded-lg" />
                  </div>
                ) : (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium mb-1.5 block">Shop Size (Sq Ft)</Label>
                    <Input type="number" value={form.shop_size_sqft} onChange={(e) => setForm({ ...form, shop_size_sqft: e.target.value })} placeholder="e.g., 80" className="rounded-lg" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <Label className="text-sm font-medium mb-1.5 block">Price (PKR)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g., 5000000" className="rounded-lg" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <Label className="text-sm font-medium mb-1.5 block">Price Type</Label>
                  <Select value={form.price_type} onValueChange={(v: any) => setForm({ ...form, price_type: v })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="negotiable">Negotiable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium block">Position Features</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.is_corner} onCheckedChange={(c) => setForm({ ...form, is_corner: !!c })} />
                    <label className="text-sm">Corner Plot</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.is_road_facing} onCheckedChange={(c) => setForm({ ...form, is_road_facing: !!c })} />
                    <label className="text-sm">Road Facing</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.is_park_facing} onCheckedChange={(c) => setForm({ ...form, is_park_facing: !!c })} />
                    <label className="text-sm">Park Facing</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.is_west_open} onCheckedChange={(c) => setForm({ ...form, is_west_open: !!c })} />
                    <label className="text-sm">West Open</label>
                  </div>
                </div>
              </div>

              {/* dynamic amenities */}
              {amenities.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium block">Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenities.map((a) => {
                      const Icon = getIconComponent(a.icon)
                      const checked = form.amenities.includes(a.id)
                      return (
                        <div key={a.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              const arr: string[] = form.amenities || []
                              if (c) setForm({ ...form, amenities: [...arr, a.id] })
                              else setForm({ ...form, amenities: arr.filter(id => id !== a.id) })
                            }}
                          />
                          <Icon className="h-4 w-4" />
                          <label className="text-sm">{a.name}</label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Description & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., 120 Sq Yd Corner Plot" className="rounded-lg" />
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Describe your property..." className="rounded-lg" />
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Address Details (Optional)</Label>
                <Input value={form.address_details} onChange={(e) => setForm({ ...form, address_details: e.target.value })} placeholder="e.g., Near main gate" className="rounded-lg" />
              </div>

              {form.property_type === 'residential_plot' && (
                <>
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox checked={form.has_construction} onCheckedChange={(c) => setForm({ ...form, has_construction: !!c })} />
                    <label className="text-sm font-medium">Has Construction</label>
                  </div>

                  {form.has_construction && (
                    <div className="space-y-4 pt-2 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium mb-1.5 block">Bedrooms</Label>
                          <Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className="rounded-lg" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-1.5 block">Bathrooms</Label>
                          <Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className="rounded-lg" />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Construction Status</Label>
                        <Select value={form.construction_status} onValueChange={(v: any) => setForm({ ...form, construction_status: v })}>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="empty">Empty</SelectItem>
                            <SelectItem value="under_construction">Under Construction</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-emerald-600" />
                Upload Images (Max 10)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(img)} alt="" className="w-full aspect-square object-cover rounded-lg border border-slate-200" />
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="absolute top-1 right-1 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {images.length < 10 && (
                  <label className="border-2 border-dashed border-slate-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-emerald-600 hover:bg-emerald-50 transition-colors group">
                    <Upload className="h-6 w-6 text-slate-400 group-hover:text-emerald-600 mb-1" />
                    <span className="text-xs text-slate-500 group-hover:text-emerald-600">Upload</span>
                    <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              
              <p className="text-xs text-slate-500 mt-3">
                {images.length}/10 images uploaded. You can upload up to 10 images.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1} 
            className="rounded-lg px-5 py-5 text-sm border-slate-200 hover:border-emerald-600 hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {step < 4 ? (
            <Button 
              onClick={() => setStep(step + 1)} 
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-lg px-6 py-5 text-sm shadow-lg"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-lg px-6 py-5 text-sm shadow-lg"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Listing' : 'Submit Listing')}
              {!loading && <CheckCircle className="h-4 w-4 ml-2" />}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
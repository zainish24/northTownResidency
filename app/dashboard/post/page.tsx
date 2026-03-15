'use client'

import { useState, useEffect, Suspense } from 'react'
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
import { ArrowLeft, ArrowRight, Upload, X, MapPin, Ruler, FileText, Camera, CheckCircle, AlertCircle } from 'lucide-react'
import { getIconComponent } from '@/lib/icon'

function PostListingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditMode = !!editId
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [areas, setAreas] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [propertyTypes, setPropertyTypes] = useState<any[]>([])
  const [amenities, setAmenities] = useState<any[]>([])
  const [images, setImages] = useState<File[]>([])
  const [validationMsg, setValidationMsg] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    area_id: '',
    project_id: '',
    address: '',
    property_type_id: '',
    purpose: 'sale' as 'sale' | 'rent',
    area_size: '',
    area_unit: 'sqyd' as 'sqft' | 'sqyd' | 'marla' | 'kanal',
    price: '',
    price_type: 'negotiable' as 'fixed' | 'negotiable',
    bedrooms: '',
    bathrooms: '',
    floors: '',
    is_corner: false,
    is_road_facing: false,
    is_park_facing: false,
    is_west_open: false,
    construction_status: 'empty' as 'empty' | 'under_construction' | 'completed',
    amenity_ids: [] as string[],
  })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      fetch('/api/areas').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/property-types').then(r => r.json()),
      supabase.from('amenities').select('id,slug,name,icon').eq('is_active', true).order('display_order'),
    ]).then(([areasRes, projectsRes, typesRes, amenitiesRes]) => {
      if (areasRes.data) setAreas(areasRes.data)
      if (projectsRes.data) { setAllProjects(projectsRes.data); setProjects(projectsRes.data) }
      if (typesRes.data) setPropertyTypes(typesRes.data)
      if (amenitiesRes.data) setAmenities(amenitiesRes.data)
    })
  }, [])

  useEffect(() => {
    if (form.area_id) {
      setProjects(allProjects.filter((p: any) => p.area_id === form.area_id))
    } else {
      setProjects(allProjects)
    }
    setForm(f => ({ ...f, project_id: '' }))
  }, [form.area_id, allProjects])

  useEffect(() => {
    if (!isEditMode || !editId) return
    const supabase = createClient()
    supabase.from('listings').select('*, listing_amenities(amenity_id)').eq('id', editId).single()
      .then(({ data: listing, error }) => {
        if (error || !listing) return
        setForm({
          title: listing.title || '',
          description: listing.description || '',
          area_id: listing.area_id || '',
          project_id: listing.project_id || '',
          address: listing.address || '',
          property_type_id: listing.property_type_id || '',
          purpose: listing.purpose || 'sale',
          area_size: listing.area_size?.toString() || '',
          area_unit: listing.area_unit || 'sqyd',
          price: listing.price?.toString() || '',
          price_type: listing.price_type || 'negotiable',
          bedrooms: listing.bedrooms?.toString() || '',
          bathrooms: listing.bathrooms?.toString() || '',
          floors: listing.floors?.toString() || '',
          is_corner: listing.is_corner || false,
          is_road_facing: listing.is_road_facing || false,
          is_park_facing: listing.is_park_facing || false,
          is_west_open: listing.is_west_open || false,
          construction_status: listing.construction_status || 'empty',
          amenity_ids: listing.listing_amenities?.map((la: any) => la.amenity_id) || [],
        })
      })
  }, [isEditMode, editId])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files!).slice(0, 10 - prev.length)])
    }
  }

  const validate = (s: number) => {
    if (s === 1) {
      if (!form.area_id) return 'Please select an area.'
      if (!form.property_type_id) return 'Please select a property type.'
    }
    if (s === 2) {
      if (!form.price) return 'Please enter the price.'
    }
    if (s === 3) {
      if (!form.title) return 'Please enter a title.'
      if (!form.description) return 'Please enter a description.'
    }
    return ''
  }

  const handleSubmit = async () => {
    const err = validate(3)
    if (err) { setValidationMsg(err); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const listingData: any = {
        user_id: user.id,
        title: form.title,
        description: form.description,
        area_id: form.area_id || null,
        project_id: form.project_id || null,
        address: form.address || null,
        property_type_id: form.property_type_id || null,
        purpose: form.purpose,
        area_size: form.area_size ? parseFloat(form.area_size) : null,
        area_unit: form.area_unit,
        price: parseFloat(form.price),
        price_type: form.price_type,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        floors: form.floors ? parseInt(form.floors) : null,
        is_corner: form.is_corner,
        is_road_facing: form.is_road_facing,
        is_park_facing: form.is_park_facing,
        is_west_open: form.is_west_open,
        construction_status: form.construction_status,
        status: 'pending',
      }

      if (isEditMode && editId) {
        const { error } = await supabase.from('listings').update(listingData).eq('id', editId)
        if (error) throw error
        await supabase.from('listing_amenities').delete().eq('listing_id', editId)
        if (form.amenity_ids.length) {
          await supabase.from('listing_amenities').insert(form.amenity_ids.map(id => ({ listing_id: editId, amenity_id: id })))
        }
        toast({ title: 'Success', description: 'Listing updated!' })
      } else {
        const { data: listing, error } = await supabase.from('listings').insert(listingData).select().single()
        if (error) throw error
        if (form.amenity_ids.length) {
          await supabase.from('listing_amenities').insert(form.amenity_ids.map(id => ({ listing_id: listing.id, amenity_id: id })))
        }
        if (images.length > 0) {
          const fd = new FormData()
          fd.append('listing_id', listing.id)
          fd.append('user_id', user.id)
          images.forEach(img => fd.append('images', img))
          fetch('/api/upload-images', { method: 'POST', body: fd }).catch(() => {})
        }
        toast({ title: 'Success', description: 'Listing submitted for review!' })
      }
      router.push('/dashboard')
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Location', icon: MapPin },
    { number: 2, title: 'Size & Price', icon: Ruler },
    { number: 3, title: 'Description', icon: FileText },
    { number: 4, title: 'Images', icon: Camera },
  ]

  return (
    <>
      {/* Validation Modal */}
      {validationMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-blue-600 p-6 flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-xl"><AlertCircle className="h-7 w-7 text-white" /></div>
              <div><h3 className="text-xl font-bold text-white">Required Field</h3><p className="text-emerald-50 text-sm">Please complete this field to continue</p></div>
            </div>
            <div className="p-6"><p className="text-slate-700">{validationMsg}</p></div>
            <div className="bg-white border-t border-slate-100 px-6 py-4 flex justify-end">
              <Button onClick={() => setValidationMsg('')} className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-8 rounded-lg">Got it</Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden w-full -mt-8">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=600&fit=crop" alt="Post Listing" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg mb-4">
            <Upload className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-medium text-white">Step {step} of 4</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            {isEditMode ? 'Edit' : 'Post New'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Listing</span>
          </h1>
        </div>
      </section>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-4 py-8 -mt-10 relative z-30">
        <div className="flex items-center justify-between mb-2">
          {steps.map(s => (
            <div key={s.number} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step >= s.number ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className={`text-xs mt-1 font-medium ${step >= s.number ? 'text-emerald-600' : 'text-slate-400'}`}>{s.title}</span>
            </div>
          ))}
        </div>
        <div className="relative h-1 bg-slate-200 rounded-full">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-4 pb-8">
        {/* Step 1: Location */}
        {step === 1 && (
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-600" />Location Details</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Purpose <span className="text-red-500">*</span></Label>
                  <Select value={form.purpose} onValueChange={(v: any) => setForm({ ...form, purpose: v })}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Property Type <span className="text-red-500">*</span></Label>
                  <Select value={form.property_type_id} onValueChange={v => setForm({ ...form, property_type_id: v })}>
                    <SelectTrigger className={`rounded-lg ${!form.property_type_id ? 'border-red-300' : ''}`}><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Area <span className="text-red-500">*</span></Label>
                <Select value={form.area_id} onValueChange={v => setForm({ ...form, area_id: v })}>
                  <SelectTrigger className={`rounded-lg ${!form.area_id ? 'border-red-300' : ''}`}><SelectValue placeholder="Select area" /></SelectTrigger>
                  <SelectContent>
                    {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Project <span className="text-slate-400 font-normal">(Optional)</span></Label>
                <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })} disabled={!form.area_id}>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder={form.area_id ? 'Select project' : 'Select area first'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific project</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Address / Street <span className="text-slate-400 font-normal">(Optional)</span></Label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="e.g., Street 5, Block A" className="rounded-lg" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Size & Price */}
        {step === 2 && (
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><Ruler className="h-5 w-5 text-emerald-600" />Size & Price</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Size</Label>
                  <Input type="number" value={form.area_size} onChange={e => setForm({ ...form, area_size: e.target.value })} placeholder="e.g., 120" className="rounded-lg" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Unit</Label>
                  <Select value={form.area_unit} onValueChange={(v: any) => setForm({ ...form, area_unit: v })}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sqft">Sq. Ft</SelectItem>
                      <SelectItem value="sqyd">Sq. Yd</SelectItem>
                      <SelectItem value="marla">Marla</SelectItem>
                      <SelectItem value="kanal">Kanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Price (PKR) <span className="text-red-500">*</span></Label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g., 5000000" className={`rounded-lg ${!form.price ? 'border-red-300' : ''}`} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Price Type</Label>
                  <Select value={form.price_type} onValueChange={(v: any) => setForm({ ...form, price_type: v })}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="negotiable">Negotiable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Bedrooms</Label>
                  <Input type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} placeholder="e.g., 3" className="rounded-lg" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Bathrooms</Label>
                  <Input type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} placeholder="e.g., 2" className="rounded-lg" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Floors</Label>
                  <Input type="number" value={form.floors} onChange={e => setForm({ ...form, floors: e.target.value })} placeholder="e.g., 2" className="rounded-lg" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Construction Status</Label>
                <Select value={form.construction_status} onValueChange={(v: any) => setForm({ ...form, construction_status: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty">Empty / Plot</SelectItem>
                    <SelectItem value="under_construction">Under Construction</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Position Features</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'is_corner', label: 'Corner Plot' },
                    { key: 'is_road_facing', label: 'Road Facing' },
                    { key: 'is_park_facing', label: 'Park Facing' },
                    { key: 'is_west_open', label: 'West Open' },
                  ].map(f => (
                    <div key={f.key} className="flex items-center gap-2">
                      <Checkbox checked={(form as any)[f.key]} onCheckedChange={c => setForm({ ...form, [f.key]: !!c })} />
                      <label className="text-sm">{f.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              {amenities.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenities.map(a => {
                      const Icon = getIconComponent(a.icon)
                      return (
                        <div key={a.id} className="flex items-center gap-2">
                          <Checkbox checked={form.amenity_ids.includes(a.id)} onCheckedChange={c => {
                            setForm({ ...form, amenity_ids: c ? [...form.amenity_ids, a.id] : form.amenity_ids.filter(id => id !== a.id) })
                          }} />
                          <Icon className="h-4 w-4 text-slate-500" />
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

        {/* Step 3: Description */}
        {step === 3 && (
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-emerald-600" />Description & Details</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Title <span className="text-red-500">*</span></Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., 3 Bed Apartment in DHA Phase 6" className={`rounded-lg ${!form.title ? 'border-red-300' : ''}`} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Description <span className="text-red-500">*</span></Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Describe your property in detail..." className={`rounded-lg ${!form.description ? 'border-red-300' : ''}`} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Images */}
        {step === 4 && (
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5 text-emerald-600" />Upload Images (Max 10)</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(img)} alt="" className="w-full aspect-square object-cover rounded-lg border border-slate-200" />
                    <Button size="sm" variant="destructive" className="absolute top-1 right-1 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setImages(images.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {images.length < 10 && (
                  <label className="border-2 border-dashed border-slate-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-emerald-600 hover:bg-emerald-50 transition-colors group">
                    <Upload className="h-6 w-6 text-slate-400 group-hover:text-emerald-600 mb-1" />
                    <span className="text-xs text-slate-500 group-hover:text-emerald-600">Upload</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-3">{images.length}/10 images uploaded.</p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1} className="rounded-lg px-5 py-5 text-sm border-slate-200 hover:border-emerald-600 hover:text-emerald-600">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {step < 4 ? (
            <Button onClick={() => {
              const err = validate(step)
              if (err) { setValidationMsg(err); return }
              setStep(step + 1)
            }} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-lg px-6 py-5 text-sm shadow-lg">
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-lg px-6 py-5 text-sm shadow-lg">
              {loading ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Listing' : 'Submit Listing')}
              {!loading && <CheckCircle className="h-4 w-4 ml-2" />}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

export default function PostListingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 animate-pulse" />}>
      <PostListingContent />
    </Suspense>
  )
}

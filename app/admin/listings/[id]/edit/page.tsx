'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, CheckCircle, X, Upload, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AdminEditListingPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [areas, setAreas] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])
  const [propertyTypes, setPropertyTypes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    area_id: '',
    project_id: '',
    property_type_id: '',
    purpose: 'sale',
    price: '',
    price_type: 'fixed',
    area_size: '',
    area_unit: 'sqyd',
    bedrooms: '',
    bathrooms: '',
    floors: '',
    construction_status: 'empty',
    is_corner: false,
    is_road_facing: false,
    is_park_facing: false,
    is_west_open: false,
  })
  const [images, setImages] = useState<any[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (formData.area_id) {
      setFilteredProjects(projects.filter(p => p.area_id === formData.area_id))
    } else {
      setFilteredProjects(projects)
    }
  }, [formData.area_id, projects])

  const fetchData = async () => {
    const supabase = createClient()
    const [areasRes, projectsRes, typesRes, listingRes] = await Promise.all([
      supabase.from('areas').select('*').eq('is_active', true).order('name'),
      supabase.from('projects').select('*').eq('is_active', true).order('name'),
      supabase.from('property_types').select('*').eq('is_active', true).order('display_order'),
      supabase.from('listings').select('*, listing_images(*)').eq('id', params.id).single()
    ])

    if (areasRes.data) setAreas(areasRes.data)
    if (projectsRes.data) setProjects(projectsRes.data)
    if (typesRes.data) setPropertyTypes(typesRes.data)

    if (listingRes.data) {
      const l = listingRes.data
      setFormData({
        title: l.title || '',
        description: l.description || '',
        area_id: l.area_id || '',
        project_id: l.project_id || '',
        property_type_id: l.property_type_id || '',
        purpose: l.purpose || 'sale',
        price: l.price?.toString() || '',
        price_type: l.price_type || 'fixed',
        area_size: l.area_size?.toString() || '',
        area_unit: l.area_unit || 'sqyd',
        bedrooms: l.bedrooms?.toString() || '',
        bathrooms: l.bathrooms?.toString() || '',
        floors: l.floors?.toString() || '',
        construction_status: l.construction_status || 'empty',
        is_corner: l.is_corner || false,
        is_road_facing: l.is_road_facing || false,
        is_park_facing: l.is_park_facing || false,
        is_west_open: l.is_west_open || false,
      })
      setImages(l.listing_images || [])
    }
    setLoading(false)
  }

  const removeExistingImage = (id: string) => {
    setImages(images.filter((img: any) => img.id !== id))
    setDeletedImageIds([...deletedImageIds, id])
  }

  const removeNewImage = (idx: number) => {
    setNewImages(newImages.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const updateData: any = {
      title: formData.title,
      description: formData.description,
      area_id: formData.area_id || null,
      project_id: formData.project_id || null,
      property_type_id: formData.property_type_id || null,
      purpose: formData.purpose,
      price: parseFloat(formData.price),
      price_type: formData.price_type,
      area_size: formData.area_size ? parseFloat(formData.area_size) : null,
      area_unit: formData.area_unit,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
      floors: formData.floors ? parseInt(formData.floors) : null,
      construction_status: formData.construction_status,
      is_corner: formData.is_corner,
      is_road_facing: formData.is_road_facing,
      is_park_facing: formData.is_park_facing,
      is_west_open: formData.is_west_open,
    }

    const { error } = await supabase.from('listings').update(updateData).eq('id', params.id)

    if (deletedImageIds.length > 0) {
      await supabase.from('listing_images').delete().in('id', deletedImageIds)
    }

    if (newImages.length > 0) {
      const { data: { user } } = await supabase.auth.getUser()
      const fd = new FormData()
      fd.append('listing_id', params.id as string)
      fd.append('user_id', user?.id || '')
      newImages.forEach(img => fd.append('images', img))
      await fetch('/api/upload-images', { method: 'POST', body: fd })
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: '✅ Saved', description: 'Listing updated', className: 'bg-emerald-50 border-emerald-200' })
      setNewImages([])
      setDeletedImageIds([])
      fetchData()
    }
    setSaving(false)
  }

  const handleApprove = async () => {
    await handleSave()
    const supabase = createClient()
    const { error } = await supabase.from('listings').update({ status: 'approved' }).eq('id', params.id)
    if (!error) {
      toast({ title: '✅ Approved', description: 'Listing approved', className: 'bg-emerald-50 border-emerald-200' })
      router.push('/admin/listings')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/listings">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Listing</h1>
            <p className="text-sm text-slate-500">Review and edit before approval</p>
          </div>
        </div>

        {/* Images */}
        <Card className="mb-6">
          <CardHeader><CardTitle>Property Images</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {images.map((img: any, idx: number) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                  <Image src={img.image_url} alt={`Image ${idx + 1}`} fill className="object-cover" />
                  <Button size="sm" variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeExistingImage(img.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {newImages.map((img: File, idx: number) => (
                <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={URL.createObjectURL(img)} alt={`New ${idx + 1}`} className="w-full h-full object-cover" />
                  <Button size="sm" variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeNewImage(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-600 hover:bg-emerald-50 transition-colors">
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <span className="text-sm text-slate-500">Add Image</span>
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => { if (e.target.files) setNewImages([...newImages, ...Array.from(e.target.files)]) }} />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="mb-6">
          <CardHeader><CardTitle>Listing Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Area</Label>
                <Select value={formData.area_id || 'none'} onValueChange={(v) => setFormData({ ...formData, area_id: v === 'none' ? '' : v, project_id: '' })}>
                  <SelectTrigger><SelectValue placeholder="Select Area" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Area</SelectItem>
                    {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Project</Label>
                <Select value={formData.project_id || 'none'} onValueChange={(v) => setFormData({ ...formData, project_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select Project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {filteredProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property Type</Label>
                <Select value={formData.property_type_id || 'none'} onValueChange={(v) => setFormData({ ...formData, property_type_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Type</SelectItem>
                    {propertyTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Purpose</Label>
                <Select value={formData.purpose} onValueChange={(v) => setFormData({ ...formData, purpose: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (PKR)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div>
                <Label>Price Type</Label>
                <Select value={formData.price_type} onValueChange={(v) => setFormData({ ...formData, price_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="negotiable">Negotiable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Area Size</Label>
                <Input type="number" value={formData.area_size} onChange={(e) => setFormData({ ...formData, area_size: e.target.value })} />
              </div>
              <div>
                <Label>Area Unit</Label>
                <Select value={formData.area_unit} onValueChange={(v) => setFormData({ ...formData, area_unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqft">Sq. Feet</SelectItem>
                    <SelectItem value="sqyd">Sq. Yards</SelectItem>
                    <SelectItem value="marla">Marla</SelectItem>
                    <SelectItem value="kanal">Kanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Bedrooms</Label>
                <Input type="number" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label>Bathrooms</Label>
                <Input type="number" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label>Floors</Label>
                <Input type="number" value={formData.floors} onChange={(e) => setFormData({ ...formData, floors: e.target.value })} placeholder="0" />
              </div>
            </div>

            <div>
              <Label>Construction Status</Label>
              <Select value={formData.construction_status} onValueChange={(v) => setFormData({ ...formData, construction_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Empty / Plot</SelectItem>
                  <SelectItem value="under_construction">Under Construction</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Features</Label>
              {[
                { key: 'is_corner', label: 'Corner Plot' },
                { key: 'is_road_facing', label: 'Road Facing' },
                { key: 'is_park_facing', label: 'Park Facing' },
                { key: 'is_west_open', label: 'West Open' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    checked={formData[key as keyof typeof formData] as boolean}
                    onCheckedChange={(c) => setFormData({ ...formData, [key]: !!c })}
                  />
                  <label className="text-sm">{label}</label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />Save Changes
          </Button>
          <Button onClick={handleApprove} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <CheckCircle className="h-4 w-4" />Save & Approve
          </Button>
        </div>
      </div>
    </div>
  )
}

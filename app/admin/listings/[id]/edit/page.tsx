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
  const [phases, setPhases] = useState<any[]>([])
  const [blocks, setBlocks] = useState<any[]>([])
  const [filteredBlocks, setFilteredBlocks] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    phase_id: '',
    block_id: '',
    property_type: '',
    listing_type: '',
    price: '',
    price_type: 'fixed',
    plot_size_sqyd: '',
    shop_size_sqft: '',
    is_corner: false,
    is_road_facing: false,
    is_park_facing: false,
    is_west_open: false
  })
  const [images, setImages] = useState<any[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.phase_id) {
      setFilteredBlocks(blocks.filter(b => b.phase_id === formData.phase_id))
    }
  }, [formData.phase_id, blocks])

  const fetchData = async () => {
    const supabase = createClient()
    const [phasesRes, blocksRes, listingRes] = await Promise.all([
      supabase.from('phases').select('*').order('name'),
      supabase.from('blocks').select('*').order('name'),
      supabase.from('listings').select('*, listing_images(*)').eq('id', params.id).single()
    ])

    if (phasesRes.data) setPhases(phasesRes.data)
    if (blocksRes.data) setBlocks(blocksRes.data)
    if (listingRes.data) {
      const l = listingRes.data
      setFormData({
        title: l.title || '',
        description: l.description || '',
        phase_id: l.phase_id || '',
        block_id: l.block_id || '',
        property_type: l.property_type || '',
        listing_type: l.listing_type || '',
        price: l.price?.toString() || '',
        price_type: l.price_type || 'fixed',
        plot_size_sqyd: l.plot_size_sqyd?.toString() || '',
        shop_size_sqft: l.shop_size_sqft?.toString() || '',
        is_corner: l.is_corner || false,
        is_road_facing: l.is_road_facing || false,
        is_park_facing: l.is_park_facing || false,
        is_west_open: l.is_west_open || false
      })
      setImages(l.listing_images || [])
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const updateData: any = {
      title: formData.title,
      description: formData.description,
      phase_id: formData.phase_id,
      block_id: formData.block_id,
      property_type: formData.property_type,
      listing_type: formData.listing_type,
      price: parseFloat(formData.price),
      price_type: formData.price_type,
      is_corner: formData.is_corner,
      is_road_facing: formData.is_road_facing,
      is_park_facing: formData.is_park_facing,
      is_west_open: formData.is_west_open
    }

    if (formData.property_type === 'residential_plot') {
      updateData.plot_size_sqyd = parseFloat(formData.plot_size_sqyd)
      updateData.shop_size_sqft = null
    } else {
      updateData.shop_size_sqft = parseFloat(formData.shop_size_sqft)
      updateData.plot_size_sqyd = null
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

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/listings"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div><h1 className="text-2xl font-bold">Edit Listing</h1><p className="text-sm text-slate-500">Review and edit before approval</p></div>
        </div>

        {(images.length > 0 || newImages.length > 0) && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Property Images</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {images.map((img: any, idx: number) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                    <Image src={img.image_url} alt={`Image ${idx + 1}`} fill className="object-cover" />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeExistingImage(img.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {newImages.map((img: File, idx: number) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={URL.createObjectURL(img)} alt={`New ${idx + 1}`} className="w-full h-full object-cover" />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeNewImage(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <label className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-600 hover:bg-emerald-50 transition-colors">
                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">Add Image</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                    if (e.target.files) {
                      setNewImages([...newImages, ...Array.from(e.target.files)])
                    }
                  }} />
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader><CardTitle>Listing Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} /></div>
            
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phase</Label>
                <Select value={formData.phase_id} onValueChange={(val) => setFormData({ ...formData, phase_id: val, block_id: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{phases.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Block</Label>
                <Select value={formData.block_id} onValueChange={(val) => setFormData({ ...formData, block_id: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{filteredBlocks.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Property Type</Label>
                <Select value={formData.property_type} onValueChange={(val) => setFormData({ ...formData, property_type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential_plot">Residential Plot</SelectItem>
                    <SelectItem value="commercial_shop">Commercial Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Listing Type</Label>
                <Select value={formData.listing_type} onValueChange={(val) => setFormData({ ...formData, listing_type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="for_sale">For Sale</SelectItem>
                    <SelectItem value="for_rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price (PKR)</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} /></div>
              <div><Label>Price Type</Label>
                <Select value={formData.price_type} onValueChange={(val) => setFormData({ ...formData, price_type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="negotiable">Negotiable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.property_type === 'residential_plot' && (
              <div><Label>Plot Size (Sq. Yards)</Label><Input type="number" value={formData.plot_size_sqyd} onChange={(e) => setFormData({ ...formData, plot_size_sqyd: e.target.value })} /></div>
            )}
            {formData.property_type === 'commercial_shop' && (
              <div><Label>Shop Size (Sq. Feet)</Label><Input type="number" value={formData.shop_size_sqft} onChange={(e) => setFormData({ ...formData, shop_size_sqft: e.target.value })} /></div>
            )}

            <div className="space-y-3">
              <Label>Features</Label>
              <div className="flex items-center gap-2"><Checkbox checked={formData.is_corner} onCheckedChange={(c) => setFormData({ ...formData, is_corner: !!c })} /><label className="text-sm">Corner Plot</label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.is_road_facing} onCheckedChange={(c) => setFormData({ ...formData, is_road_facing: !!c })} /><label className="text-sm">Road Facing</label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.is_park_facing} onCheckedChange={(c) => setFormData({ ...formData, is_park_facing: !!c })} /><label className="text-sm">Park Facing</label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.is_west_open} onCheckedChange={(c) => setFormData({ ...formData, is_west_open: !!c })} /><label className="text-sm">West Open</label></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2"><Save className="h-4 w-4" />Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

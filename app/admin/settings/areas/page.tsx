'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MapPin, Plus, Edit, Trash2, RefreshCw, Search, Star } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', image_url: '', is_popular: false, display_order: 0 })

  useEffect(() => { fetchAreas() }, [])
  useEffect(() => {
    setFiltered(areas.filter(a => a.name.toLowerCase().includes(search.toLowerCase())))
  }, [areas, search])

  const fetchAreas = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('areas').select('*').order('display_order')
    if (data) setAreas(data)
    setLoading(false)
  }

  const handleSave = async () => {
    const supabase = createClient()
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (editItem) {
      const { error } = await supabase.from('areas').update({ ...form, slug }).eq('id', editItem.id)
      if (!error) toast.success('Area updated')
    } else {
      const { error } = await supabase.from('areas').insert([{ ...form, slug, is_active: true }])
      if (!error) toast.success('Area added')
    }
    setDialog(false)
    setEditItem(null)
    setForm({ name: '', slug: '', description: '', image_url: '', is_popular: false, display_order: 0 })
    fetchAreas()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('areas').delete().eq('id', id)
    if (!error) { toast.success('Area deleted'); fetchAreas() }
    setDeleteDialog(false)
    setToDelete(null)
  }

  const toggleActive = async (id: string, val: boolean) => {
    const supabase = createClient()
    await supabase.from('areas').update({ is_active: !val }).eq('id', id)
    fetchAreas()
  }

  const openEdit = (area: any) => {
    setEditItem(area)
    setForm({ name: area.name, slug: area.slug, description: area.description || '', image_url: area.image_url || '', is_popular: area.is_popular, display_order: area.display_order })
    setDialog(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Areas Management</h1>
            <p className="text-slate-500 text-sm mt-1">Manage Karachi areas (DHA, Clifton, Bahria Town...)</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchAreas} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
            <Button onClick={() => { setEditItem(null); setForm({ name: '', slug: '', description: '', image_url: '', is_popular: false, display_order: areas.length + 1 }); setDialog(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" />Add Area
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search areas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white" />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Areas', value: areas.length },
            { label: 'Active', value: areas.filter(a => a.is_active).length },
            { label: 'Popular', value: areas.filter(a => a.is_popular).length },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Name', 'Slug', 'Popular', 'Order', 'Active', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading...</td></tr>
                ) : filtered.map(area => (
                  <tr key={area.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-slate-900">{area.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{area.slug}</td>
                    <td className="px-4 py-3">
                      {area.is_popular && <Badge className="bg-amber-100 text-amber-700 border-0"><Star className="h-3 w-3 mr-1" />Popular</Badge>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{area.display_order}</td>
                    <td className="px-4 py-3">
                      <Switch checked={area.is_active} onCheckedChange={() => toggleActive(area.id, area.is_active)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(area)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => { setToDelete(area); setDeleteDialog(true) }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Area' : 'Add New Area'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. DHA" className="mt-1" /></div>
              <div><Label>Slug (auto)</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. dha" className="mt-1" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1" /></div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
              <div className="flex items-center gap-3 mt-6"><Switch checked={form.is_popular} onCheckedChange={v => setForm({ ...form, is_popular: v })} /><Label>Popular Area</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name} className="bg-emerald-600 hover:bg-emerald-700">{editItem ? 'Update' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-red-600">Delete Area</DialogTitle></DialogHeader>
          <p className="text-slate-600 py-4">Are you sure you want to delete "{toDelete?.name}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => toDelete && handleDelete(toDelete.id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

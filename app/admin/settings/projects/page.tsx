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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Layers, Plus, Edit, Trash2, RefreshCw, Search, Star } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [developers, setDevelopers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', slug: '', description: '', image_url: '', banner_url: '',
    area_id: '', developer_id: '', project_status: 'ongoing',
    min_price: '', max_price: '', total_units: '', completion_year: '',
    is_featured: false
  })

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    setFiltered(projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase())))
  }, [projects, search])

  const fetchAll = async () => {
    setLoading(true)
    const supabase = createClient()
    const [projRes, areasRes, devsRes] = await Promise.all([
      supabase.from('projects').select('*, area:areas(name), developer:developers(name)').order('created_at', { ascending: false }),
      supabase.from('areas').select('id,name').eq('is_active', true).order('display_order'),
      supabase.from('developers').select('id,name').eq('is_active', true).order('name'),
    ])
    if (projRes.data) setProjects(projRes.data)
    if (areasRes.data) setAreas(areasRes.data)
    if (devsRes.data) setDevelopers(devsRes.data)
    setLoading(false)
  }

  const handleSave = async () => {
    const supabase = createClient()
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const data: any = {
      name: form.name, slug,
      description: form.description || null,
      image_url: form.image_url || null,
      banner_url: form.banner_url || null,
      area_id: form.area_id || null,
      developer_id: form.developer_id || null,
      project_status: form.project_status,
      min_price: form.min_price ? parseFloat(form.min_price) : null,
      max_price: form.max_price ? parseFloat(form.max_price) : null,
      total_units: form.total_units ? parseInt(form.total_units) : null,
      completion_year: form.completion_year ? parseInt(form.completion_year) : null,
      is_featured: form.is_featured,
    }
    if (editItem) {
      const { error } = await supabase.from('projects').update(data).eq('id', editItem.id)
      if (!error) toast.success('Project updated')
    } else {
      const { error } = await supabase.from('projects').insert([{ ...data, is_active: true }])
      if (!error) toast.success('Project added')
    }
    setDialog(false); setEditItem(null)
    setForm({ name: '', slug: '', description: '', image_url: '', banner_url: '', area_id: '', developer_id: '', project_status: 'ongoing', min_price: '', max_price: '', total_units: '', completion_year: '', is_featured: false })
    fetchAll()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) { toast.success('Project deleted'); fetchAll() }
    setDeleteDialog(false); setToDelete(null)
  }

  const toggleActive = async (id: string, val: boolean) => {
    const supabase = createClient()
    await supabase.from('projects').update({ is_active: !val }).eq('id', id)
    fetchAll()
  }

  const openEdit = (p: any) => {
    setEditItem(p)
    setForm({
      name: p.name, slug: p.slug, description: p.description || '', image_url: p.image_url || '',
      banner_url: p.banner_url || '', area_id: p.area_id || '', developer_id: p.developer_id || '',
      project_status: p.project_status, min_price: p.min_price?.toString() || '',
      max_price: p.max_price?.toString() || '', total_units: p.total_units?.toString() || '',
      completion_year: p.completion_year?.toString() || '', is_featured: p.is_featured
    })
    setDialog(true)
  }

  const statusColor: Record<string, string> = {
    upcoming: 'bg-amber-100 text-amber-700',
    ongoing: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Projects Management</h1>
            <p className="text-slate-500 text-sm mt-1">Manage housing projects and developments</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchAll} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
            <Button onClick={() => { setEditItem(null); setForm({ name: '', slug: '', description: '', image_url: '', banner_url: '', area_id: '', developer_id: '', project_status: 'ongoing', min_price: '', max_price: '', total_units: '', completion_year: '', is_featured: false }); setDialog(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" />Add Project
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white" />
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: projects.length },
            { label: 'Upcoming', value: projects.filter(p => p.project_status === 'upcoming').length },
            { label: 'Ongoing', value: projects.filter(p => p.project_status === 'ongoing').length },
            { label: 'Completed', value: projects.filter(p => p.project_status === 'completed').length },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-slate-900">{s.value}</p><p className="text-sm text-slate-500">{s.label}</p></CardContent></Card>
          ))}
        </div>

        <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Name', 'Area', 'Developer', 'Status', 'Featured', 'Active', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">Loading...</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.area?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.developer?.name || '—'}</td>
                    <td className="px-4 py-3"><Badge className={`${statusColor[p.project_status]} border-0`}>{p.project_status}</Badge></td>
                    <td className="px-4 py-3">{p.is_featured && <Badge className="bg-amber-100 text-amber-700 border-0"><Star className="h-3 w-3 mr-1" />Featured</Badge>}</td>
                    <td className="px-4 py-3"><Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => { setToDelete(p); setDeleteDialog(true) }}><Trash2 className="h-4 w-4" /></Button>
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Project' : 'Add New Project'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. North Town Residency" className="mt-1" /></div>
              <div><Label>Slug (auto)</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. north-town" className="mt-1" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Area</Label>
                <Select value={form.area_id || 'none'} onValueChange={v => setForm({ ...form, area_id: v === 'none' ? '' : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select area" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Area</SelectItem>
                    {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Developer</Label>
                <Select value={form.developer_id || 'none'} onValueChange={v => setForm({ ...form, developer_id: v === 'none' ? '' : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select developer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Developer</SelectItem>
                    {developers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.project_status} onValueChange={v => setForm({ ...form, project_status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Under Construction</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Completion Year</Label><Input type="number" value={form.completion_year} onChange={e => setForm({ ...form, completion_year: e.target.value })} placeholder="e.g. 2026" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Min Price (PKR)</Label><Input type="number" value={form.min_price} onChange={e => setForm({ ...form, min_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Max Price (PKR)</Label><Input type="number" value={form.max_price} onChange={e => setForm({ ...form, max_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Total Units</Label><Input type="number" value={form.total_units} onChange={e => setForm({ ...form, total_units: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="mt-1" /></div>
            <div><Label>Banner URL</Label><Input value={form.banner_url} onChange={e => setForm({ ...form, banner_url: e.target.value })} placeholder="https://..." className="mt-1" /></div>
            <div className="flex items-center gap-3"><Switch checked={form.is_featured} onCheckedChange={v => setForm({ ...form, is_featured: v })} /><Label>Featured Project</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name} className="bg-emerald-600 hover:bg-emerald-700">{editItem ? 'Update' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-red-600">Delete Project</DialogTitle></DialogHeader>
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

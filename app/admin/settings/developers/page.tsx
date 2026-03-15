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
import { Building2, Plus, Edit, Trash2, RefreshCw, Search, BadgeCheck, Star } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDevelopersPage() {
  const [developers, setDevelopers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', slug: '', description: '', logo_url: '', banner_url: '',
    website: '', phone: '', email: '', established_year: '',
    is_verified: false, is_featured: false
  })

  useEffect(() => { fetchDevelopers() }, [])
  useEffect(() => {
    setFiltered(developers.filter(d => d.name.toLowerCase().includes(search.toLowerCase())))
  }, [developers, search])

  const fetchDevelopers = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('developers').select('*').order('name')
    if (data) setDevelopers(data)
    setLoading(false)
  }

  const handleSave = async () => {
    const supabase = createClient()
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const data: any = {
      name: form.name, slug,
      description: form.description || null,
      logo_url: form.logo_url || null,
      banner_url: form.banner_url || null,
      website: form.website || null,
      phone: form.phone || null,
      email: form.email || null,
      established_year: form.established_year ? parseInt(form.established_year) : null,
      is_verified: form.is_verified,
      is_featured: form.is_featured,
    }
    if (editItem) {
      const { error } = await supabase.from('developers').update(data).eq('id', editItem.id)
      if (!error) toast.success('Developer updated')
    } else {
      const { error } = await supabase.from('developers').insert([{ ...data, is_active: true }])
      if (!error) toast.success('Developer added')
    }
    setDialog(false); setEditItem(null)
    setForm({ name: '', slug: '', description: '', logo_url: '', banner_url: '', website: '', phone: '', email: '', established_year: '', is_verified: false, is_featured: false })
    fetchDevelopers()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('developers').delete().eq('id', id)
    if (!error) { toast.success('Developer deleted'); fetchDevelopers() }
    setDeleteDialog(false); setToDelete(null)
  }

  const toggleActive = async (id: string, val: boolean) => {
    const supabase = createClient()
    await supabase.from('developers').update({ is_active: !val }).eq('id', id)
    fetchDevelopers()
  }

  const openEdit = (d: any) => {
    setEditItem(d)
    setForm({
      name: d.name, slug: d.slug, description: d.description || '',
      logo_url: d.logo_url || '', banner_url: d.banner_url || '',
      website: d.website || '', phone: d.phone || '', email: d.email || '',
      established_year: d.established_year?.toString() || '',
      is_verified: d.is_verified, is_featured: d.is_featured
    })
    setDialog(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Developers Management</h1>
            <p className="text-slate-500 text-sm mt-1">Manage real estate developers</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchDevelopers} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
            <Button onClick={() => { setEditItem(null); setForm({ name: '', slug: '', description: '', logo_url: '', banner_url: '', website: '', phone: '', email: '', established_year: '', is_verified: false, is_featured: false }); setDialog(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" />Add Developer
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search developers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white" />
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: developers.length },
            { label: 'Active', value: developers.filter(d => d.is_active).length },
            { label: 'Verified', value: developers.filter(d => d.is_verified).length },
            { label: 'Featured', value: developers.filter(d => d.is_featured).length },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-slate-900">{s.value}</p><p className="text-sm text-slate-500">{s.label}</p></CardContent></Card>
          ))}
        </div>

        <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Developer', 'Contact', 'Verified', 'Featured', 'Active', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading...</td></tr>
                ) : filtered.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {d.logo_url ? (
                          <img src={d.logo_url} alt={d.name} className="w-8 h-8 object-contain rounded border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center"><Building2 className="h-4 w-4 text-slate-400" /></div>
                        )}
                        <span className="font-medium text-slate-900">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{d.phone || d.email || '—'}</td>
                    <td className="px-4 py-3">
                      {d.is_verified && <Badge className="bg-blue-100 text-blue-700 border-0"><BadgeCheck className="h-3 w-3 mr-1" />Verified</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      {d.is_featured && <Badge className="bg-amber-100 text-amber-700 border-0"><Star className="h-3 w-3 mr-1" />Featured</Badge>}
                    </td>
                    <td className="px-4 py-3"><Switch checked={d.is_active} onCheckedChange={() => toggleActive(d.id, d.is_active)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => { setToDelete(d); setDeleteDialog(true) }}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editItem ? 'Edit Developer' : 'Add New Developer'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bahria Town" className="mt-1" /></div>
              <div><Label>Slug (auto)</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. bahria-town" className="mt-1" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Logo URL</Label><Input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." className="mt-1" /></div>
              <div><Label>Banner URL</Label><Input value={form.banner_url} onChange={e => setForm({ ...form, banner_url: e.target.value })} placeholder="https://..." className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+92..." className="mt-1" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="info@..." className="mt-1" /></div>
              <div><Label>Est. Year</Label><Input type="number" value={form.established_year} onChange={e => setForm({ ...form, established_year: e.target.value })} placeholder="e.g. 2000" className="mt-1" /></div>
            </div>
            <div><Label>Website</Label><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="mt-1" /></div>
            <div className="flex gap-6">
              <div className="flex items-center gap-3"><Switch checked={form.is_verified} onCheckedChange={v => setForm({ ...form, is_verified: v })} /><Label>Verified</Label></div>
              <div className="flex items-center gap-3"><Switch checked={form.is_featured} onCheckedChange={v => setForm({ ...form, is_featured: v })} /><Label>Featured</Label></div>
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
          <DialogHeader><DialogTitle className="text-red-600">Delete Developer</DialogTitle></DialogHeader>
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

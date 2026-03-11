import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import './admin-compact.css'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const supabase = await createClient()
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect('/auth/login')
  // }

  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('role')
  //   .eq('id', user.id)
  //   .single()

  // if (profile?.role !== 'admin') {
  //   redirect('/')
  // }

  return (
    <div className="flex min-h-screen bg-slate-50 admin-panel">
      <AdminSidebar />
      <main className="flex-1 transition-all duration-300">
        <div className="lg:ml-64" id="admin-content">
          {children}
        </div>
      </main>
    </div>
  )
}

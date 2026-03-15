import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-white">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
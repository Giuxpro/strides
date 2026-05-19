import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const NAV = [
  { href: '/admin',            label: 'Dashboard' },
  { href: '/admin/content',    label: 'Contenido' },
  { href: '/admin/onboarding', label: 'Onboarding' },
  { href: '/admin/templates',  label: 'Plantillas' },
  { href: '/admin/users',      label: 'Usuarios' },
  { href: '/admin/codes',      label: 'Códigos' },
  { href: '/admin/feedback',   label: 'Feedback' },
  { href: '/admin/settings',   label: 'Configuración' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, display_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/kids/play')

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-gray-950 text-gray-100">
      <AdminSidebar
        nav={NAV}
        profileName={profile?.display_name ?? profile?.email}
      />
      <main className="flex-1 overflow-auto min-h-0">
        {children}
      </main>
    </div>
  )
}

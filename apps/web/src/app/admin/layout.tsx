import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const NAV = [
  { href: '/admin',             label: 'Dashboard' },
  { href: '/admin/content',     label: 'Contenido' },
  { href: '/admin/onboarding',  label: 'Onboarding' },
  { href: '/admin/templates',   label: 'Plantillas' },
  { href: '/admin/users',        label: 'Usuarios' },
  { href: '/admin/codes',        label: 'Códigos' },
  { href: '/admin/feedback',     label: 'Feedback' },
  { href: '/admin/settings',    label: 'Configuración' },
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
    <div className="h-screen flex overflow-hidden bg-gray-950 text-gray-100">
      <aside className="w-52 flex-shrink-0 flex flex-col bg-[#07070a] border-r border-gray-800">
        <div className="flex-shrink-0 px-5 py-5 border-b border-gray-800">
          <p className="text-xs font-bold tracking-widest text-violet-400 uppercase">Strides</p>
          <p className="text-xs text-gray-600 mt-0.5">Administración</p>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-800">
          <Link
            href="/select-profile"
            className="block text-xs text-gray-600 hover:text-gray-400 transition-colors mb-3"
          >
            ← Volver a la app
          </Link>
          <p className="text-xs text-gray-500 truncate">{profile?.display_name ?? profile?.email}</p>
          <p className="text-xs text-gray-700 mt-0.5">Admin</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

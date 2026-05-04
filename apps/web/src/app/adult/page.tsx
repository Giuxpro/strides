import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdultPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar')
    .eq('id', user.id)
    .single()

  const name = profile?.display_name ?? user.email ?? 'Usuario'

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 text-center">
      <div className="text-5xl mb-5">{profile?.avatar ?? '👤'}</div>
      <h1 className="text-2xl font-bold text-white mb-2">Hola, {name}</h1>
      <p className="text-gray-500 text-sm mb-10 max-w-xs">
        La experiencia adulta está en construcción. Por ahora puedes gestionar perfiles y configuración.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/select-profile"
          className="bg-gray-900 border border-gray-800 text-white font-semibold py-3 rounded-xl hover:border-gray-700 transition-colors"
        >
          Cambiar perfil
        </Link>
        <Link
          href="/account/profile"
          className="bg-gray-900 border border-gray-800 text-white font-semibold py-3 rounded-xl hover:border-gray-700 transition-colors"
        >
          Mi cuenta
        </Link>
      </div>

      <p className="text-gray-700 text-xs mt-12">Próximamente: contenido para adultos</p>
    </main>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function GetAccessPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center"
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)' }}
    >
      <div className="w-full max-w-sm">
        <span className="text-6xl block mb-6">🔐</span>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
          Activa tu acceso
        </h1>

        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Para que{' '}
          {profile?.display_name ? <strong>{profile.display_name}</strong> : 'tu hijo'}{' '}
          empiece a aprender inglés, activa tu plan con precio de fundadores antes de que suba.
        </p>

        <div className="bg-white rounded-3xl border border-violet-200 p-5 mb-6 text-left shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Incluido en tu plan</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> Acceso completo a todos los módulos</li>
            <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> Juegos, lecciones y desafíos diarios</li>
            <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> Seguimiento de progreso del niño</li>
            <li className="flex items-center gap-2"><span className="text-amber-500">★</span> Precio de fundadores — sube al lanzamiento</li>
          </ul>
        </div>

        {/* Placeholder — se conectará a Stripe */}
        <div
          className="w-full py-4 rounded-2xl font-bold text-white text-base text-center opacity-60 cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 0 #4338ca' }}
        >
          Activar acceso ahora — próximamente
        </div>

        <p className="text-xs text-gray-400 mt-4">
          ¿Preguntas? Escríbenos a{' '}
          <a href="mailto:hola@strides.app" className="text-violet-500 hover:underline">hola@strides.app</a>
        </p>
      </div>
    </main>
  )
}

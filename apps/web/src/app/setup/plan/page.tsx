import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function SetupPlanPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_ends_at')
    .eq('id', user.id)
    .single()

  const trialEndsAt = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : null

  const trialDays = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 7

  const expiryLabel = trialEndsAt
    ? trialEndsAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-2 rounded-full bg-violet-300" />
          <div className="w-8 h-2 rounded-full bg-violet-600" />
        </div>

        <div className="mb-8">
          <span className="text-5xl block mb-4">🎉</span>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
            ¡Todo listo!
          </h1>
          <p className="text-gray-500 text-sm">
            Tienes <strong>{trialDays} días gratis</strong> para explorar todo.
            {expiryLabel && <span className="block mt-1 text-xs text-gray-400">Tu trial vence el {expiryLabel}.</span>}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-violet-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-gray-900">Trial gratuito</span>
            <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-1 rounded-full">
              {trialDays} días gratis
            </span>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Acceso completo a todos los módulos</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Juegos, lecciones y desafíos diarios</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Seguimiento de progreso del niño</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Sin compromiso — cancela cuando quieras</li>
          </ul>
        </div>

        <Link
          href="/select-profile"
          className="block w-full text-center py-4 rounded-2xl font-bold text-white text-base transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 0 #4338ca' }}
        >
          Empezar mi trial gratis 🚀
        </Link>

        <p className="text-center text-xs text-gray-400 mt-4">
          Te avisaremos antes de que venza tu trial.
        </p>
      </div>
    </main>
  )
}

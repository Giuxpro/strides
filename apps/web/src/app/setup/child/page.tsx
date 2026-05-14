import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createChildSetup } from '@/app/account/_actions'
import { AvatarPicker } from '@/components/profile/AvatarPicker'

export default async function SetupChildPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Si ya tiene hijos, saltar al plan
  const { data: existing } = await supabase
    .from('children').select('id').eq('parent_id', user.id).limit(1)
  if (existing && existing.length > 0) redirect('/setup/plan')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Paso 1 de 2 */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-2 rounded-full bg-violet-600" />
          <div className="w-8 h-2 rounded-full bg-violet-200" />
        </div>

        <div className="mb-8">
          <span className="text-5xl block mb-4">👶</span>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
            ¿Quién va a aprender?
          </h1>
          <p className="text-gray-500 text-sm">
            Crea el perfil de tu hijo para personalizar su experiencia.
          </p>
        </div>

        <form action={createChildSetup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Elige un avatar
            </label>
            <AvatarPicker name="avatar_url" />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="Ej: Sofía"
              className="w-full px-4 py-3 rounded-xl bg-white border border-violet-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Edad
            </label>
            <input
              id="age"
              name="age"
              type="number"
              required
              min={1}
              max={99}
              placeholder="Ej: 6"
              className="w-full px-4 py-3 rounded-xl bg-white border border-violet-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all hover:scale-[1.02] active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 4px 0 #4338ca',
            }}
          >
            Continuar →
          </button>
        </form>
      </div>
    </main>
  )
}

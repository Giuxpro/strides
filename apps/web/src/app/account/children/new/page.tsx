import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createChild } from '@/app/actions/children'
import { AvatarPicker } from '@/components/profile/AvatarPicker'
import Link from 'next/link'

export default async function NewChildPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: children }, { data: seatsSetting }] = await Promise.all([
    supabase.from('children').select('id').eq('parent_id', user.id),
    supabase.from('settings').select('value').eq('key', 'household_included_seats').single(),
  ])

  const includedSeats = (seatsSetting?.value as number) ?? 2
  const usedSeats = 1 + (children?.length ?? 0)

  if (usedSeats >= includedSeats) redirect('/account/upgrade')
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <Link href="/select-profile" className="text-gray-500 text-sm hover:text-gray-300 mb-8 inline-block">
          ← Volver
        </Link>

        <h1 className="text-2xl font-bold text-white mb-8">Agregar perfil</h1>

        <form action={createChild} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Avatar
            </label>
            <AvatarPicker name="avatar_url" />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Ej: Sofía"
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-400 mb-1">
              Edad
            </label>
            <input
              id="age"
              name="age"
              type="number"
              required
              min={1}
              max={99}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Ej: 6"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Crear perfil
          </button>
        </form>
      </div>
    </main>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateProfile } from '@/app/account/_actions'
import { AvatarPicker } from '@/components/profile/AvatarPicker'
import Link from 'next/link'

export default async function EditProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, avatar')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <Link href="/select-profile" className="text-gray-500 text-sm hover:text-gray-300 mb-8 inline-block">
          ← Volver
        </Link>

        <h1 className="text-2xl font-bold text-white mb-8">Editar perfil</h1>

        <form action={updateProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Avatar
            </label>
            <AvatarPicker name="avatar" defaultValue={profile?.avatar} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Correo electrónico
            </label>
            <p className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-500 text-sm">
              {profile?.email}
            </p>
          </div>

          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-400 mb-1">
              Nombre para mostrar
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              defaultValue={profile?.display_name ?? ''}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="¿Cómo quieres que te llamen?"
            />
            <p className="text-xs text-gray-600 mt-1">Aparece en rankings y en la selección de perfil</p>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Guardar
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <Link
            href="/account/set-password"
            className="block w-full text-center text-sm text-gray-500 hover:text-violet-400 transition-colors py-2"
          >
            Cambiar contraseña →
          </Link>
        </div>
      </div>
    </main>
  )
}

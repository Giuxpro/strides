import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAllOnboardingScreensForAdmin } from '@strides/db'
import { deleteOnboardingScreen, toggleOnboardingPublished } from './_actions'

type ScreenRow = { id: string; slug: string; title: string; order: number; is_published: boolean; flow: string }

const FLOW_LABEL: Record<string, string> = { all: 'Todos', a: 'Flujo A', b: 'Flujo B' }

export default async function AdminOnboardingPage() {
  const supabase = createClient()
  const { data: screens } = await getAllOnboardingScreensForAdmin(supabase)

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">Pantallas editables con Puck. Sin deploy para cambiar contenido.</p>
        </div>
        <Link
          href="/admin/onboarding/new"
          className="text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          + Nueva pantalla
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3 w-8">#</th>
              <th className="text-left px-5 py-3">Pantalla</th>
              <th className="text-left px-5 py-3">Slug</th>
              <th className="text-center px-5 py-3">Flujo</th>
              <th className="text-center px-5 py-3">Estado</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(screens as ScreenRow[] ?? []).map(screen => (
              <tr key={screen.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-gray-600 text-xs">{screen.order}</td>
                <td className="px-5 py-3 font-medium text-white">{screen.title}</td>
                <td className="px-5 py-3 text-gray-400 font-mono text-xs">{screen.slug}</td>
                <td className="px-5 py-3 text-center">
                  <span className="text-xs text-gray-500">{FLOW_LABEL[screen.flow] ?? screen.flow}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  <form action={toggleOnboardingPublished.bind(null, screen.id, !screen.is_published)}>
                    <button
                      type="submit"
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        screen.is_published
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {screen.is_published ? 'Publicado' : 'Borrador'}
                    </button>
                  </form>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/onboarding/${screen.id}/edit`}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Editar →
                    </Link>
                    <form action={deleteOnboardingScreen}>
                      <input type="hidden" name="id" value={screen.id} />
                      <button type="submit" className="text-xs text-red-800 hover:text-red-500 transition-colors">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(!screens || screens.length === 0) && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-600">
                  Sin pantallas.{' '}
                  <Link href="/admin/onboarding/new" className="text-violet-400 hover:text-violet-300">
                    Crear la primera →
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

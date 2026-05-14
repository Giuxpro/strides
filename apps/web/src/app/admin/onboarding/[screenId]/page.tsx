import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getFlowById, getScreensByFlowId } from '@strides/db'
import { updateOnboardingFlow, toggleOnboardingPublished, deleteOnboardingScreen } from '../_actions'
import { SubmitButton } from '@/components/admin/SubmitButton'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

interface Props { params: { screenId: string } }

export default async function FlowDetailPage({ params }: Props) {
  const flowId = params.screenId
  const supabase = createClient()

  const [{ data: flow }, { data: screens }] = await Promise.all([
    getFlowById(supabase, flowId),
    getScreensByFlowId(supabase, flowId),
  ])

  if (!flow) notFound()

  const updateFlow = updateOnboardingFlow.bind(null, flow.id)

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/admin/onboarding" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← Onboarding
      </Link>

      {/* Metadata del flujo */}
      <form action={updateFlow} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5 mt-4 mb-8">
        <div>
          <label className={L}>Nombre</label>
          <input name="name" required defaultValue={flow.name} className={I} placeholder="Nombre del flujo" />
        </div>
        <div>
          <label className={L}>Descripción</label>
          <input name="description" defaultValue={flow.description ?? ''} className={I} placeholder="Descripción (opcional)" />
        </div>
        <div className="flex items-center gap-4 pt-2">
          <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
          <Link href="/admin/onboarding" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>

      {/* Pantallas del flujo */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Pantallas ({screens?.length ?? 0})
        </h2>
        <Link
          href={`/admin/onboarding/${flow.id}/screens/new`}
          className="text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          + Nueva pantalla
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {(!screens || screens.length === 0) ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-600 text-sm mb-3">Sin pantallas todavía.</p>
            <Link
              href={`/admin/onboarding/${flow.id}/screens/new`}
              className="text-violet-400 hover:text-violet-300 text-sm"
            >
              Crear la primera pantalla →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 w-8">#</th>
                <th className="text-left px-5 py-3">Pantalla</th>
                <th className="text-left px-5 py-3">Slug</th>
                <th className="text-center px-5 py-3">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {screens.map(screen => (
                <tr key={screen.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-gray-600 text-xs">{screen.order}</td>
                  <td className="px-5 py-3 font-medium text-white">{screen.title}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{screen.slug}</td>
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
                        href={`/admin/onboarding/${flow.id}/screens/${screen.id}`}
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
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

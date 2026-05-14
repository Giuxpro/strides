import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAllFlows, getScreensByFlowId } from '@strides/db'
import { getSetting } from '@strides/db'
import { deleteOnboardingFlow } from './_actions'

export default async function AdminOnboardingPage() {
  const supabase = createClient()
  const [{ data: flows }, { data: activeRow }] = await Promise.all([
    getAllFlows(supabase),
    getSetting(supabase, 'onboarding_flow'),
  ])

  const activeFlowId = activeRow?.value as string | undefined

  // Contar pantallas por flujo
  const counts = await Promise.all(
    (flows ?? []).map(async f => {
      const { data } = await getScreensByFlowId(supabase, f.id)
      return { id: f.id, count: data?.length ?? 0 }
    })
  )
  const countMap = Object.fromEntries(counts.map(c => [c.id, c.count]))

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">Flujos de registro. Cada flujo contiene las pantallas que verá el usuario antes de registrarse.</p>
        </div>
        <Link
          href="/admin/onboarding/new"
          className="text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          + Nuevo flujo
        </Link>
      </div>

      {(!flows || flows.length === 0) ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-14 text-center">
          <p className="text-gray-600 text-sm mb-3">Sin flujos todavía.</p>
          <Link href="/admin/onboarding/new" className="text-violet-400 hover:text-violet-300 text-sm">
            Crear el primer flujo →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {flows.map(flow => (
            <div
              key={flow.id}
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 flex items-center gap-4 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white font-semibold truncate">{flow.name}</span>
                  {activeFlowId === flow.id && (
                    <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full shrink-0">activo</span>
                  )}
                </div>
                {flow.description && (
                  <p className="text-xs text-gray-500 truncate">{flow.description}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">{countMap[flow.id] ?? 0} pantallas</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/admin/onboarding/${flow.id}`}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Ver pantallas →
                </Link>
                <form action={deleteOnboardingFlow}>
                  <input type="hidden" name="id" value={flow.id} />
                  <button type="submit" className="text-xs text-red-800 hover:text-red-500 transition-colors">
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

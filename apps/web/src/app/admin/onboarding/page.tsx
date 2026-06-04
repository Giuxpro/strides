import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getFlowsAdmin, getScreenCountsByFlowIds, getSetting } from '@strides/db'
import { AdminSearch } from '@/components/admin/layout/AdminSearch'
import { AdminPagination } from '@/components/admin/layout/AdminPagination'
import { deleteOnboardingFlow } from './_actions'

const PAGE_SIZE = 20

export default async function AdminOnboardingPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const supabase = createClient()

  const q      = searchParams.q?.toLowerCase().trim() ?? ''
  const page   = Math.max(1, parseInt(searchParams.page ?? '1') || 1)
  const offset = (page - 1) * PAGE_SIZE

  const [{ data: flows, count }, { data: activeRow }] = await Promise.all([
    getFlowsAdmin(supabase, { q, offset, limit: PAGE_SIZE }),
    getSetting(supabase, 'onboarding_flow'),
  ])

  const activeFlowId = activeRow?.value as string | undefined
  const total = count ?? 0

  const flowIds = (flows ?? []).map(f => f.id)
  const { data: screenRows } = flowIds.length > 0
    ? await getScreenCountsByFlowIds(supabase, flowIds)
    : { data: [] }

  const countMap = (screenRows ?? []).reduce<Record<string, number>>((acc, row) => {
    if (row.flow_id) acc[row.flow_id] = (acc[row.flow_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">Flujos de registro. Cada flujo contiene las pantallas que verá el usuario antes de registrarse.</p>
        </div>
        <Link
          href="/admin/onboarding/new"
          className="shrink-0 text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          + Nuevo flujo
        </Link>
      </div>

      <div className="mb-4">
        <AdminSearch initialValue={searchParams.q ?? ''} placeholder="Buscar flujo..." />
      </div>

      {(flows ?? []).length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-14 text-center">
          {q ? (
            <p className="text-gray-600 text-sm">Sin resultados para &quot;{q}&quot;.</p>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-3">Sin flujos todavía.</p>
              <Link href="/admin/onboarding/new" className="text-violet-400 hover:text-violet-300 text-sm">
                Crear el primer flujo →
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-800">
            {(flows ?? []).map(flow => (
              <div
                key={flow.id}
                className="p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
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
            <AdminPagination total={total} pageSize={PAGE_SIZE} currentPage={page} extraParams={q ? { q } : {}} />
          </div>
        </>
      )}
    </div>
  )
}

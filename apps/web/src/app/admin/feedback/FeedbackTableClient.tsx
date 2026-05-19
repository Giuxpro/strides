'use client'

import { AdminSearch } from '@/components/admin/AdminSearch'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { updateFeedbackStatus } from '@/app/admin/_actions'

const TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
  bug:        { emoji: '🐛', label: 'Bug',          color: 'bg-red-500/10 text-red-400' },
  suggestion: { emoji: '💡', label: 'Sugerencia',   color: 'bg-amber-500/10 text-amber-400' },
  rating:     { emoji: '⭐', label: 'Calificación', color: 'bg-violet-500/10 text-violet-400' },
}
const STATUS_META: Record<string, { label: string; color: string; next: string; nextLabel: string }> = {
  new:      { label: 'Nuevo',    color: 'bg-blue-500/10 text-blue-400',       next: 'reviewed', nextLabel: 'Marcar revisado' },
  reviewed: { label: 'Revisado', color: 'bg-amber-500/10 text-amber-400',     next: 'resolved', nextLabel: 'Marcar resuelto' },
  resolved: { label: 'Resuelto', color: 'bg-emerald-500/10 text-emerald-400', next: 'new',      nextLabel: 'Reabrir' },
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function Stars({ n }: { n: number | null }) {
  if (!n) return <span className="text-gray-600 text-xs">—</span>
  return <span className="text-sm">{'⭐'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

interface FeedbackRow {
  id: string
  type: string
  status: string
  message: string | null
  stars: number | null
  context_url: string | null
  created_at: string
  profiles: { display_name: string | null; email: string } | null
}

interface Props {
  feedbacks: FeedbackRow[]
  total: number
  currentPage: number
  searchValue: string
  pageSize: number
}

export function FeedbackTableClient({ feedbacks, total, currentPage, searchValue, pageSize }: Props) {
  const extraParams: Record<string, string> = searchValue ? { q: searchValue } : {}

  return (
    <>
      <div className="mb-4">
        <AdminSearch initialValue={searchValue} placeholder="Buscar por usuario o mensaje..." />
      </div>

      {feedbacks.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">
            {searchValue ? `Sin resultados para "${searchValue}".` : 'No se encontraron entradas.'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Usuario</th>
                <th className="text-left px-5 py-3 font-medium">Tipo</th>
                <th className="text-left px-5 py-3 font-medium">Calificación</th>
                <th className="text-left px-5 py-3 font-medium w-64">Mensaje</th>
                <th className="text-left px-5 py-3 font-medium">Contexto</th>
                <th className="text-left px-5 py-3 font-medium">Fecha</th>
                <th className="text-left px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {feedbacks.map(f => {
                const typeMeta   = TYPE_META[f.type]     ?? { emoji: '?', label: f.type,   color: 'bg-gray-800 text-gray-400' }
                const statusMeta = STATUS_META[f.status] ?? { label: f.status, color: 'bg-gray-800 text-gray-400', next: 'new', nextLabel: 'Reabrir' }
                const prof = f.profiles
                return (
                  <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white text-sm">{prof?.display_name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{prof?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeMeta.color}`}>
                        {typeMeta.emoji} {typeMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-4"><Stars n={f.stars} /></td>
                    <td className="px-5 py-4 max-w-xs">
                      {f.message
                        ? <p className="text-gray-300 text-xs line-clamp-3 leading-relaxed">{f.message}</p>
                        : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {f.context_url
                        ? <span className="text-xs text-gray-500 font-mono">{f.context_url}</span>
                        : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{fmt(f.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap self-start ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                        <form action={updateFeedbackStatus.bind(null, f.id, statusMeta.next)}>
                          <button type="submit" className="text-xs text-gray-600 hover:text-gray-400 transition-colors text-left">
                            {statusMeta.nextLabel} →
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <AdminPagination total={total} pageSize={pageSize} currentPage={currentPage} extraParams={extraParams} />
        </div>
      )}
    </>
  )
}

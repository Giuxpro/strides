'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { AdminPagination } from '@/components/admin/AdminPagination'

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  trial:         { label: 'Trial',    color: 'bg-blue-500/10 text-blue-400' },
  prepaid:       { label: 'Prepago',  color: 'bg-amber-500/10 text-amber-400' },
  complimentary: { label: 'Cortesía', color: 'bg-emerald-500/10 text-emerald-400' },
}
const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active:          { label: 'Activo',    color: 'bg-emerald-500/10 text-emerald-400' },
  pending_payment: { label: 'Sin pagar', color: 'bg-amber-500/10 text-amber-400' },
  expired:         { label: 'Vencido',   color: 'bg-red-500/10 text-red-400' },
}

function daysSince(date: string | null): number | null {
  if (!date) return null
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}
function fmtDays(n: number | null, prefix = ''): string {
  if (n === null) return '—'
  if (n === 0) return 'Hoy'
  const label = n === 1 ? 'día' : 'días'
  return prefix ? `${prefix} ${n} ${label}` : `${n} ${label}`
}
function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface UserRow {
  id: string
  email: string
  display_name: string | null
  acquisition_type: string | null
  status: string | null
  children_count: number
  pending_discount_percent: number | null
  pending_discount_months: number | null
  last_sign_in_at: string | null
  last_activity: string | null
  total_completions: number
  joined_at: string | null
  trial_ends_at: string | null
  redeemed_code: string | null
  sub_created_at: string | null
}

const PLAN_FILTERS  = [
  { value: 'trial',         label: 'Trial' },
  { value: 'prepaid',       label: 'Prepago' },
  { value: 'complimentary', label: 'Cortesía' },
]
const STATUS_FILTERS = [
  { value: 'active',          label: 'Activo' },
  { value: 'pending_payment', label: 'Sin pagar' },
  { value: 'expired',         label: 'Vencido' },
]

interface Props {
  users: UserRow[]
  total: number
  currentPage: number
  searchValue: string
  planFilter: string
  statusFilter: string
  pageSize: number
  avatarByUser: Record<string, string | null>
  codeIdByUser: Record<string, string>
  monthlyPrice: number | null
  promoPercent: number
}

export function UsersTableClient({
  users, total, currentPage, searchValue, planFilter, statusFilter, pageSize,
  avatarByUser, codeIdByUser, monthlyPrice, promoPercent,
}: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function toggleFilter(key: 'plan' | 'status', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (params.get(key) === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`))
  }

  const extraParams: Record<string, string> = {}
  if (searchValue)  extraParams.q      = searchValue
  if (planFilter)   extraParams.plan   = planFilter
  if (statusFilter) extraParams.status = statusFilter

  function effectivePrice(u: UserRow): string {
    if (!monthlyPrice) return '—'
    if (u.acquisition_type === 'trial' || u.acquisition_type === 'complimentary') return '—'
    if (!u.status || u.status === 'pending_payment' || u.status === 'expired') return '—'
    const pct = u.pending_discount_percent ?? promoPercent
    if (!pct) return `$${monthlyPrice.toFixed(2)}`
    return `$${(monthlyPrice * (1 - pct / 100)).toFixed(2)}`
  }

  return (
    <>
      <div className="mb-3">
        <AdminSearch initialValue={searchValue} placeholder="Buscar por email o nombre..." />
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-600 mr-1">Plan</span>
          {PLAN_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => toggleFilter('plan', f.value)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                planFilter === f.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-gray-800" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-600 mr-1">Estado</span>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => toggleFilter('status', f.value)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {(planFilter || statusFilter) && (
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.delete('plan')
              params.delete('status')
              params.delete('page')
              startTransition(() => router.replace(`${pathname}?${params.toString()}`))
            }}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors ml-auto"
          >
            Limpiar filtros ×
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">
            {searchValue ? `Sin resultados para "${searchValue}".` : 'No se encontraron usuarios.'}
          </p>
        </div>
      ) : (
        <div className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-opacity duration-150 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium w-8">#</th>
                <th className="text-left px-5 py-3 font-medium">Usuario</th>
                <th className="text-left px-5 py-3 font-medium">Plan</th>
                <th className="text-left px-5 py-3 font-medium">Estado</th>
                <th className="text-left px-5 py-3 font-medium">Hijos</th>
                <th className="text-left px-5 py-3 font-medium">Pagando</th>
                <th className="text-left px-5 py-3 font-medium">Descuento</th>
                <th className="text-left px-5 py-3 font-medium">Último acceso</th>
                <th className="text-left px-5 py-3 font-medium">Días en app</th>
                <th className="text-left px-5 py-3 font-medium">Actividad</th>
                <th className="text-left px-5 py-3 font-medium">Código</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((u, idx) => {
                const rowNumber = (currentPage - 1) * pageSize + idx + 1
                const plan   = PLAN_BADGE[u.acquisition_type ?? '']
                const status = STATUS_BADGE[u.status ?? '']
                const daysInApp    = daysSince(u.joined_at)
                const daysInactive = daysSince(u.last_activity ?? u.last_sign_in_at)
                const effectiveStatus = status ?? { label: '—', color: 'bg-gray-800 text-gray-500' }
                const avatar = avatarByUser[u.id]

                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 text-xs text-gray-600 tabular-nums">{rowNumber}</td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 hover:text-violet-400 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-base shrink-0">
                          {avatar ?? '👤'}
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-violet-400 transition-colors">{u.display_name ?? '—'}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                          <p className="text-xs text-gray-600 mt-0.5">Desde {fmt(u.joined_at)}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {plan
                        ? <span className={`text-xs font-semibold px-2 py-1 rounded-full ${plan.color}`}>{plan.label}</span>
                        : <span className="text-xs text-gray-600">Sin plan</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${effectiveStatus.color}`}>
                        {effectiveStatus.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-gray-300 font-mono">{u.children_count ?? 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-gray-300 font-mono text-sm">{effectivePrice(u)}</span>
                      <span className="text-xs text-gray-600 block">/mes</span>
                    </td>
                    <td className="px-5 py-4">
                      {u.pending_discount_percent
                        ? <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full">
                            -{u.pending_discount_percent}%
                            {u.pending_discount_months ? ` · ${u.pending_discount_months}m` : ' · ∞'}
                          </span>
                        : promoPercent
                          ? <span className="text-xs bg-violet-500/10 text-violet-400 px-2 py-1 rounded-full">-{promoPercent}% promo</span>
                          : <span className="text-xs text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{fmt(u.last_sign_in_at)}</td>
                    <td className="px-5 py-4">
                      <span className="text-gray-300 font-mono text-sm">{fmtDays(daysInApp)}</span>
                    </td>
                    <td className="px-5 py-4">
                      {u.last_activity
                        ? <span className={`text-xs font-medium ${daysInactive! > 7 ? 'text-red-400' : daysInactive! > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {daysInactive === 0 ? 'Hoy' : `Hace ${fmtDays(daysInactive)}`}
                          </span>
                        : <span className="text-xs text-gray-600">Sin actividad</span>}
                      {u.total_completions > 0 && (
                        <span className="text-xs text-gray-600 block">{String(u.total_completions)} lecciones</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {u.redeemed_code && codeIdByUser[u.id]
                        ? <Link href={`/admin/codes/${codeIdByUser[u.id]}`} className="font-mono text-xs text-violet-400 hover:text-violet-300 hover:underline transition-colors">
                            {u.redeemed_code}
                          </Link>
                        : u.redeemed_code
                          ? <span className="font-mono text-xs text-violet-400">{u.redeemed_code}</span>
                          : <span className="text-xs text-gray-600">—</span>}
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

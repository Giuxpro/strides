import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  trial:         { label: 'Trial',      color: 'bg-blue-500/10 text-blue-400' },
  prepaid:       { label: 'Prepago',    color: 'bg-amber-500/10 text-amber-400' },
  complimentary: { label: 'Cortesía',   color: 'bg-emerald-500/10 text-emerald-400' },
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

export default async function AdminUsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/kids/play')

  const admin = createAdminClient()

  const [{ data: users }, { data: priceRow }, { data: discountRow }] = await Promise.all([
    admin.rpc('get_admin_users_overview'),
    admin.from('settings').select('value').eq('key', 'monthly_price').maybeSingle(),
    admin.from('settings').select('value').eq('key', 'global_discount').maybeSingle(),
  ])

  const monthlyPrice   = (priceRow?.value as number) ?? null
  const globalDiscount = discountRow?.value as { enabled: boolean; percent: number } | null
  const promoPercent   = globalDiscount?.enabled ? (globalDiscount.percent ?? 0) : 0

  function effectivePrice(discountPct: number | null): string {
    if (!monthlyPrice) return '—'
    const pct = discountPct ?? promoPercent
    if (!pct) return `$${monthlyPrice.toFixed(2)}`
    return `$${(monthlyPrice * (1 - pct / 100)).toFixed(2)}`
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Usuarios</h1>
          <p className="text-sm text-gray-500">{users?.length ?? 0} usuario{users?.length !== 1 ? 's' : ''} registrado{users?.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {(!users || users.length === 0) ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">Aún no hay usuarios registrados.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
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
              {users.map(u => {
                const plan   = PLAN_BADGE[u.acquisition_type ?? '']
                const status = STATUS_BADGE[u.status ?? '']
                const daysInApp     = daysSince(u.joined_at)
                const daysInactive  = daysSince(u.last_activity ?? u.last_sign_in_at)
                const isTrialExpired = u.acquisition_type === 'trial' && u.trial_ends_at && new Date(u.trial_ends_at) < new Date()
                const effectiveStatus = isTrialExpired
                  ? { label: 'Vencido', color: 'bg-red-500/10 text-red-400' }
                  : (status ?? { label: '—', color: 'bg-gray-800 text-gray-500' })

                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/admin/users/${u.id}`} className="hover:text-violet-400 transition-colors">
                        <p className="font-medium text-white">{u.display_name ?? '—'}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Desde {fmt(u.joined_at)}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {plan
                        ? <span className={`text-xs font-semibold px-2 py-1 rounded-full ${plan.color}`}>{plan.label}</span>
                        : <span className="text-xs text-gray-600">Sin plan</span>
                      }
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
                      <span className="text-gray-300 font-mono text-sm">
                        {effectivePrice(u.pending_discount_percent)}
                      </span>
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
                          : <span className="text-xs text-gray-600">—</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {fmt(u.last_sign_in_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-gray-300 font-mono text-sm">{fmtDays(daysInApp)}</span>
                    </td>
                    <td className="px-5 py-4">
                      {u.last_activity
                        ? <span className={`text-xs font-medium ${daysInactive! > 7 ? 'text-red-400' : daysInactive! > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {daysInactive === 0 ? 'Hoy' : `Hace ${fmtDays(daysInactive)}`}
                          </span>
                        : <span className="text-xs text-gray-600">Sin actividad</span>
                      }
                      {u.total_completions > 0 && (
                        <span className="text-xs text-gray-600 block">{String(u.total_completions)} lecciones</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {u.redeemed_code
                        ? <span className="font-mono text-xs text-violet-400">{u.redeemed_code}</span>
                        : <span className="text-xs text-gray-600">—</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

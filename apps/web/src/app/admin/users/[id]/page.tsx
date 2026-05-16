import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

const PLAN_COLORS: Record<string, string> = {
  trial:         'bg-blue-500/10 text-blue-400',
  prepaid:       'bg-amber-500/10 text-amber-400',
  complimentary: 'bg-emerald-500/10 text-emerald-400',
}
const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial', prepaid: 'Prepago', complimentary: 'Cortesía permanente',
}

function fmt(date: string | null, withTime = false) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

function daysSince(date: string | null) {
  if (!date) return null
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}

function fmtDays(n: number | null): string {
  if (n === null) return '—'
  if (n === 0) return 'Hoy'
  return n === 1 ? '1 día' : `${n} días`
}

function monthsSince(date: string | null) {
  if (!date) return null
  const d = new Date(date)
  const now = new Date()
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
}

export default async function AdminUserDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { from?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/kids/play')

  const admin = createAdminClient()

  const [
    { data: usersData },
    { data: children },
    { data: redemptions },
    { data: priceRow },
    { data: profileRow },
  ] = await Promise.all([
    admin.rpc('get_admin_users_overview'),
    admin.rpc('get_admin_user_detail', { p_user_id: params.id }),
    admin.from('code_redemptions')
      .select('*, access_codes(code, label, access_type)')
      .eq('user_id', params.id)
      .order('redeemed_at', { ascending: false }),
    admin.from('settings').select('value').eq('key', 'monthly_price').maybeSingle(),
    admin.from('profiles').select('avatar').eq('id', params.id).maybeSingle(),
  ])

  const u = usersData?.find(x => x.id === params.id)
  if (!u) notFound()

  const monthlyPrice = (priceRow?.value as number) ?? null
  const avatar = (profileRow?.avatar as string | null) ?? null
  const discountPct  = u.pending_discount_percent ?? 0
  const pricePaying  = monthlyPrice ? monthlyPrice * (1 - discountPct / 100) : null
  const daysInApp    = daysSince(u.joined_at)
  const monthsActive = monthsSince(u.sub_created_at)
  const isTrialExpired = u.acquisition_type === 'trial' && u.trial_ends_at && new Date(u.trial_ends_at) < new Date()
  const trialDaysLeft  = u.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(u.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href={searchParams.from ?? '/admin/users'}
        className="text-sm text-gray-500 hover:text-gray-300 mb-6 inline-block transition-colors"
      >
        ← Volver a {searchParams.from?.includes('/redemptions') ? 'canjes' : 'usuarios'}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center text-2xl shrink-0">
            {avatar ?? '👤'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-0.5">{u.display_name ?? u.email}</h1>
            {u.display_name && <p className="text-sm text-gray-500">{u.email}</p>}
            <p className="text-xs text-gray-600 mt-1">Se unió el {fmt(u.joined_at)} · {daysInApp} días en la plataforma</p>
          </div>
        </div>
        {u.acquisition_type && (
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${PLAN_COLORS[u.acquisition_type] ?? ''}`}>
            {PLAN_LABELS[u.acquisition_type] ?? u.acquisition_type}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Días en la app',    value: fmtDays(daysInApp) },
          { label: 'Meses activo',      value: monthsActive != null ? `${monthsActive}m` : '—' },
          { label: 'Perfiles de hijos', value: String(u.children_count ?? 0) },
          { label: 'Lecciones totales', value: String(u.total_completions ?? 0) },
          { label: 'Último acceso',     value: fmt(u.last_sign_in_at) },
          { label: 'Última actividad',  value: u.last_activity ? (daysSince(u.last_activity) === 0 ? 'Hoy' : `Hace ${fmtDays(daysSince(u.last_activity))}`) : 'Sin actividad' },
          { label: 'Estado',            value: isTrialExpired ? 'Trial vencido' : (u.status ?? '—') },
          { label: 'Pagando',           value: pricePaying ? `$${pricePaying.toFixed(2)}/mes` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Suscripción */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Suscripción</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Tipo</span>
            <span className="text-white">{PLAN_LABELS[u.acquisition_type ?? ''] ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Estado</span>
            <span className={isTrialExpired ? 'text-red-400' : u.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}>
              {isTrialExpired ? 'Vencido' : u.status ?? '—'}
            </span>
          </div>
          {u.acquisition_type === 'trial' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Vence el</span>
                <span className="text-white">{fmt(u.trial_ends_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Días restantes</span>
                <span className={trialDaysLeft === 0 ? 'text-red-400' : 'text-white'}>{trialDaysLeft ?? '—'}</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Precio base</span>
            <span className="text-white">{monthlyPrice ? `$${monthlyPrice.toFixed(2)}/mes` : '—'}</span>
          </div>
          {discountPct > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Descuento</span>
                <span className="text-emerald-400">-{discountPct}%{u.pending_discount_months ? ` · ${u.pending_discount_months} meses` : ' · permanente'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Precio final</span>
                <span className="text-white font-semibold">${pricePaying?.toFixed(2)}/mes</span>
              </div>
            </>
          )}
          {u.redeemed_code && (
            <div className="flex justify-between">
              <span className="text-gray-500">Código canjeado</span>
              <span className="font-mono text-violet-400">{u.redeemed_code}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Inicio suscripción</span>
            <span className="text-white">{fmt(u.sub_created_at)}</span>
          </div>
        </div>
      </section>

      {/* Hijos */}
      {children && children.length > 0 && (
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Perfiles de hijos ({children.length})
          </h2>
          <div className="space-y-4">
            {children.map(ch => (
              <div key={ch.child_id} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg flex-shrink-0">
                  {ch.child_avatar ?? '🧒'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-white">{ch.child_name} <span className="text-gray-500 font-normal text-xs">({ch.child_age} años)</span></p>
                    <div className="flex items-center gap-2">
                      {ch.current_streak > 0 && (
                        <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">🔥 {ch.current_streak} días</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    <div>
                      <span className="text-gray-500">Módulo actual: </span>
                      <span className="text-gray-300">{ch.last_module_name ?? 'Sin actividad'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Última lección: </span>
                      <span className="text-gray-300">{ch.last_lesson_name ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Lecciones: </span>
                      <span className="text-gray-300">{String(ch.total_completions)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Retos completados: </span>
                      <span className="text-gray-300">{String(ch.challenges_completed)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Partidas jugadas: </span>
                      <span className="text-gray-300">{String(ch.total_game_plays)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Juego favorito: </span>
                      <span className="text-gray-300">{ch.favorite_game ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Última actividad: </span>
                      <span className={ch.last_activity
                        ? daysSince(ch.last_activity)! > 7 ? 'text-red-400'
                          : daysSince(ch.last_activity)! > 3 ? 'text-amber-400'
                          : 'text-emerald-400'
                        : 'text-gray-600'
                      }>
                        {ch.last_activity
                          ? daysSince(ch.last_activity) === 0 ? 'Hoy' : `Hace ${fmtDays(daysSince(ch.last_activity))}`
                          : 'Sin actividad'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historial de códigos */}
      {redemptions && redemptions.length > 0 && (
        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Códigos canjeados ({redemptions.length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left px-6 py-3 font-medium">Código</th>
                <th className="text-left px-6 py-3 font-medium">Tipo</th>
                <th className="text-left px-6 py-3 font-medium">Ruta de canje</th>
                <th className="text-left px-6 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {redemptions.map(r => {
                const ac = r.access_codes as { code: string; label: string; access_type: string } | null
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <Link href={`/admin/codes/${r.code_id}`} className="font-mono text-violet-400 hover:underline">{ac?.code ?? '—'}</Link>
                      <p className="text-xs text-gray-600 mt-0.5">{ac?.label}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{ac?.access_type ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                        {r.context === 'signup' ? 'Durante registro' : 'Desde cuenta'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{fmt(r.redeemed_at, true)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

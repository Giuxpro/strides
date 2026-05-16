import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getAllRedemptions } from '@strides/db'
import { redirect } from 'next/navigation'
import { RedemptionsSearch } from './RedemptionsSearch'

const TYPE_LABELS: Record<string, string> = {
  trial:               'Trial',
  complimentary:       'Cortesía',
  discount:            'Descuento',
  trial_plus_discount: 'Trial + Desc.',
}

const CONTEXT_LABELS: Record<string, string> = {
  signup:  'Registro',
  account: 'Cuenta',
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function RedemptionsPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/kids/play')

  const search = searchParams.q?.trim() ?? ''
  const { data: redemptions } = await getAllRedemptions(supabase, search || undefined)

  // Obtener el código activo actual por usuario (redeemed_code_id en subscriptions)
  const userIds = [...new Set((redemptions ?? []).map(r => r.user_id))]
  let activeCodeByUser: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('user_id, redeemed_code_id')
      .in('user_id', userIds)
    activeCodeByUser = Object.fromEntries(
      (subs ?? [])
        .filter(s => s.redeemed_code_id)
        .map(s => [s.user_id, s.redeemed_code_id as string])
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/admin/codes" className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6 inline-block">
        ← Volver a códigos
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Todos los canjes</h1>
          <p className="text-sm text-gray-500">
            {search
              ? `${redemptions?.length ?? 0} resultado${redemptions?.length !== 1 ? 's' : ''} para "${search}"`
              : `${redemptions?.length ?? 0} canje${redemptions?.length !== 1 ? 's' : ''} registrado${redemptions?.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <RedemptionsSearch initialValue={search} />

      {(!redemptions || redemptions.length === 0) ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">
            {search ? `No se encontraron canjes para "${search}".` : 'Aún no hay canjes registrados.'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Usuario</th>
                <th className="text-left px-5 py-3 font-medium">Código</th>
                <th className="text-left px-5 py-3 font-medium">Tipo</th>
                <th className="text-left px-5 py-3 font-medium">Vía</th>
                <th className="text-left px-5 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {redemptions.map(r => {
                const prof    = r.profiles as { email: string; display_name: string | null } | null
                const ac      = r.access_codes as { id: string; code: string; label: string; access_type: string } | null
                const isActive = ac && activeCodeByUser[r.user_id] === ac.id
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/users/${r.user_id}?from=/admin/codes/redemptions${search ? `?q=${encodeURIComponent(search)}` : ''}`}
                        className="hover:text-violet-400 transition-colors"
                      >
                        <p className="text-white font-medium">{prof?.display_name ?? '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{prof?.email}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {ac ? (
                        <Link href={`/admin/codes/${ac.id}?from=/admin/codes/redemptions${search ? `?q=${encodeURIComponent(search)}` : ''}`} className="hover:text-violet-400 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-white">{ac.code}</span>
                            {isActive && (
                              <span className="text-xs bg-emerald-500/15 text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                                En uso
                              </span>
                            )}
                          </div>
                          <span className="block text-xs text-gray-500 mt-0.5">{ac.label}</span>
                        </Link>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-400">
                        {TYPE_LABELS[ac?.access_type ?? ''] ?? ac?.access_type ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                        {CONTEXT_LABELS[r.context] ?? r.context}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {fmt(r.redeemed_at)}
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

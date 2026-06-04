import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAccessCodeById, getRedemptionsByCodeId } from '@strides/db'
import { toggleCodeActive, deleteAccessCode } from '@/app/admin/codes/_actions'
import { CodesRealtimeRefresher } from '@/components/admin/codes/CodesRealtimeRefresher'

const TYPE_LABELS: Record<string, string> = {
  trial:               'Trial',
  complimentary:       'Cortesía permanente',
  discount:            'Descuento',
  trial_plus_discount: 'Trial + Descuento',
}

const CONTEXT_LABELS: Record<string, string> = {
  signup:  'Registro',
  account: 'Cuenta',
}

export default async function CodeDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { from?: string } }) {
  const supabase = createClient()
  const [{ data: code }, { data: redemptions }] = await Promise.all([
    getAccessCodeById(supabase, params.id),
    getRedemptionsByCodeId(supabase, params.id),
  ])

  if (!code) notFound()

  const usesLeft = code.max_uses === null ? null : code.max_uses - code.used_count
  const expired = code.valid_until && new Date(code.valid_until) < new Date()
  const isEffectivelyActive = code.is_active && !expired && usesLeft !== 0

  return (
    <div className="p-8 max-w-4xl">
      <CodesRealtimeRefresher />
      <Link
        href={searchParams.from ?? '/admin/codes'}
        className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6 inline-block"
      >
        ← Volver a {searchParams.from?.includes('/redemptions') ? 'canjes' : 'códigos'}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white font-mono">{code.code}</h1>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isEffectivelyActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {!code.is_active ? 'Inactivo' : expired ? 'Expirado' : usesLeft === 0 ? 'Agotado' : 'Activo'}
            </span>
          </div>
          <p className="text-gray-400 text-sm">{code.label}</p>
        </div>

        <div className="flex gap-2">
          <form action={toggleCodeActive.bind(null, code.id, !code.is_active)}>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                code.is_active
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {code.is_active ? 'Desactivar' : 'Activar'}
            </button>
          </form>

          {code.used_count === 0 && (
            <form action={deleteAccessCode}>
              <input type="hidden" name="id" value={code.id} />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              >
                Eliminar
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tipo', value: TYPE_LABELS[code.access_type] ?? code.access_type },
          { label: 'Usos', value: code.max_uses === null ? `${code.used_count} / ∞` : `${code.used_count} / ${code.max_uses}` },
          { label: 'Usos restantes', value: code.max_uses === null ? '∞' : String(usesLeft) },
          { label: 'Código expira el', value: code.valid_until ? new Date(code.valid_until).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha límite' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Config del código */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Configuración</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {code.trial_days && (
            <div><span className="text-gray-500">Días de trial:</span> <span className="text-white ml-2">{code.trial_days} {code.trial_days === 1 ? 'día' : 'días'}</span></div>
          )}
          {code.discount_percent && (
            <div><span className="text-gray-500">Descuento:</span> <span className="text-white ml-2">{code.discount_percent}%</span></div>
          )}
          {code.discount_duration_months && (
            <div><span className="text-gray-500">Duración descuento:</span> <span className="text-white ml-2">{code.discount_duration_months} {code.discount_duration_months === 1 ? 'mes' : 'meses'}</span></div>
          )}
          {!code.discount_duration_months && code.discount_percent && (
            <div><span className="text-gray-500">Duración descuento:</span> <span className="text-white ml-2">Permanente</span></div>
          )}
          <div><span className="text-gray-500">Creado:</span> <span className="text-white ml-2">{new Date(code.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
        </div>
      </section>

      {/* Redemptions */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Canjes ({redemptions?.length ?? 0})
          </h2>
        </div>

        {(!redemptions || redemptions.length === 0) ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-600">Nadie ha canjeado este código aún.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left px-6 py-3 font-medium">Usuario</th>
                <th className="text-left px-6 py-3 font-medium">Canjeado</th>
                <th className="text-left px-6 py-3 font-medium">Contexto</th>
                <th className="text-left px-6 py-3 font-medium">Efecto aplicado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {redemptions.map(r => {
                const profile = r.profiles as { email: string; display_name: string | null } | null
                const effect = r.effect_applied as Record<string, unknown>
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <p className="text-white">{profile?.display_name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{profile?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(r.redeemed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                        {CONTEXT_LABELS[r.context] ?? r.context}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                      {Object.entries(effect).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

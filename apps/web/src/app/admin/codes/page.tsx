import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getAllAccessCodes } from '@strides/db'
import { CodesRealtimeRefresher } from '@/components/admin/CodesRealtimeRefresher'

const TYPE_LABELS: Record<string, string> = {
  trial:               'Trial',
  complimentary:       'Cortesía',
  discount:            'Descuento',
  trial_plus_discount: 'Trial + Desc.',
}

const TYPE_COLORS: Record<string, string> = {
  trial:               'bg-blue-500/10 text-blue-400',
  complimentary:       'bg-emerald-500/10 text-emerald-400',
  discount:            'bg-amber-500/10 text-amber-400',
  trial_plus_discount: 'bg-violet-500/10 text-violet-400',
}

export default async function CodesPage() {
  const supabase = createClient()
  const { data: codes } = await getAllAccessCodes(supabase)

  return (
    <div className="p-8 max-w-5xl">
      <CodesRealtimeRefresher />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Códigos de acceso</h1>
          <p className="text-sm text-gray-500">{codes?.length ?? 0} código{codes?.length !== 1 ? 's' : ''} creado{codes?.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/codes/new"
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
        >
          + Nuevo código
        </Link>
      </div>

      {(!codes || codes.length === 0) ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm mb-4">Aún no hay códigos creados.</p>
          <Link href="/admin/codes/new" className="text-violet-400 hover:text-violet-300 text-sm">
            Crear primer código →
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Código</th>
                <th className="text-left px-5 py-3 font-medium">Tipo</th>
                <th className="text-left px-5 py-3 font-medium">Usos</th>
                <th className="text-left px-5 py-3 font-medium">Código expira el</th>
                <th className="text-left px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {codes.map(c => {
                const usesLabel = c.max_uses === null
                  ? `${c.used_count} / ∞`
                  : `${c.used_count} / ${c.max_uses}`
                const usesLeft = c.max_uses === null ? null : c.max_uses - c.used_count
                const expired = c.valid_until && new Date(c.valid_until) < new Date()

                return (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/admin/codes/${c.id}`} className="hover:text-violet-400 transition-colors">
                        <span className="font-mono font-semibold text-white">{c.code}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">{c.label}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${TYPE_COLORS[c.access_type] ?? 'bg-gray-700 text-gray-300'}`}>
                        {TYPE_LABELS[c.access_type] ?? c.access_type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-mono text-sm ${usesLeft === 0 ? 'text-red-400' : 'text-gray-300'}`}>
                        {usesLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {c.valid_until
                        ? <span className={expired ? 'text-red-400' : ''}>
                            {new Date(c.valid_until).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        : <span className="text-gray-600">Sin fecha</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        !c.is_active || expired || usesLeft === 0
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {!c.is_active ? 'Inactivo' : expired ? 'Expirado' : usesLeft === 0 ? 'Agotado' : 'Activo'}
                      </span>
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

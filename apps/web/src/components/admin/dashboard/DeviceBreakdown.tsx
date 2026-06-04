'use client'

import type { DeviceBreakdown } from '@strides/db'
import { InfoTooltip } from '@/components/admin/shared/InfoTooltip'

interface Props extends DeviceBreakdown {}

const DEVICES = [
  { key: 'mobile'  as const, label: 'Móvil',    icon: '📱', color: '#A78BFA' },
  { key: 'tablet'  as const, label: 'Tablet',   icon: '📟', color: '#38BDF8' },
  { key: 'desktop' as const, label: 'Escritorio', icon: '🖥️', color: '#34D399' },
]

export function DeviceBreakdown({ mobile, tablet, desktop, total }: Props) {
  const values = { mobile, tablet, desktop }
  const max = Math.max(mobile, tablet, desktop, 1)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: '20px',
      }}
    >
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-white">Dispositivos</h2>
          <InfoTooltip text="Muestra desde qué tipo de pantalla se conectan los niños al jugar. Se registra una sesión cada vez que un niño entra a /kids/play. Útil para saber si priorizar la experiencia móvil, tablet o desktop al diseñar juegos y pantallas." />
        </div>
        <p className="text-[11px] text-gray-600 mt-0.5">
          {total > 0 ? `${total.toLocaleString()} sesiones registradas` : 'Sin sesiones aún'}
        </p>
      </div>

      <div className="space-y-4">
        {DEVICES.map(d => {
          const count = values[d.key]
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const barPct = total > 0 ? (count / max) * 100 : 0

          return (
            <div key={d.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{d.icon}</span>
                  <span className="text-xs text-gray-300">{d.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: d.color, fontVariantNumeric: 'tabular-nums' }}>
                    {count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-600 w-7 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barPct}%`, background: `linear-gradient(90deg, ${d.color}99, ${d.color})` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { InfoTooltip } from '@/components/admin/shared/InfoTooltip'

interface Props {
  paidActive: number
  trialActive: number
  complimentaryActive: number
  trialExpired: number
  paidExpired: number
  checkoutAbandoned: number
  monthlyPrice: number
  currencySymbol: string
}

interface TPayload { value: number; name: string; payload: { color: string } }
interface TProps { active?: boolean; payload?: TPayload[] }

function CustomTooltip({ active, payload }: TProps) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p?.payload?.color, display: 'inline-block' }} />
        <span style={{ color: '#9CA3AF' }}>{p?.name}</span>
        <span style={{ color: '#F9FAFB', fontWeight: 700, marginLeft: 8, fontVariantNumeric: 'tabular-nums' }}>{p?.value}</span>
      </div>
    </div>
  )
}

interface Slice {
  name: string
  value: number
  color: string
  active: boolean
  tooltip: string
}

function LegendRow({ s, total }: { s: Slice; total: number }) {
  const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: s.value > 0 ? s.color : 'rgba(255,255,255,0.1)' }}
        />
        <span className="text-xs truncate" style={{ color: s.value > 0 ? '#9CA3AF' : '#374151' }}>
          {s.name}
        </span>
        <div className="relative group cursor-help shrink-0 flex items-center">
          <span className="text-[11px] leading-none select-none" style={{ color: s.value > 0 ? '#94A3B8' : '#374151' }}>ⓘ</span>
          <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-900 border border-gray-700 rounded-xl p-3 text-[11px] text-gray-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[200] shadow-xl whitespace-normal leading-relaxed">
            {s.tooltip}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span
          className="text-xs font-semibold"
          style={{ color: s.value > 0 ? '#F9FAFB' : '#1F2937', fontVariantNumeric: 'tabular-nums' }}
        >
          {s.value}
        </span>
        <span
          className="text-[10px] w-7 text-right"
          style={{ color: s.value > 0 ? '#4B5563' : '#111827', fontVariantNumeric: 'tabular-nums' }}
        >
          {pct}%
        </span>
      </div>
    </div>
  )
}

export function SubBreakdown({ paidActive, trialActive, complimentaryActive, trialExpired, paidExpired, checkoutAbandoned, monthlyPrice, currencySymbol }: Props) {
  const allSlices: Slice[] = [
    {
      name: 'Activos pagados', value: paidActive, color: '#10B981', active: true,
      tooltip: 'Pagaron a través del proveedor de pago y su suscripción está vigente. Son la base del MRR.',
    },
    {
      name: 'Trial activo', value: trialActive, color: '#F59E0B', active: true,
      tooltip: 'Período de prueba gratuita vigente. Vienen del registro estándar o de un código "Trial gratuito". Se convierten en pago cuando venza el trial.',
    },
    {
      name: 'Cortesía permanente', value: complimentaryActive, color: '#818CF8', active: true,
      tooltip: 'Acceso gratuito permanente otorgado con un código de cortesía. Sin vencimiento ni pago requerido.',
    },
    {
      name: 'Trial vencido', value: trialExpired, color: '#F87171', active: false,
      tooltip: 'Hicieron el trial gratuito pero no se convirtieron a pago. Problema de adquisición: conocen el producto pero no dieron el paso. Acción sugerida: descuento de primera compra.',
    },
    {
      name: 'Pago vencido', value: paidExpired, color: '#EF4444', active: false,
      tooltip: 'Eran clientes pagos cuya suscripción venció sin renovar (churn). Ya conocen y pagaron el producto. Acción sugerida: campaña de win-back o descuento de renovación.',
    },
    {
      name: 'Abandono de checkout', value: checkoutAbandoned, color: '#4B5563', active: false,
      tooltip: 'Se registraron eligiendo el flujo de pago directo pero no completaron el pago. Llegaron con intención de pagar y se perdieron en el proceso.',
    },
  ]

  const donutSlices    = allSlices.filter(s => s.value > 0)
  const activeSlices   = allSlices.filter(s => s.active)
  const inactiveSlices = allSlices.filter(s => !s.active)

  const activeTotal         = paidActive + trialActive + complimentaryActive
  const total               = allSlices.reduce((n, s) => n + s.value, 0)
  const mrr                 = paidActive * monthlyPrice
  const conversionPotential = trialExpired + paidExpired + checkoutAbandoned

  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '20px' }}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-white">Suscripciones</h2>
            <InfoTooltip text="Ciclo de vida completo de todas las cuentas. 'Activas' tienen acceso hoy (pagado, trial o cortesía). 'Inactivas' lo perdieron. Las conversiones potenciales son usuarios que ya conocen la app y podrían pagar si los contactás." />
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">{total} en total</p>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-lg"
          style={{
            background: activeTotal > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
            color: activeTotal > 0 ? '#34D399' : '#4B5563',
            border: `1px solid ${activeTotal > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`,
          }}
        >
          {activeTotal} activa{activeTotal !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Donut + Leyenda */}
      <div className="flex items-center gap-5">
        <div style={{ width: 140, height: 140, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutSlices.length > 0 ? donutSlices : [{ name: '', value: 1, color: '#1f2937', active: false, tooltip: '' }]}
                cx="50%" cy="50%"
                innerRadius={44} outerRadius={64}
                paddingAngle={donutSlices.length > 1 ? 3 : 0}
                dataKey="value"
                strokeWidth={0}
              >
                {(donutSlices.length > 0 ? donutSlices : [{ color: '#1f2937' }]).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3 min-w-0 pl-1">
          <div className="space-y-1.5">
            <p className="text-[9px] font-semibold tracking-widest uppercase text-gray-700">Activas</p>
            {activeSlices.map(s => <LegendRow key={s.name} s={s} total={total} />)}
          </div>
          <div className="space-y-1.5">
            <p className="text-[9px] font-semibold tracking-widest uppercase text-gray-700">Inactivas</p>
            {inactiveSlices.map(s => <LegendRow key={s.name} s={s} total={total} />)}
          </div>
        </div>
      </div>

      {/* MRR */}
      <div className="mt-4 pt-4 border-t border-white/[0.05] space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-600">MRR</span>
            <div className="relative group cursor-help flex items-center">
              <span className="text-[11px] leading-none select-none text-slate-400">ⓘ</span>
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-900 border border-gray-700 rounded-xl p-3 text-[11px] text-gray-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[200] shadow-xl text-left whitespace-normal">
                Ingresos mensuales recurrentes. Solo incluye suscripciones activas y pagadas. No cuenta trials, cortesías ni vencidas.
              </div>
            </div>
          </div>
          <span className="text-sm font-bold" style={{ color: mrr > 0 ? '#34D399' : '#4B5563', fontVariantNumeric: 'tabular-nums' }}>
            {mrr > 0 ? `${currencySymbol}${mrr.toLocaleString('es-AR')}` : paidActive === 0 ? 'Sin pagos aún' : '—'}
          </span>
        </div>
        {paidActive > 0 && monthlyPrice > 0 && (
          <p className="text-[10px] text-gray-700">
            {paidActive} activa{paidActive !== 1 ? 's' : ''} × {currencySymbol}{monthlyPrice}/mes
          </p>
        )}
      </div>

      {/* Conversiones potenciales */}
      {conversionPotential > 0 && (
        <div
          className="mt-3 rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <div>
            <p className="text-[11px] font-semibold" style={{ color: '#FCD34D' }}>Conversiones potenciales</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#78716C' }}>
              {paidExpired > 0 && `${paidExpired} pago vencido`}
              {paidExpired > 0 && (trialExpired > 0 || checkoutAbandoned > 0) && ' · '}
              {trialExpired > 0 && `${trialExpired} trial vencido`}
              {trialExpired > 0 && checkoutAbandoned > 0 && ' · '}
              {checkoutAbandoned > 0 && `${checkoutAbandoned} abandono de checkout`}
            </p>
          </div>
          <span className="text-lg font-extrabold" style={{ color: '#F59E0B', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
            {conversionPotential}
          </span>
        </div>
      )}
    </div>
  )
}

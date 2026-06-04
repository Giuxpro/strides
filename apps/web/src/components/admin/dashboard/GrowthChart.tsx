'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { GrowthPoint } from '@strides/db'
import { InfoTooltip } from '@/components/admin/shared/InfoTooltip'

function fmtDay(day: string) {
  const d = new Date(day + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

interface TPayload { value: number; name: string; color: string }
interface TProps { active?: boolean; payload?: TPayload[]; label?: string }

function CustomTooltip({ active, payload, label }: TProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', minWidth: 150 }}>
      <p style={{ color: '#6B7280', fontSize: 11, marginBottom: 8 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: '#9CA3AF' }}>{p.name}</span>
          <span style={{ color: '#F9FAFB', fontWeight: 700, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  data: GrowthPoint[]
  period: number
}

export function GrowthChart({ data, period }: Props) {
  const tickInterval = period <= 7 ? 0 : period <= 14 ? 1 : period <= 30 ? 4 : 9

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden' }}>
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-white">Crecimiento de usuarios</h2>
          <InfoTooltip text="Dos líneas: 'Total registrados' es la suma acumulada de todos los padres desde el inicio. 'Nuevos' son los que se registraron ese día. Sirve para ver si la velocidad de adquisición está creciendo, estancada o cayendo con el tiempo." />
        </div>
        <div className="flex items-center gap-4 mt-1 flex-wrap">
          <p className="text-[11px] text-gray-600">Últimos {period} días</p>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: '#7C3AED' }} />Total registrados
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: '#10B981' }} />Nuevos
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 24, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="gc-cumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#7C3AED" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="gc-new" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={fmtDay}
            tick={{ fill: '#4B5563', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fill: '#4B5563', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="cumulative"
            name="Total registrados"
            stroke="#7C3AED"
            strokeWidth={2.5}
            fill="url(#gc-cumulative)"
            dot={false}
            activeDot={{ r: 5, fill: '#7C3AED', stroke: '#060609', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="newUsers"
            name="Nuevos"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#gc-new)"
            dot={false}
            activeDot={{ r: 5, fill: '#10B981', stroke: '#060609', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

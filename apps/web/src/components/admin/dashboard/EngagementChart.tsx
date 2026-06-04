'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import type { EngagementPoint } from '@strides/db'
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
    <div style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px' }}>
      <p style={{ color: '#6B7280', fontSize: 11, marginBottom: 8 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: '#9CA3AF' }}>{p.name}</span>
          <span style={{ color: '#F9FAFB', fontWeight: 700, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  data: EngagementPoint[]
}

export function EngagementChart({ data }: Props) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden' }}>
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-white">Actividad diaria</h2>
          <InfoTooltip text="Barras por día: 'Lecciones' son las completadas por los niños ese día, 'Juegos' son las partidas jugadas. Mide el engagement real con la plataforma. Si baja sostenidamente puede indicar que los niños agotaron el contenido disponible." />
        </div>
        <div className="flex items-center gap-4 mt-1 flex-wrap">
          <p className="text-[11px] text-gray-600">Últimos {data.length} días</p>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="w-2 h-1.5 rounded-sm inline-block shrink-0" style={{ background: '#7C3AED' }} />Lecciones
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="w-2 h-1.5 rounded-sm inline-block shrink-0" style={{ background: '#F59E0B' }} />Juegos
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 12, right: 24, left: -8, bottom: 0 }} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={fmtDay}
            tick={{ fill: '#4B5563', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: '#4B5563', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="lessons" name="Lecciones" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={20} />
          <Bar dataKey="games"   name="Juegos"    fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

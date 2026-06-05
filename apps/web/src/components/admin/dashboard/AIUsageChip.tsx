'use client'

import { useState } from 'react'

type Period = 'today' | 'month' | 'total'

interface Props {
  label: string
  color: string
  tooltip: string
  tooltipAlign?: 'left' | 'right'
  today: string
  month: string
  total: string
  defaultPeriod?: Period
}

export function AIUsageChip({ label, color, tooltip, tooltipAlign = 'left', today, month, total, defaultPeriod = 'today' }: Props) {
  const [period, setPeriod] = useState<Period>(defaultPeriod)

  const value = period === 'today' ? today : period === 'month' ? month : total

  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color }}>{label}</p>
        <div className="relative group cursor-help flex items-center">
          <span className="text-[11px] leading-none select-none text-slate-400">ⓘ</span>
          <div
            className={`absolute bottom-full mb-2 w-56 bg-gray-900 border border-gray-700 rounded-xl p-3 text-[11px] text-gray-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[200] shadow-xl text-left whitespace-normal leading-relaxed ${tooltipAlign === 'right' ? 'right-0' : 'left-0'}`}
          >
            {tooltip}
          </div>
        </div>
      </div>

      <p className="text-base font-bold text-white mb-2.5" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
        {value}
      </p>

      <div className="flex gap-1">
        {(['today', 'month', 'total'] as Period[]).map((p) => {
          const active = period === p
          return (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider transition-all"
              style={
                active
                  ? { color: '#fff', background: color + '28', border: `1px solid ${color}55` }
                  : { color: '#4B5563', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)' }
              }
            >
              {p === 'today' ? 'Hoy' : p === 'month' ? 'Mes' : 'Total'}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface Props {
  label: string
  value: string
  color: string
  tooltip?: string
  tooltipAlign?: 'left' | 'right'
  muted?: boolean
}

export function StaticMetricChip({ label, value, color, tooltip, tooltipAlign = 'left', muted = false }: Props) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color }}>{label}</p>
        {tooltip && (
          <div className="relative group cursor-help flex items-center">
            <span className="text-[11px] leading-none select-none text-slate-400">ⓘ</span>
            <div
              className={`absolute bottom-full mb-2 w-64 bg-gray-900 border border-gray-700 rounded-xl p-3 text-[11px] text-gray-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[200] shadow-xl text-left whitespace-pre-line leading-relaxed ${tooltipAlign === 'right' ? 'right-0' : 'left-0'}`}
            >
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <p className={`text-base font-bold ${muted ? 'text-gray-600' : 'text-white'}`} style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

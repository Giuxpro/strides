import type { StatsBlockProps } from '@strides/core/kids'

export function StatsBlock({ stat1Number, stat1Label, stat2Number, stat2Label, stat3Number, stat3Label, bgColor }: StatsBlockProps) {
  const stats = [
    { number: stat1Number, label: stat1Label },
    { number: stat2Number, label: stat2Label },
    { number: stat3Number, label: stat3Label },
  ]

  return (
    <div
      className="py-12 px-6"
      style={{ background: bgColor || 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
    >
      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl font-extrabold text-white leading-none mb-1">{s.number}</div>
            <div className="text-xs font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

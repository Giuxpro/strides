import type { StatsBlockProps } from '@strides/core/kids'

export function StatsBlock({ stat1Emoji, stat1Number, stat1Label, stat2Emoji, stat2Number, stat2Label, stat3Emoji, stat3Number, stat3Label }: StatsBlockProps) {
  const stats = [
    { emoji: stat1Emoji, number: stat1Number, label: stat1Label },
    { emoji: stat2Emoji, number: stat2Number, label: stat2Label },
    { emoji: stat3Emoji, number: stat3Number, label: stat3Label },
  ]

  return (
    <div className="py-12 px-6" style={{ background: 'oklch(0.11 0.03 280)' }}>
      <div className="max-w-sm mx-auto divide-y" style={{ borderColor: 'oklch(0.25 0.04 280)' }}>
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-5 py-6 first:pt-0 last:pb-0"
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'oklch(0.55 0.22 290 / 0.18)', border: '1px solid oklch(0.55 0.22 290 / 0.3)' }}
            >
              {s.emoji}
            </div>
            <div>
              <div
                className="font-extrabold leading-none mb-1"
                style={{ fontSize: 'clamp(1.75rem, 7vw, 2.5rem)', color: 'oklch(0.97 0.005 280)', letterSpacing: '-0.03em' }}
              >
                {s.number}
              </div>
              <div className="text-sm font-medium" style={{ color: 'oklch(0.62 0.07 280)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

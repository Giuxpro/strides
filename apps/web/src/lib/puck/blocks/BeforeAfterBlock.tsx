import type { BeforeAfterBlockProps } from '@strides/core/kids'

export function BeforeAfterBlock({ heading, beforeTitle, before1, before2, before3, afterTitle, after1, after2, after3 }: BeforeAfterBlockProps) {
  const beforeItems = [before1, before2, before3].filter(Boolean)
  const afterItems  = [after1,  after2,  after3 ].filter(Boolean)

  return (
    <div className="py-12 px-6" style={{ background: 'oklch(0.09 0.025 280)' }}>
      <div className="max-w-sm mx-auto">
        {heading && (
          <h2
            className="font-extrabold text-center mb-8 leading-tight"
            style={{ fontSize: 'clamp(1.4rem, 6vw, 1.9rem)', color: 'oklch(0.97 0.005 280)', letterSpacing: '-0.02em' }}
          >
            {heading}
          </h2>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Before */}
          <div className="rounded-2xl p-4" style={{ background: 'oklch(0.14 0.01 280)', border: '1.5px solid oklch(0.22 0.02 280)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'oklch(0.52 0.04 280)', letterSpacing: '0.14em' }}>
              {beforeTitle || 'Antes'}
            </p>
            <div className="space-y-3">
              {beforeItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-base shrink-0 mt-0.5" style={{ filter: 'grayscale(1) opacity(0.5)' }}>✗</span>
                  <span className="text-xs leading-relaxed" style={{ color: 'oklch(0.52 0.04 280)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: 'oklch(0.55 0.22 290 / 0.18)', border: '1.5px solid oklch(0.55 0.22 290 / 0.45)' }}
          >
            {/* Glow top right */}
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl pointer-events-none"
              style={{ background: 'oklch(0.55 0.22 290 / 0.35)' }} aria-hidden />

            <p className="text-xs font-bold uppercase tracking-widest mb-4 relative z-10" style={{ color: 'oklch(0.82 0.12 290)', letterSpacing: '0.14em' }}>
              {afterTitle || 'Con Strides'}
            </p>
            <div className="space-y-3 relative z-10">
              {afterItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-base shrink-0 mt-0.5" style={{ color: 'oklch(0.83 0.18 75)' }}>✦</span>
                  <span className="text-xs leading-relaxed font-medium" style={{ color: 'oklch(0.90 0.01 280)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

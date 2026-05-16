import type { BenefitsBlockProps } from '@strides/core/kids'

export function BenefitsBlock({ title, benefit1Emoji, benefit1Title, benefit1Sub, benefit2Emoji, benefit2Title, benefit2Sub, benefit3Emoji, benefit3Title, benefit3Sub, benefit4Emoji, benefit4Title, benefit4Sub }: BenefitsBlockProps) {
  const items = [
    { emoji: benefit1Emoji, title: benefit1Title, sub: benefit1Sub },
    { emoji: benefit2Emoji, title: benefit2Title, sub: benefit2Sub },
    { emoji: benefit3Emoji, title: benefit3Title, sub: benefit3Sub },
    { emoji: benefit4Emoji, title: benefit4Title, sub: benefit4Sub },
  ].filter(b => b.title)

  return (
    <div className="py-12 px-6" style={{ background: 'oklch(0.09 0.025 280)' }}>
      <div className="max-w-sm mx-auto">
        <h2
          className="font-extrabold text-center mb-10 leading-tight"
          style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', color: 'oklch(0.97 0.005 280)', letterSpacing: '-0.02em' }}
        >
          {title}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {items.map((b, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 p-4 rounded-2xl"
              style={{
                background: i % 2 === 0
                  ? 'oklch(0.55 0.22 290 / 0.12)'
                  : 'oklch(0.72 0.19 195 / 0.1)',
                border: `1px solid ${i % 2 === 0 ? 'oklch(0.55 0.22 290 / 0.22)' : 'oklch(0.72 0.19 195 / 0.2)'}`,
              }}
            >
              <span className="text-3xl">{b.emoji}</span>
              <p className="text-sm font-bold leading-snug" style={{ color: 'oklch(0.93 0.01 280)' }}>{b.title}</p>
              {b.sub && (
                <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.62 0.07 280)' }}>{b.sub}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

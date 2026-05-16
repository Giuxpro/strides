import type { FeatureBlockProps } from '@strides/core/kids'

export function FeatureBlock({ emoji, title, description, accentColor }: FeatureBlockProps) {
  const accent = accentColor || 'oklch(0.55 0.22 290)'

  return (
    <div className="py-14 px-6" style={{ background: 'oklch(0.09 0.025 280)' }}>
      <div className="max-w-sm mx-auto text-center flex flex-col items-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-7 shrink-0"
          style={{
            background: `${accent.replace(')', ' / 0.18)').replace('oklch(', 'oklch(')}`,
            border: `1.5px solid ${accent.replace(')', ' / 0.35)').replace('oklch(', 'oklch(')}`,
            boxShadow: `0 8px 32px ${accent.replace(')', ' / 0.3)').replace('oklch(', 'oklch(')}`,
          }}
        >
          {emoji}
        </div>
        <h3
          className="font-extrabold mb-4 leading-tight"
          style={{ fontSize: 'clamp(1.4rem, 6vw, 1.9rem)', color: 'oklch(0.97 0.005 280)', letterSpacing: '-0.02em' }}
        >
          {title}
        </h3>
        <p
          className="leading-relaxed"
          style={{ fontSize: '1rem', color: 'oklch(0.68 0.07 280)', maxWidth: '30ch', lineHeight: 1.7 }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

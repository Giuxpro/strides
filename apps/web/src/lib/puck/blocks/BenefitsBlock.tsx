import type { BenefitsBlockProps } from '@strides/core/kids'

export function BenefitsBlock({ title, benefit1, benefit2, benefit3, benefit4, emoji }: BenefitsBlockProps) {
  const benefits = [benefit1, benefit2, benefit3, benefit4].filter(Boolean)

  return (
    <div className="py-10 px-6" style={{ background: '#0f0a1a' }}>
      <div className="max-w-sm mx-auto">
        <div className="text-4xl mb-4 text-center">{emoji}</div>
        <h2 className="text-2xl font-extrabold text-white text-center mb-6 leading-tight">{title}</h2>
        <div className="space-y-3">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}
            >
              <span className="text-violet-400 font-bold text-lg shrink-0 mt-0.5">✓</span>
              <span className="text-gray-200 text-sm leading-relaxed">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

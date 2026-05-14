import type { HowItWorksBlockProps } from '@strides/core/kids'

export function HowItWorksBlock({
  title,
  step1Emoji, step1Title, step1Desc,
  step2Emoji, step2Title, step2Desc,
  step3Emoji, step3Title, step3Desc,
}: HowItWorksBlockProps) {
  const steps = [
    { emoji: step1Emoji, title: step1Title, desc: step1Desc },
    { emoji: step2Emoji, title: step2Title, desc: step2Desc },
    { emoji: step3Emoji, title: step3Title, desc: step3Desc },
  ]

  return (
    <div className="py-12 px-6" style={{ background: '#0f0a1a' }}>
      <div className="max-w-sm mx-auto">
        <h2 className="text-2xl font-extrabold text-white text-center mb-8 leading-tight">{title}</h2>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              {/* Número + línea conectora */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-extrabold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                >
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 h-6 mt-1" style={{ background: 'rgba(124,58,237,0.3)' }} />
                )}
              </div>
              {/* Contenido */}
              <div className="pb-4">
                <div className="text-2xl mb-1">{step.emoji}</div>
                <h3 className="text-base font-bold text-white mb-1">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

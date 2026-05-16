import type { HowItWorksBlockProps } from '@strides/core/kids'

export function HowItWorksBlock({ title, step1Emoji, step1Title, step1Desc, step2Emoji, step2Title, step2Desc, step3Emoji, step3Title, step3Desc }: HowItWorksBlockProps) {
  const steps = [
    { emoji: step1Emoji, title: step1Title, desc: step1Desc },
    { emoji: step2Emoji, title: step2Title, desc: step2Desc },
    { emoji: step3Emoji, title: step3Title, desc: step3Desc },
  ]

  return (
    <div className="py-12 px-6" style={{ background: 'oklch(0.09 0.025 280)' }}>
      <div className="max-w-sm mx-auto">
        <h2
          className="font-extrabold text-center mb-10 leading-tight"
          style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', color: 'oklch(0.97 0.005 280)', letterSpacing: '-0.02em' }}
        >
          {title}
        </h2>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-5">
              {/* Number + connector */}
              <div className="flex flex-col items-center shrink-0" style={{ width: '3rem' }}>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shrink-0"
                  style={{
                    background: 'oklch(0.55 0.22 290)',
                    color: 'oklch(0.97 0.005 280)',
                    boxShadow: '0 4px 16px oklch(0.55 0.22 290 / 0.45)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 my-2" style={{ background: 'oklch(0.55 0.22 290 / 0.25)', minHeight: '2.5rem' }} />
                )}
              </div>

              {/* Content */}
              <div className="pb-8 pt-1 flex-1">
                <div className="text-3xl mb-2">{step.emoji}</div>
                <h3 className="font-bold mb-1.5" style={{ fontSize: '1rem', color: 'oklch(0.95 0.01 280)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.62 0.07 280)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

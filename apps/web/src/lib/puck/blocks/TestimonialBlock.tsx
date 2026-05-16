import type { TestimonialBlockProps } from '@strides/core/kids'

export function TestimonialBlock({ quote, author, role, avatar, metric, bgColor }: TestimonialBlockProps) {
  return (
    <div
      className="py-14 px-6"
      style={{ background: bgColor || 'oklch(0.09 0.025 280)' }}
    >
      <div className="max-w-sm mx-auto">
        {/* Stars */}
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <span key={i} style={{ color: 'oklch(0.83 0.18 75)', fontSize: '1.1rem' }}>★</span>
          ))}
        </div>

        {/* Opening mark */}
        <div
          className="text-6xl font-extrabold leading-none mb-2 select-none"
          style={{ color: 'oklch(0.55 0.22 290 / 0.5)', fontFamily: 'Georgia, serif', lineHeight: 0.8 }}
          aria-hidden
        >
          ❝
        </div>

        {/* Quote */}
        <p
          className="font-semibold leading-relaxed mb-8"
          style={{
            fontSize: 'clamp(1.05rem, 4vw, 1.25rem)',
            color: 'oklch(0.93 0.01 280)',
            lineHeight: 1.65,
          }}
        >
          {quote}
        </p>

        {/* Author row */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
            style={{
              background: 'oklch(0.55 0.22 290 / 0.25)',
              border: '2px solid oklch(0.83 0.18 75 / 0.7)',
            }}
          >
            {avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'oklch(0.97 0.005 280)' }}>{author}</p>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.62 0.07 280)' }}>{role}</p>
          </div>
          {metric && (
            <div
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: 'oklch(0.55 0.22 290 / 0.25)',
                color: 'oklch(0.82 0.12 290)',
                border: '1px solid oklch(0.55 0.22 290 / 0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              {metric}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

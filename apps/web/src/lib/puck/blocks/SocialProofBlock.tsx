import type { SocialProofBlockProps } from '@strides/core/kids'

export function SocialProofBlock({ avatars, counter, subtitle }: SocialProofBlockProps) {
  const avatarList = (avatars || '👩,👨,👩‍👧,👨‍👧‍👦,👩‍👦').split(',').map(a => a.trim()).filter(Boolean)

  return (
    <div className="py-14 px-6 relative overflow-hidden" style={{ background: 'oklch(0.11 0.03 280)' }}>
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl pointer-events-none"
        style={{ background: 'oklch(0.55 0.22 290 / 0.2)' }} aria-hidden />

      <div className="max-w-sm mx-auto text-center relative z-10">
        {/* Avatar cluster */}
        <div className="flex items-center justify-center mb-6">
          {avatarList.slice(0, 5).map((av, i) => (
            <div
              key={i}
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
              style={{
                marginLeft: i === 0 ? 0 : '-0.65rem',
                background: 'oklch(0.55 0.22 290 / 0.25)',
                border: '2px solid oklch(0.09 0.025 280)',
                zIndex: avatarList.length - i,
                position: 'relative',
              }}
            >
              {av}
            </div>
          ))}
          {avatarList.length > 5 && (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                marginLeft: '-0.65rem',
                background: 'oklch(0.55 0.22 290 / 0.3)',
                border: '2px solid oklch(0.09 0.025 280)',
                color: 'oklch(0.82 0.12 290)',
              }}
            >
              +{avatarList.length - 5}
            </div>
          )}
        </div>

        <p
          className="font-extrabold leading-tight mb-3"
          style={{ fontSize: 'clamp(1.5rem, 7vw, 2.25rem)', color: 'oklch(0.97 0.005 280)', letterSpacing: '-0.025em' }}
        >
          {counter}
        </p>

        <p
          className="text-sm leading-relaxed"
          style={{ color: 'oklch(0.62 0.07 280)', maxWidth: '28ch', margin: '0 auto' }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  )
}

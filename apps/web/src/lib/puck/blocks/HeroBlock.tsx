import type { HeroBlockProps } from '@strides/core/kids'

const FLOATER_POS = [
  { top: '11%',  left: '7%',   delay: '0s',    size: '0.55rem' },
  { top: '22%',  left: '90%',  delay: '0.9s',  size: '0.7rem'  },
  { top: '58%',  left: '5%',   delay: '1.6s',  size: '0.5rem'  },
  { top: '72%',  left: '88%',  delay: '2.1s',  size: '0.65rem' },
  { top: '40%',  left: '50%',  delay: '0.4s',  size: '0.6rem'  },
  { top: '85%',  left: '20%',  delay: '1.2s',  size: '0.5rem'  },
  { top: '18%',  left: '42%',  delay: '2.5s',  size: '0.45rem' },
]

export function HeroBlock({ title, subtitle, emoji, bgGradient, showBadge, badgeText }: HeroBlockProps) {
  const displayBadge = showBadge === true || (showBadge as unknown as string) === 'true'

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 py-20 overflow-hidden"
      style={{ background: bgGradient || 'oklch(0.09 0.025 280)' }}
    >
      {/* Aurora blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-28 -left-20 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'oklch(0.55 0.22 290 / 0.38)' }} />
        <div className="absolute top-1/2 -right-16 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'oklch(0.72 0.19 195 / 0.28)' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'oklch(0.72 0.19 350 / 0.22)' }} />
      </div>

      {/* Floating stars */}
      {FLOATER_POS.map((f, i) => (
        <span
          key={i}
          className="absolute animate-twinkle select-none pointer-events-none"
          aria-hidden
          style={{ top: f.top, left: f.left, animationDelay: f.delay, fontSize: f.size, color: 'oklch(0.82 0.07 280)' }}
        >
          {i % 2 === 0 ? '✦' : '✧'}
        </span>
      ))}

      <div className="relative z-10 flex flex-col items-center gap-0">
        {displayBadge && badgeText && (
          <div
            className="mb-8 px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase animate-pulse-glow"
            style={{
              background: 'oklch(0.83 0.18 75)',
              color: 'oklch(0.18 0.04 75)',
              boxShadow: '0 0 28px oklch(0.83 0.18 75 / 0.5)',
              letterSpacing: '0.12em',
            }}
          >
            {badgeText}
          </div>
        )}

        <div
          className="text-7xl mb-8 animate-float select-none"
          style={{ filter: 'drop-shadow(0 12px 36px oklch(0.55 0.22 290 / 0.55))' }}
        >
          {emoji}
        </div>

        <h1
          className="font-extrabold leading-[1.06] mb-5 animate-slide-up"
          style={{
            fontSize: 'clamp(2.1rem, 9vw, 3.4rem)',
            color: 'oklch(0.97 0.005 280)',
            maxWidth: '14ch',
            letterSpacing: '-0.028em',
          }}
        >
          {title}
        </h1>

        <p
          className="animate-slide-up"
          style={{
            fontSize: 'clamp(1rem, 4.2vw, 1.15rem)',
            color: 'oklch(0.72 0.07 280)',
            maxWidth: '32ch',
            lineHeight: 1.7,
            animationDelay: '0.15s',
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  )
}

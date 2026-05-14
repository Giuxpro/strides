import type { HeroBlockProps } from '@strides/core/kids'

export function HeroBlock({ title, subtitle, emoji, bgGradient, showBadge, badgeText }: HeroBlockProps) {
  const displayBadge = showBadge === true || (showBadge as unknown as string) === 'true'
  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 py-16 overflow-hidden"
      style={{ background: bgGradient || 'linear-gradient(160deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)' }}
    >
      {/* Círculos decorativos */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.15)' }} />
      <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full opacity-15" style={{ background: 'rgba(255,255,255,0.1)' }} />

      {displayBadge && badgeText && (
        <div className="mb-6 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
          {badgeText}
        </div>
      )}

      <div className="text-8xl mb-6 animate-bounce select-none">{emoji}</div>

      <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 max-w-sm drop-shadow-lg">
        {title}
      </h1>

      <p className="text-lg leading-relaxed max-w-xs mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
        {subtitle}
      </p>
    </div>
  )
}

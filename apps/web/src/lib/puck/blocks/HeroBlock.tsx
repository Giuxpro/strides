import type { HeroBlockProps } from '@strides/core/kids'

export function HeroBlock({ title, subtitle, emoji, buttonLabel, buttonHref, bgColor }: HeroBlockProps) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-center px-6 py-12"
      style={{ background: bgColor || 'linear-gradient(135deg, #6d28d9, #4f46e5)' }}
    >
      <span className="text-8xl mb-6 block animate-bounce">{emoji}</span>
      <h1 className="text-4xl font-extrabold text-white mb-3 leading-tight">{title}</h1>
      <p className="text-lg text-white/80 mb-10 max-w-xs">{subtitle}</p>
      <a
        href={buttonHref}
        className="bg-white text-violet-700 font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform"
      >
        {buttonLabel}
      </a>
    </div>
  )
}

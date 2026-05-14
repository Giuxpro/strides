import type { TestimonialBlockProps } from '@strides/core/kids'

export function TestimonialBlock({ quote, author, role, avatar, bgColor }: TestimonialBlockProps) {
  return (
    <div
      className="py-10 px-6"
      style={{ background: bgColor || '#0f0a1a' }}
    >
      <div
        className="max-w-sm mx-auto rounded-3xl p-6"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {/* Estrellas */}
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-yellow-400 text-lg">★</span>
          ))}
        </div>

        {/* Cita */}
        <p className="text-white text-sm leading-relaxed mb-5 italic">
          &ldquo;{quote}&rdquo;
        </p>

        {/* Autor */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
            style={{ background: 'rgba(124,58,237,0.4)' }}
          >
            {avatar}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{author}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

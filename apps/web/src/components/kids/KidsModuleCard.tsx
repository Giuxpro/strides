import Link from 'next/link'
import type { Module } from '@strides/db'
import { getModuleConfig } from './moduleConfig'

interface Props {
  module: Module
  index: number
}

export function KidsModuleCard({ module, index }: Props) {
  const config = getModuleConfig(module.slug)
  const delay = `${index * 100}ms`

  return (
    <Link href={`/kids/play/${module.slug}`} className="block group">
      <div
        className="animate-pop-in relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:-translate-y-1 active:scale-95"
        style={{ background: config.gradient, boxShadow: config.shadow, animationDelay: delay }}
      >
        {/* Stop number badge */}
        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/25 flex items-center justify-center z-10">
          <span className="text-white font-black text-sm">{index + 1}</span>
        </div>

        {/* Decorative orbs */}
        <div
          className="absolute -top-8 -right-8 w-44 h-44 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.4)' }}
        />
        <div
          className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.5)' }}
        />

        <div className="relative z-10 flex items-center gap-5 px-6 py-5 pl-16">
          {/* Emoji */}
          <span
            className="animate-float text-7xl leading-none flex-shrink-0"
            style={{ animationDelay: delay }}
          >
            {config.emoji}
          </span>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-extrabold text-2xl leading-tight drop-shadow-sm">
              {module.title_es}
            </h3>
            <p className="text-white/70 text-sm font-semibold uppercase tracking-wide mt-0.5">
              {module.title_en}
            </p>
          </div>

          {/* Arrow */}
          <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center group-hover:bg-white/40 transition-colors flex-shrink-0">
            <span className="text-white text-xl">→</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

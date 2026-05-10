'use client'

import Link from 'next/link'
import type { Module } from '@strides/db'
import { getModuleConfig } from '@strides/core/kids'

interface Props {
  module: Module
  index: number
}

// Each island levitates at a different phase so they don't all move in sync
const LEVITATE_DELAYS = ['0s', '0.7s', '1.4s', '2.1s', '0.35s', '1.05s', '1.75s', '2.45s']

export function KidsModuleCard({ module, index }: Props) {
  const config       = getModuleConfig(module.slug)
  const popDelay     = `${index * 120}ms`
  const levDelay     = LEVITATE_DELAYS[index % LEVITATE_DELAYS.length] ?? '0s'

  return (
    <Link href={`/kids/play/${module.slug}`} className="block select-none group">
      <div
        className="animate-pop-in flex flex-col items-center gap-3"
        style={{ animationDelay: popDelay }}
      >
        {/*
         * Two nested divs to avoid transform conflict:
         *   outer → CSS animation (translateY levitation)
         *   inner → Tailwind hover (scale), won't clash with outer's transform
         */}
        <div
          className="animate-levitate w-full aspect-square"
          style={{ animationDelay: levDelay }}
        >
          <div className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-110 active:scale-95">
            {module.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={module.cover_image_url}
                alt={module.title_es}
                className="w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0 20px 36px rgba(80,20,160,0.30)) drop-shadow(0 6px 12px rgba(0,0,0,0.18))' }}
                draggable={false}
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{ background: config.gradient, boxShadow: config.shadow }}
              >
                <span style={{ fontSize: '5rem', lineHeight: 1 }}>{config.emoji}</span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-center font-extrabold text-lg sm:text-xl leading-snug px-2"
          style={{
            color: '#fff',
            textShadow:
              '-2px -2px 0 rgba(80,20,160,0.7), 2px -2px 0 rgba(80,20,160,0.7), -2px 2px 0 rgba(80,20,160,0.7), 2px 2px 0 rgba(80,20,160,0.7), 0 4px 14px rgba(80,20,160,0.5)',
          }}
        >
          {module.title_es}
        </h3>
      </div>
    </Link>
  )
}

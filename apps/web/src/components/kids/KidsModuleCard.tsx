'use client'

import Link from 'next/link'
import type { Module } from '@strides/db'
import { getModuleConfig } from '@strides/core/kids'
import type { ModuleLockState } from '@strides/core'

interface Props {
  module: Module
  index: number
  lockState?: ModuleLockState
}

const LEVITATE_DELAYS = ['0s', '0.7s', '1.4s', '2.1s', '0.35s', '1.05s', '1.75s', '2.45s']

export function KidsModuleCard({ module, index, lockState }: Props) {
  const config = getModuleConfig(module.slug)
  const popDelay = `${index * 120}ms`
  const levDelay = LEVITATE_DELAYS[index % LEVITATE_DELAYS.length] ?? '0s'

  const isLocked = lockState !== undefined
  const isPreviewLock = lockState === 'preview-locked'
  const href = isPreviewLock ? '/upgrade' : isLocked ? undefined : `/kids/play/${module.slug}`

  const inner = (
    <div
      className="animate-pop-in flex flex-col items-center gap-3"
      style={{ animationDelay: popDelay }}
    >
      <div
        className="animate-levitate w-full aspect-square"
        style={{ animationDelay: levDelay }}
      >
        <div className={`w-full h-full relative transition-transform duration-300 ease-out ${!isLocked ? 'group-hover:scale-110 active:scale-95' : ''}`}>
          {module.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={module.cover_image_url}
              alt={module.title_es}
              className={`w-full h-full object-contain transition-all ${isLocked ? 'opacity-60 grayscale' : ''}`}
              style={{ filter: isLocked ? undefined : 'drop-shadow(0 20px 36px rgba(80,20,160,0.30)) drop-shadow(0 6px 12px rgba(0,0,0,0.18))' }}
              draggable={false}
            />
          ) : (
            <div
              className={`w-full h-full rounded-full flex items-center justify-center transition-all ${isLocked ? 'opacity-40 grayscale' : ''}`}
              style={{ background: config.gradient, boxShadow: config.shadow }}
            >
              <span style={{ fontSize: '5rem', lineHeight: 1 }}>{config.emoji}</span>
            </div>
          )}

          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}>
                {isPreviewLock ? '⭐' : '🔒'}
              </span>
            </div>
          )}
        </div>
      </div>

      <h3
        className="text-center font-extrabold text-lg sm:text-xl leading-snug px-2"
        style={{
          color: isLocked ? 'rgba(255,255,255,0.9)' : '#fff',
          textShadow: '-2px -2px 0 rgba(80,20,160,0.7), 2px -2px 0 rgba(80,20,160,0.7), -2px 2px 0 rgba(80,20,160,0.7), 2px 2px 0 rgba(80,20,160,0.7), 0 4px 14px rgba(80,20,160,0.5)',
        }}
      >
        {module.title_es}
      </h3>
    </div>
  )

  if (href) {
    return <Link href={href} className="block select-none group">{inner}</Link>
  }

  return <div className="block select-none cursor-not-allowed">{inner}</div>
}

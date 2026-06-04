'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import type { Module } from '@strides/db'
import type { ModuleLockState } from '@strides/core'
import { getModuleConfig } from '@strides/core/kids'
import { getStorageUrl } from '@strides/core'

const ISLAND_STORAGE_PATHS: Partial<Record<string, string>> = {
  animales:      'module-covers/animal_island_mobile.png',
  'the-numbers': 'module-covers/numbers_island_mobile.png',
  'the-colors':  'module-covers/colors_island_mobile.png',
  letras:        'module-covers/letters_island_mobile.png',
}

const MOBILE_BG_PATH = 'module-covers/background_cloud_mobile.png'

interface Props {
  modules: Module[]
  childName: string | null
  childAvatar: string
  currentStreak: number
  moduleLockStates: Record<string, ModuleLockState>
}

export function KidsMapSceneMobile({ modules, childName, childAvatar, currentStreak, moduleLockStates }: Props) {
  const [mobileSlide, setMobileSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const greeting = childName ? `¡Hola, ${childName}!` : '¡Hola!'

  function handleCarouselScroll() {
    const el = carouselRef.current
    if (!el) return
    setMobileSlide(Math.round(el.scrollLeft / el.clientWidth))
  }

  function goToSlide(i: number) {
    const el = carouselRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div
      className="block md:hidden relative overflow-hidden"
      style={{ height: '100dvh', backgroundColor: '#6b21a8' }}
    >
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3">
        <span className="font-bold tracking-widest uppercase text-white/60 text-[0.6rem]">Strides</span>
        <div className="flex items-center gap-3 mr-14">
          {currentStreak > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-400/20 border border-orange-400/40">
              <span className="text-base">🔥</span>
              <span className="font-bold text-white text-sm">{currentStreak}</span>
            </div>
          )}
          <Link href="/select-profile" className="flex items-center gap-1.5 text-white/80 text-sm">
            <span className="text-lg">{childAvatar}</span>
            {childName && <span>{childName}</span>}
          </Link>
          <form action={logout}>
            <button type="submit" className="text-white/40 text-xs">Salir</button>
          </form>
        </div>
      </header>

      {/* Greeting */}
      <p
        className="absolute left-0 right-0 z-20 text-center font-extrabold text-3xl text-white pointer-events-none"
        style={{ top: '16%', textShadow: '0 2px 14px rgba(40,0,100,0.55)' }}
      >
        {greeting}{' '}
        <span className="inline-block animate-float origin-bottom-right">👋</span>
      </p>

      {/* Carousel */}
      <div
        ref={carouselRef}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
        onScroll={handleCarouselScroll}
      >
        {modules.map((module) => {
          const config        = getModuleConfig(module.slug)
          const lockState     = moduleLockStates[module.id]
          const isLocked      = lockState !== undefined
          const isPreviewLock = lockState === 'preview-locked'
          const coverUrl      = getStorageUrl(module.cover_image_url)
          const islandSrc     = getStorageUrl(ISLAND_STORAGE_PATHS[module.slug] ?? null)
          const href          = isPreviewLock ? '/upgrade' : isLocked ? undefined : `/kids/play/${module.slug}`

          return (
            <div
              key={module.id}
              className="min-w-full h-full snap-center flex flex-col items-center justify-center gap-4"
              style={{
                paddingTop: '72px',
                paddingBottom: '80px',
                backgroundColor: '#6b21a8',
                backgroundImage: `url(${getStorageUrl(MOBILE_BG_PATH)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="relative" style={{ width: '92vw', maxWidth: '480px' }}>
                {islandSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={islandSrc} alt="" aria-hidden className="w-full h-auto object-contain" draggable={false} />
                ) : (
                  <div className="w-full rounded-[40%] opacity-60" style={{ aspectRatio: '2.2/1', background: config.gradient }} />
                )}
                <div
                  className="absolute left-[23%] w-[52%] animate-levitate"
                  style={{ bottom: '32%' }}
                >
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt={module.title_es}
                      className={`w-full h-auto object-contain ${isLocked ? 'opacity-60 grayscale' : ''}`}
                      style={{ filter: isLocked ? undefined : 'drop-shadow(0 10px 28px rgba(60,0,140,0.45))' }}
                      draggable={false}
                    />
                  ) : (
                    <span style={{ fontSize: '5rem', lineHeight: 1 }}>{config.emoji}</span>
                  )}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span style={{ fontSize: '2.4rem' }}>{isPreviewLock ? '⭐' : '🔒'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center px-6">
                <h2 className="font-extrabold text-white leading-tight" style={{ fontSize: '2rem', textShadow: '0 2px 16px rgba(40,0,100,0.6)' }}>
                  {module.title_es}
                </h2>
                {module.title_en && (
                  <p className="text-white/60 font-medium text-base mt-0.5">{module.title_en}</p>
                )}
              </div>

              {href ? (
                <Link
                  href={href}
                  className="rounded-full font-extrabold text-xl text-purple-900 bg-white active:scale-95 transition-transform select-none"
                  style={{ padding: '14px 48px', boxShadow: '0 8px 28px rgba(60,0,140,0.35)', minWidth: '190px', textAlign: 'center' }}
                >
                  {isPreviewLock ? '⭐ Ver más' : '¡Empezar!'}
                </Link>
              ) : (
                <div
                  className="rounded-full font-bold text-base text-white/40 bg-white/10 border border-white/20 select-none"
                  style={{ padding: '14px 48px', minWidth: '190px', textAlign: 'center' }}
                >
                  🔒 Bloqueado
                </div>
              )}
            </div>
          )
        })}
      </div>

      {mobileSlide > 0 && (
        <button
          onClick={() => goToSlide(mobileSlide - 1)}
          aria-label="Módulo anterior"
          className="absolute top-1/2 left-3 -translate-y-1/2 z-30 flex items-center justify-center rounded-full active:scale-90 transition-transform"
          style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.40)', backdropFilter: 'blur(8px)', fontSize: '1.8rem', color: '#fff' }}
        >
          ‹
        </button>
      )}

      {mobileSlide < modules.length - 1 && (
        <button
          onClick={() => goToSlide(mobileSlide + 1)}
          aria-label="Siguiente módulo"
          className="absolute top-1/2 right-3 -translate-y-1/2 z-30 flex items-center justify-center rounded-full active:scale-90 transition-transform"
          style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.40)', backdropFilter: 'blur(8px)', fontSize: '1.8rem', color: '#fff' }}
        >
          ›
        </button>
      )}

      {modules.length > 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5" style={{ bottom: '2.5rem' }}>
          {modules.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Módulo ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === mobileSlide ? 24 : 8,
                height: 8,
                background: i === mobileSlide ? '#fff' : 'rgba(255,255,255,0.35)',
                boxShadow: i === mobileSlide ? '0 0 10px rgba(255,255,255,0.55)' : 'none',
              }}
            />
          ))}
        </div>
      )}

      {modules.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none gap-2">
          <p style={{ fontSize: '3rem' }}>🚧</p>
          <p className="font-medium text-white/70 text-sm">Contenido en preparación</p>
        </div>
      )}
    </div>
  )
}

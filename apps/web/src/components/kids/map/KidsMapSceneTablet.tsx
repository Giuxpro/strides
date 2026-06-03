'use client'

import { useState } from 'react'
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

const TABLET_BG_PATH = 'module-covers/background_cloud_tablet.png'
const PER_PAGE = 4

interface Props {
  modules: Module[]
  childName: string | null
  childAvatar: string
  currentStreak: number
  moduleLockStates: Record<string, ModuleLockState>
}

export function KidsMapSceneTablet({ modules, childName, childAvatar, currentStreak, moduleLockStates }: Props) {
  const [page, setPage] = useState(0)

  const totalPages = Math.max(1, Math.ceil(modules.length / PER_PAGE))
  const visibleModules = modules.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const greeting = childName ? `¡Hola, ${childName}!` : '¡Hola!'

  return (
    <div
      className="hidden md:flex lg:hidden flex-col min-h-svh relative"
      style={{
        backgroundColor: '#6b21a8',
        backgroundImage: `url(${getStorageUrl(TABLET_BG_PATH)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 z-30">
        <span className="font-bold tracking-widest uppercase text-white/70 text-xs">Strides</span>
        <div className="flex items-center gap-5 mr-14">
          {currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-400/20 border border-orange-400/40">
              <span>🔥</span>
              <span className="font-bold text-white text-sm">{currentStreak}</span>
              <span className="text-white/60 text-sm">{currentStreak === 1 ? 'día seguido' : 'días seguidos'}</span>
            </div>
          )}
          <Link href="/select-profile" className="flex items-center gap-2 text-white/80 hover:opacity-70 transition-opacity">
            <span className="text-xl">{childAvatar}</span>
            {childName && <span className="text-sm">{childName}</span>}
          </Link>
          <form action={logout}>
            <button type="submit" className="text-white/40 text-xs hover:opacity-70 transition-opacity">Salir</button>
          </form>
        </div>
      </header>

      {/* Greeting */}
      <div className="text-center pt-2 pb-6 z-20">
        <p
          className="font-extrabold text-4xl text-white"
          style={{ textShadow: '0 2px 16px rgba(40,0,100,0.55)' }}
        >
          {greeting}{' '}
          <span className="inline-block animate-float origin-bottom-right">👋</span>
        </p>
      </div>

      {/* Island grid — 2×2, navegación directa como desktop */}
      <div className="flex-1 flex items-center justify-center px-10 pb-20">
        <div className="grid grid-cols-2 gap-10 w-full max-w-2xl">
          {visibleModules.map((module, index) => {
            const config        = getModuleConfig(module.slug)
            const lockState     = moduleLockStates[module.id]
            const isLocked      = lockState !== undefined
            const isPreviewLock = lockState === 'preview-locked'
            const coverUrl      = getStorageUrl(module.cover_image_url)
            const islandSrc     = getStorageUrl(ISLAND_STORAGE_PATHS[module.slug] ?? null)
            const href          = isPreviewLock ? '/upgrade' : isLocked ? undefined : `/kids/play/${module.slug}`

            const islandCard = (
              <div
                className="flex flex-col items-center gap-3 animate-pop-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Capas: isla + cover flotando */}
                <div className="relative w-full">
                  {/* Capa 2: isla base */}
                  {islandSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={islandSrc}
                      alt=""
                      aria-hidden
                      className={`w-full h-auto object-contain transition-transform duration-300 ${!isLocked ? 'group-hover:scale-105' : 'opacity-70 grayscale'}`}
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="w-full rounded-[40%] opacity-60"
                      style={{ aspectRatio: '2.2/1', background: config.gradient }}
                    />
                  )}

                  {/* Capa 3: cover flotando sobre isla */}
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
                      <span style={{ fontSize: '4rem', lineHeight: 1 }}>{config.emoji}</span>
                    )}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span style={{ fontSize: '2.2rem' }}>{isPreviewLock ? '⭐' : '🔒'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Título */}
                <h3
                  className="font-extrabold text-white text-xl text-center leading-tight"
                  style={{ textShadow: '0 2px 12px rgba(40,0,100,0.6)' }}
                >
                  {module.title_es}
                </h3>
                {module.title_en && (
                  <p className="text-white/55 text-sm -mt-2">{module.title_en}</p>
                )}
              </div>
            )

            return href ? (
              <Link key={module.id} href={href} className="block select-none group">
                {islandCard}
              </Link>
            ) : (
              <div key={module.id} className="block select-none cursor-not-allowed">
                {islandCard}
              </div>
            )
          })}
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <>
          {page > 0 && (
            <button
              onClick={() => setPage(p => p - 1)}
              aria-label="Página anterior"
              className="absolute top-1/2 left-4 -translate-y-1/2 z-30 flex items-center justify-center rounded-full hover:scale-110 active:scale-90 transition-transform"
              style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)', fontSize: '1.8rem', color: '#fff' }}
            >
              ‹
            </button>
          )}
          {page < totalPages - 1 && (
            <button
              onClick={() => setPage(p => p + 1)}
              aria-label="Siguiente página"
              className="absolute top-1/2 right-4 -translate-y-1/2 z-30 flex items-center justify-center rounded-full hover:scale-110 active:scale-90 transition-transform"
              style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)', fontSize: '1.8rem', color: '#fff' }}
            >
              ›
            </button>
          )}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === page ? 20 : 8, height: 8,
                  background: i === page ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: i === page ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                }}
              />
            ))}
          </div>
        </>
      )}

      {modules.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none gap-2">
          <p style={{ fontSize: '3rem' }}>🚧</p>
          <p className="font-medium text-white/70">Contenido en preparación</p>
        </div>
      )}
    </div>
  )
}

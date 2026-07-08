'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { KidsModuleCard } from '../cards/KidsModuleCard'
import type { Module } from '@strides/db'
import type { ModuleLockState } from '@strides/core'

const ISLAND_POSITIONS = [
  { x: 17, y: 43 },
  { x: 59, y: 38 },
  { x: 46, y: 76 },
  { x: 82, y: 52 },
]

const PER_MAP = 4

interface Props {
  modules: Module[]
  childName: string | null
  childAvatar: string
  currentStreak: number
  moduleLockStates: Record<string, ModuleLockState>
}

function ArrowButton({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Mapa anterior' : 'Siguiente mapa'}
      className="absolute top-1/2 z-30 flex items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-90 select-none"
      style={{
        [direction === 'prev' ? 'left' : 'right']: '1.5%',
        transform: 'translateY(-50%)',
        width: 'clamp(32px, 5.5vw, 64px)',
        height: 'clamp(32px, 5.5vw, 64px)',
        background: 'rgba(255,255,255,0.28)',
        border: '2px solid rgba(255,255,255,0.55)',
        backdropFilter: 'blur(6px)',
        fontSize: 'clamp(1.1rem, 3vw, 2.2rem)',
        color: '#fff',
        textShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  )
}

export function KidsMapSceneDesktop({ modules, childName, childAvatar, currentStreak, moduleLockStates }: Props) {
  const [page, setPage] = useState(0)

  const totalPages = Math.max(1, Math.ceil(modules.length / PER_MAP))
  const visibleModules = modules.slice(page * PER_MAP, (page + 1) * PER_MAP)
  const greeting = childName ? `¡Hola, ${childName}!` : '¡Hola!'

  return (
    <div
      className="hidden lg:block relative"
      style={{
        minHeight: '100svh',
        background: '#baa0d8',
        paddingTop: 'max(0px, calc((100svh - 56.25vw) / 2 - 90px))',
        paddingBottom: 'max(0px, calc((100svh - 56.25vw) / 2))',
      }}
    >
      <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/first_map.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
          draggable={false}
        />

        <div
          className="absolute inset-x-0 top-0 pointer-events-none z-10"
          style={{ height: '25%', background: 'linear-gradient(to bottom, rgba(70,20,130,0.55) 0%, transparent 100%)' }}
        />

        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between pl-5 pr-[3%] py-[2%]">
          <span
            className="font-bold tracking-widest uppercase text-white/70"
            style={{ fontSize: 'clamp(0.6rem, 1.2vw, 0.85rem)' }}
          >
            Strides
          </span>
          <div className="flex items-center gap-4 mr-14">
            {currentStreak > 0 ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-400/40"
                style={{ background: 'rgba(251,146,60,0.2)', fontSize: 'clamp(0.65rem, 1.4vw, 0.9rem)' }}
              >
                <span style={{ fontSize: 'clamp(0.8rem, 1.6vw, 1.1rem)' }}>🔥</span>
                <span className="font-bold text-white">{currentStreak}</span>
                <span className="text-white/70">{currentStreak === 1 ? 'día seguido' : 'días seguidos'}</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20"
                style={{ background: 'rgba(255,255,255,0.1)', fontSize: 'clamp(0.65rem, 1.4vw, 0.9rem)' }}
              >
                <span className="opacity-60 grayscale" style={{ fontSize: 'clamp(0.8rem, 1.6vw, 1.1rem)' }}>🔥</span>
                <span className="text-white/70">Sin racha</span>
              </div>
            )}
            <Link
              href="/select-profile"
              className="flex items-center gap-1.5 transition-opacity hover:opacity-70 text-white/80"
              style={{ fontSize: 'clamp(0.65rem, 1.3vw, 0.9rem)' }}
            >
              <span style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.2rem)' }}>{childAvatar}</span>
              <span>{childName ?? 'Cambiar perfil'}</span>
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="transition-opacity hover:opacity-70 text-white/50"
                style={{ fontSize: 'clamp(0.6rem, 1.1vw, 0.8rem)' }}
              >
                Salir
              </button>
            </form>
          </div>
        </header>

        <div className="absolute left-0 right-0 z-30 text-center pointer-events-none" style={{ top: '9%' }}>
          <p
            className="font-extrabold leading-tight"
            style={{ fontSize: 'clamp(1rem, 3.5vw, 2.2rem)', color: '#fff', textShadow: '0 2px 10px rgba(70,20,130,0.5)' }}
          >
            {greeting}{' '}
            <span className="inline-block animate-float origin-bottom-right">👋</span>
          </p>
        </div>

        <div key={page}>
          {visibleModules.map((module, index) => {
            const pos = ISLAND_POSITIONS[index]
            if (!pos) return null
            return (
              <div
                key={module.id}
                className="absolute z-20"
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: 'min(44vw, 280px)', transform: 'translate(-50%, -55%)' }}
              >
                <KidsModuleCard module={module} index={index} lockState={moduleLockStates[module.id]} />
              </div>
            )
          })}
        </div>

        {page > 0 && <ArrowButton direction="prev" onClick={() => setPage(p => Math.max(p - 1, 0))} />}
        {page < totalPages - 1 && <ArrowButton direction="next" onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} />}

        {totalPages > 1 && (
          <div className="absolute left-1/2 z-30 flex items-center gap-2" style={{ bottom: '3%', transform: 'translateX(-50%)' }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Mapa ${i + 1}`}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === page ? 'clamp(10px, 1.8vw, 16px)' : 'clamp(7px, 1.2vw, 11px)',
                  height: i === page ? 'clamp(10px, 1.8vw, 16px)' : 'clamp(7px, 1.2vw, 11px)',
                  background: i === page ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: i === page ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                }}
              />
            ))}
          </div>
        )}

        {modules.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none">
            <p style={{ fontSize: '3rem' }}>🚧</p>
            <p className="font-medium text-white/70 mt-2" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>
              Contenido en preparación
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

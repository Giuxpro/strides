'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { REVIEW_MIN_POOL } from '@strides/core/kids'

interface Props {
  count: number
}

// Entrada al refuerzo espaciado (cross-módulo). Siempre visible para no
// confundir al niño con algo que aparece/desaparece: cuando aún no hay
// suficientes palabras, se muestra apagada y explica el porqué al tocarla.
export function ReforzarPill({ count }: Props) {
  if (count >= REVIEW_MIN_POOL) {
    const label = count > 9 ? '9+' : String(count)
    return (
      <Link
        href="/kids/play/reforzar"
        aria-label={`Reforzar tu vocabulario: ${count} palabras para repasar`}
        className="relative inline-flex items-center gap-2 rounded-full pl-3.5 pr-5 py-2.5 border transition-transform hover:scale-105 active:scale-95 select-none"
        style={{
          background: 'rgba(45,212,191,0.2)',
          borderColor: 'rgba(45,212,191,0.55)',
          boxShadow: '0 0 22px rgba(45,212,191,0.4)',
        }}
      >
        <span className="text-2xl leading-none">💪</span>
        <span className="font-extrabold text-white text-base leading-none">Reforzar</span>

        {/* Badge de notificación: burbuja coral con radar pulsante que invita a tocar */}
        <span className="absolute -top-2 -right-2 flex items-center justify-center">
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping motion-reduce:animate-none"
            style={{ background: '#fb7185' }}
          />
          <span
            className="relative inline-flex items-center justify-center min-w-[1.4rem] h-[1.4rem] px-1 rounded-full text-xs font-extrabold text-white tabular-nums"
            style={{ background: '#fb7185' }}
          >
            {label}
          </span>
        </span>
      </Link>
    )
  }

  return <ReforzarPillLocked />
}

function ReforzarPillLocked() {
  const [showHint, setShowHint] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function reveal() {
    setShowHint(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setShowHint(false), 2800)
  }

  return (
    <div className="relative">
      <button
        onClick={reveal}
        aria-label="Reforzar: aún no tienes palabras para repasar"
        className="relative inline-flex items-center gap-2 rounded-full pl-3.5 pr-5 py-2.5 border transition-transform active:scale-95 select-none"
        style={{
          background: 'rgba(148,163,184,0.16)',
          borderColor: 'rgba(148,163,184,0.4)',
          opacity: 0.75,
        }}
      >
        <span className="text-2xl leading-none grayscale">💪</span>
        <span className="font-extrabold text-white/60 text-base leading-none">Reforzar</span>
      </button>

      {showHint && (
        <div
          className="absolute left-0 top-full mt-2 z-50 max-w-[220px] px-3 py-2 rounded-2xl text-xs font-semibold leading-snug shadow-lg animate-slide-up"
          style={{ background: 'rgba(255,253,245,0.97)', color: '#4a3728' }}
        >
          Aún no hay palabras para reforzar. ¡Sigue jugando y aparecerán aquí!
        </div>
      )}
    </div>
  )
}

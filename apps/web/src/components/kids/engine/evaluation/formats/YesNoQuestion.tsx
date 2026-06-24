'use client'

import { useState, useRef, useEffect } from 'react'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import type { EvalFormatProps } from '../types'

const THRESHOLD = 70

// Comparación literal: a la izquierda la palabra (texto y/o solo sonido), a la
// derecha la imagen, y un "=" en medio. El niño desliza la tarjeta para decir si
// la igualdad es cierta (➡️ sí) o no (⬅️ no). La tarjeta vuelve al centro con ✓/✗.
export function YesNoQuestion({ item, allVocab, moduleConfig, onAnswer, autoPlay = true }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const startX = useRef(0)

  const [{ isMatch, shownWord, showText }] = useState(() => {
    const others = allVocab.filter(v => v.id !== vocab.id)
    const match = others.length === 0 ? true : Math.random() < 0.5
    const shown = match ? vocab : others[Math.floor(Math.random() * others.length)]!
    return { isMatch: match, shownWord: shown, showText: Math.random() < 0.5 }
  })
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [answered, setAnswered] = useState<boolean | null>(null)

  const imgUrl = getVocabImageUrl(vocab)

  useEffect(() => {
    if (!autoPlay) return
    const t = setTimeout(() => speak(shownWord.text_en), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  function answer(saidYes: boolean) {
    if (answered !== null) return
    setAnswered(saidYes === isMatch)
    setDx(0) // vuelve al centro; el resultado se ve con borde + icono
    setTimeout(() => onAnswer(saidYes === isMatch), 800)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (answered !== null) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    startX.current = e.clientX
    setDragging(true)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return
    setDx(e.clientX - startX.current)
  }

  function onPointerUp() {
    if (!dragging) return
    setDragging(false)
    if (Math.abs(dx) >= THRESHOLD) answer(dx > 0)
    else setDx(0)
  }

  const yesHint = answered !== null ? 0 : Math.max(0, Math.min(1, dx / THRESHOLD))
  const noHint = answered !== null ? 0 : Math.max(0, Math.min(1, -dx / THRESHOLD))
  const resultBorder = answered === null ? 'var(--kids-border-color)' : answered ? '#22c55e' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full flex items-center justify-center" style={{ minHeight: 120 }}>
        {/* Pistas de dirección al deslizar */}
        <span className="absolute left-1 text-3xl transition-opacity pointer-events-none" style={{ opacity: noHint, color: '#ef4444' }}>✗</span>
        <span className="absolute right-1 text-3xl transition-opacity pointer-events-none" style={{ opacity: yesHint, color: '#22c55e' }}>✓</span>

        {/* Resultado: ✓/✗ grande superpuesto al responder */}
        {answered !== null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-6xl drop-shadow" style={{ color: answered ? '#22c55e' : '#ef4444' }}>
              {answered ? '✓' : '✗'}
            </span>
          </div>
        )}

        {/* Tarjeta comparativa deslizable */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl select-none"
          style={{
            touchAction: 'none',
            cursor: answered === null ? 'grab' : 'default',
            background: 'var(--kids-bg)',
            border: `2.5px solid ${resultBorder}`,
            transform: `translateX(${dx}px) rotate(${dx * 0.03}deg)`,
            transition: dragging ? 'none' : 'transform 0.3s ease-out, border-color 0.2s',
          }}
        >
          {/* Izquierda: palabra (texto y/o sonido) */}
          <div className="flex flex-col items-center gap-1.5 w-[72px]">
            <button
              type="button"
              onPointerDown={e => e.stopPropagation()}
              onClick={() => speak(shownWord.text_en)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all active:scale-90"
              style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
              aria-label="Escuchar"
            >
              🔊
            </button>
            {showText && (
              <span className="text-sm font-bold capitalize text-center leading-tight" style={{ color: 'var(--kids-text)' }}>
                {shownWord.text_en}
              </span>
            )}
          </div>

          {/* Centro: "equal to" protagonista + traducción */}
          <div className="flex flex-col items-center leading-none px-0.5">
            <span className="text-sm font-black" style={{ color: moduleConfig.accent }}>equal to</span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--kids-text-muted)' }}>igual a</span>
          </div>

          {/* Derecha: imagen */}
          <div className="w-[72px] h-[72px] rounded-xl flex items-center justify-center" style={{ background: 'var(--kids-surface)' }}>
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl} alt="" className="w-14 h-14 object-contain" draggable={false} />
            ) : (
              <span className="text-3xl">🖼️</span>
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
        Desliza ➡️ si coinciden · ⬅️ si no
      </p>
    </div>
  )
}

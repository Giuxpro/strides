'use client'

/**
 * VowelsSequenceGame — Ordena las vocales de la A a la U
 *
 * TOP:    5 slots en orden fijo A→E→I→O→U (vacíos, sin pista de letra)
 * BOTTOM: cartas con letra + emoji + nombre mezcladas
 * Drag:   arrastra cada carta al slot que le corresponde por ORDEN
 * Audio:  pronuncia la vocal al agarrar, el animal al soltar correctamente
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import type { VocabItem, ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'

interface Props {
  items: VocabItem[]
  onComplete: (correct: number, total: number, wordResults?: WordResult[]) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

interface VowelDef {
  letter: string
  animal: string
  emoji: string
  color: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp
  }
  return a
}

// Orden canónico A→E→I→O→U — los slots siempre van en este orden
const VOWEL_DEFS: VowelDef[] = [
  { letter: 'A', animal: 'Ant',      emoji: '🐜', color: '#FF6B6B' },
  { letter: 'E', animal: 'Elephant', emoji: '🐘', color: '#4ECDC4' },
  { letter: 'I', animal: 'Iguana',   emoji: '🦎', color: '#E17055' },
  { letter: 'O', animal: 'Octopus',  emoji: '🐙', color: '#A29BFE' },
  { letter: 'U', animal: 'Unicorn',  emoji: '🦄', color: '#FD79A8' },
]

interface DragState { letter: string; x: number; y: number; size: number }

export function VowelsSequenceGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const speakFn = useSpeak()

  // Una sola ronda — 5 vocales, una pasada
  const [poolOrder] = useState(() => shuffle([...VOWEL_DEFS]))

  const [placed,     setPlaced]     = useState<Record<string, boolean>>({})
  const [wrongSlot,  setWrongSlot]  = useState<string | null>(null)
  const [drag,       setDrag]       = useState<DragState | null>(null)
  const [burst,      setBurst]      = useState(false)
  const [hadWrong,   setHadWrong]   = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const slotRefs     = useRef<Record<string, HTMLDivElement | null>>({})
  const pieceRefs    = useRef<Record<string, HTMLDivElement | null>>({})

  const placedCount = Object.keys(placed).length

  function startDrag(def: VowelDef, e: React.PointerEvent) {
    if (isTerminated || burst || placed[def.letter]) return
    const el = pieceRefs.current[def.letter]
    if (!el) return
    el.setPointerCapture(e.pointerId)
    const rect = el.getBoundingClientRect()
    const cr   = containerRef.current?.getBoundingClientRect()
    speakFn(def.letter)
    setDrag({ letter: def.letter, size: rect.width, x: e.clientX - (cr?.left ?? 0), y: e.clientY - (cr?.top ?? 0) })
  }

  const moveDrag = useCallback((e: PointerEvent) => {
    if (!drag || !containerRef.current) return
    const cr = containerRef.current.getBoundingClientRect()
    setDrag(d => d ? { ...d, x: e.clientX - cr.left, y: e.clientY - cr.top } : null)
  }, [drag])

  const endDrag = useCallback((e: PointerEvent) => {
    if (!drag || !containerRef.current) return
    const cr = containerRef.current.getBoundingClientRect()
    const px = e.clientX - cr.left
    const py = e.clientY - cr.top

    let hitSlot: string | null = null
    for (const def of VOWEL_DEFS) {
      if (placed[def.letter]) continue
      const el = slotRefs.current[def.letter]
      if (!el) continue
      const er = el.getBoundingClientRect()
      const lx = er.left - cr.left; const ly = er.top - cr.top
      if (px >= lx && px <= lx + er.width && py >= ly && py <= ly + er.height) {
        hitSlot = def.letter; break
      }
    }

    if (hitSlot) {
      if (hitSlot === drag.letter) {
        reportCorrect()
        const def = VOWEL_DEFS.find(d => d.letter === drag.letter)!
        speakFn(def.animal)
        const newPlaced = { ...placed, [hitSlot]: true }
        setPlaced(newPlaced)

        if (Object.keys(newPlaced).length === VOWEL_DEFS.length) {
          setBurst(true)
          const correct = hadWrong ? 0 : 1
          setTimeout(() => {
            onComplete(correct, 1)
          }, 1300)
        }
      } else {
        reportWrong()
        setHadWrong(true)
        setWrongSlot(hitSlot)
        setTimeout(() => setWrongSlot(null), 600)
      }
    }
    setDrag(null)
  }, [drag, placed, hadWrong])

  useEffect(() => {
    window.addEventListener('pointermove', moveDrag)
    window.addEventListener('pointerup',   endDrag)
    return () => {
      window.removeEventListener('pointermove', moveDrag)
      window.removeEventListener('pointerup',   endDrag)
    }
  }, [moveDrag, endDrag])

  const dragDef = drag ? VOWEL_DEFS.find(d => d.letter === drag.letter) : null

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <div className="absolute top-[-15%] right-[-10%] w-[320px] h-[320px] rounded-full opacity-20 blur-[90px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }} />
      <div className="absolute bottom-[-15%] left-[-10%] w-[260px] h-[260px] rounded-full opacity-15 blur-[80px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)` }} />

      <header className="relative z-10 px-4 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: moduleConfig.accent }}>← Volver</button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              Ordena las vocales
            </p>
            <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--kids-text)' }}>
              {placedCount}/{VOWEL_DEFS.length} colocadas
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: progress.total }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{ background: i < progress.current ? moduleConfig.accent : 'var(--kids-border-color)' }} />
          ))}
        </div>
      </header>

      <main
        ref={containerRef}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 gap-5 sm:gap-6 py-8 sm:py-10"
        style={{ touchAction: 'none' }}
      >
        <p className="text-sm sm:text-base font-semibold text-center" style={{ color: 'var(--kids-text-faint)' }}>
          {burst ? '¡Perfecto! 🎉' : 'Ordena las vocales de la A a la U'}
        </p>

        {/* TOP — slots en orden fijo A→E→I→O→U, sin pista hasta colocar */}
        <div className="flex gap-2 sm:gap-3 justify-center py-2">
          {VOWEL_DEFS.map((def, pos) => {
            const isPlaced = !!placed[def.letter]
            const isWrong  = wrongSlot === def.letter

            return (
              <div
                key={def.letter}
                ref={el => { slotRefs.current[def.letter] = el }}
                className="flex flex-col items-center justify-between rounded-2xl transition-all duration-200 relative"
                style={{
                  width:  'clamp(62px, 18vw, 92px)',
                  height: 'clamp(74px, 21vw, 110px)',
                  background: isPlaced ? def.color : 'var(--kids-surface)',
                  border: `3px ${isPlaced ? 'solid' : 'dashed'} ${
                    isWrong  ? '#ef4444' :
                    isPlaced ? 'rgba(255,255,255,0.5)' :
                    'var(--kids-border-color)'
                  }`,
                  boxShadow: isWrong
                    ? '0 0 0 3px #ef444466'
                    : isPlaced
                      ? `0 6px 0 ${def.color}bb, 0 10px 24px ${def.color}44`
                      : 'none',
                  animation: isWrong ? 'vs-shake 0.4s ease' : undefined,
                  padding:   isPlaced ? '8px 6px 6px' : '0',
                  gap:       '2px',
                }}
              >
                {isPlaced ? (
                  <>
                    <span className="font-extrabold text-white leading-none"
                      style={{ fontSize: 'clamp(20px, 5.8vw, 30px)', textShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                      {def.letter}
                    </span>
                    <span style={{ fontSize: 'clamp(20px, 5.8vw, 30px)', lineHeight: 1 }}>{def.emoji}</span>
                    <span className="font-bold rounded-lg w-full text-center truncate px-1 py-0.5"
                      style={{ fontSize: 'clamp(8px, 2.2vw, 11px)', background: 'rgba(255,255,255,0.85)', color: '#374151' }}>
                      {def.animal}
                    </span>
                  </>
                ) : (
                  /* Número de posición — hint mínimo sin revelar la letra */
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-black"
                      style={{ fontSize: 'clamp(18px, 5vw, 26px)', color: 'var(--kids-border-color)', opacity: 0.5 }}>
                      {pos + 1}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3" style={{ maxWidth: 420 }}>
          <div className="flex-1 h-px" style={{ background: 'var(--kids-border-color)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
            arrastra hacia arriba
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--kids-border-color)' }} />
        </div>

        {/* BOTTOM — cartas mezcladas con letra + emoji + nombre */}
        <div className="flex gap-2 sm:gap-3 justify-center py-2">
          {poolOrder.map(def => {
            const isPlaced  = !!placed[def.letter]
            const isDragged = drag?.letter === def.letter

            return (
              <div
                key={def.letter}
                ref={el => { pieceRefs.current[def.letter] = el }}
                onPointerDown={e => startDrag(def, e)}
                className="flex flex-col items-center justify-center rounded-2xl touch-none select-none"
                style={{
                  width:   'clamp(62px, 18vw, 92px)',
                  height:  'clamp(74px, 21vw, 110px)',
                  background: isPlaced ? 'var(--kids-surface)' : def.color,
                  border: `3px solid ${isPlaced ? 'transparent' : 'rgba(255,255,255,0.5)'}`,
                  boxShadow: isPlaced ? 'none' : isDragged ? 'none' : `0 6px 0 ${def.color}bb, 0 10px 24px ${def.color}44`,
                  opacity:   isPlaced ? 0.15 : isDragged ? 0.25 : 1,
                  cursor:    isPlaced ? 'default' : 'grab',
                  gap:       '2px',
                  padding:   '8px 6px 6px',
                  pointerEvents: isPlaced ? 'none' : 'auto',
                }}
              >
                {!isPlaced && (
                  <>
                    <span className="font-extrabold text-white leading-none"
                      style={{ fontSize: 'clamp(20px, 5.8vw, 32px)', textShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
                      {def.letter}
                    </span>
                    <span style={{ fontSize: 'clamp(18px, 5.2vw, 26px)', lineHeight: 1 }}>{def.emoji}</span>
                    <span className="font-bold rounded-lg w-full text-center truncate px-1 py-0.5"
                      style={{ fontSize: 'clamp(8px, 2.2vw, 11px)', background: 'rgba(255,255,255,0.88)', color: '#374151' }}>
                      {def.animal}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* Ghost de arrastre */}
      {drag && dragDef && containerRef.current && (() => {
        const cr = containerRef.current!.getBoundingClientRect()
        return (
          <div
            className="fixed pointer-events-none z-50 flex flex-col items-center justify-center rounded-2xl"
            style={{
              width:     drag.size,
              height:    drag.size * 1.18,
              left:      cr.left + drag.x - drag.size / 2,
              top:       cr.top  + drag.y - drag.size * 0.59,
              background: dragDef.color,
              border:    '3px solid rgba(255,255,255,0.7)',
              boxShadow: `0 12px 36px ${dragDef.color}88, 0 0 0 3px rgba(255,255,255,0.25)`,
              transform: 'rotate(-3deg) scale(1.1)',
              gap:       '4px',
              padding:   '10px 8px',
            }}
          >
            <span className="font-extrabold text-white leading-none"
              style={{ fontSize: drag.size * 0.34, textShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
              {dragDef.letter}
            </span>
            <span style={{ fontSize: drag.size * 0.3, lineHeight: 1 }}>{dragDef.emoji}</span>
            <span className="font-bold rounded-lg w-full text-center truncate px-1.5 py-0.5"
              style={{ fontSize: Math.max(8, drag.size * 0.15), background: 'rgba(255,255,255,0.88)', color: '#374151' }}>
              {dragDef.animal}
            </span>
          </div>
        )
      })()}

      <style>{`
        @keyframes vs-shake {
          0%,100% { transform: translateX(0) }
          25%     { transform: translateX(-7px) }
          75%     { transform: translateX(7px) }
        }
      `}</style>
    </div>
  )
}

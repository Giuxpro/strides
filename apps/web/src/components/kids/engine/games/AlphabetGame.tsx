'use client'

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

interface LetterDef { letter: string; animal: string; emoji: string }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp
  }
  return a
}

const ALPHABET_DEFS: LetterDef[] = [
  { letter: 'A', animal: 'Ant',         emoji: '🐜' },
  { letter: 'B', animal: 'Bee',         emoji: '🐝' },
  { letter: 'C', animal: 'Cat',         emoji: '🐈' },
  { letter: 'D', animal: 'Dog',         emoji: '🦮' },
  { letter: 'E', animal: 'Elephant',    emoji: '🐘' },
  { letter: 'F', animal: 'Fox',         emoji: '🦊' },
  { letter: 'G', animal: 'Giraffe',     emoji: '🦒' },
  { letter: 'H', animal: 'Hippo',       emoji: '🦛' },
  { letter: 'I', animal: 'Iguana',      emoji: '🦎' },
  { letter: 'J', animal: 'Jellyfish',   emoji: '🪼' },
  { letter: 'K', animal: 'Kangaroo',    emoji: '🦘' },
  { letter: 'L', animal: 'Lion',        emoji: '🦁' },
  { letter: 'M', animal: 'Monkey',      emoji: '🐒' },
  { letter: 'N', animal: 'Nightingale', emoji: '🐦' },
  { letter: 'O', animal: 'Octopus',     emoji: '🐙' },
  { letter: 'P', animal: 'Panda',       emoji: '🐼' },
  { letter: 'Q', animal: 'Quetzal',     emoji: '🦜' },
  { letter: 'R', animal: 'Rabbit',      emoji: '🐰' },
  { letter: 'S', animal: 'Snake',       emoji: '🐍' },
  { letter: 'T', animal: 'Tiger',       emoji: '🐯' },
  { letter: 'U', animal: 'Unicorn',     emoji: '🦄' },
  { letter: 'V', animal: 'Vulture',     emoji: '🦅' },
  { letter: 'W', animal: 'Wolf',        emoji: '🐺' },
  { letter: 'X', animal: 'X-ray Fish',  emoji: '🐠' },
  { letter: 'Y', animal: 'Yak',         emoji: '🐂' },
  { letter: 'Z', animal: 'Zebra',       emoji: '🦓' },
]

const CARD_COLORS: string[] = [
  '#FF6B6B','#FF8E53','#FDB347','#A8E063','#56C596','#4ECDC4',
  '#45B7D1','#4F86C6','#A29BFE','#C44569','#FD79A8','#E84393',
  '#FF6B6B','#FF8E53','#FDB347','#A8E063','#56C596','#4ECDC4',
  '#45B7D1','#4F86C6','#A29BFE','#C44569','#FD79A8','#E84393',
  '#FF6B6B','#FF8E53',
]

interface DragState { letter: string; x: number; y: number; size: number }

export function AlphabetGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const speakFn = useSpeak()

  // Siempre 1 ronda — el juego es completar el abecedario una vez
  const [scrambled] = useState(() => shuffle([...ALPHABET_DEFS]))

  const [placed,     setPlaced]     = useState<Record<string, boolean>>({})
  const [wrongSlot,  setWrongSlot]  = useState<string | null>(null)
  const [drag,       setDrag]       = useState<DragState | null>(null)
  const [burst,      setBurst]      = useState(false)
  const [wrongCount, setWrongCount] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const slotRefs     = useRef<Record<string, HTMLDivElement | null>>({})
  const pieceRefs    = useRef<Record<string, HTMLDivElement | null>>({})

  const placedCount = Object.keys(placed).length
  const pct         = (placedCount / 26) * 100

  function startDrag(def: LetterDef, e: React.PointerEvent) {
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
    for (const def of ALPHABET_DEFS) {
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
        const animal = ALPHABET_DEFS.find(d => d.letter === drag.letter)!.animal
        speakFn(animal)
        const newPlaced = { ...placed, [hitSlot]: true }
        setPlaced(newPlaced)

        if (Object.keys(newPlaced).length === ALPHABET_DEFS.length) {
          setBurst(true)
          const correct = wrongCount === 0 ? 1 : 0
          setTimeout(() => {
            onComplete(correct, 1)
          }, 1800)
        }
      } else {
        reportWrong()
        setWrongCount(c => c + 1)
        setWrongSlot(hitSlot)
        setTimeout(() => setWrongSlot(null), 600)
      }
    }
    setDrag(null)
  }, [drag, placed, wrongCount])

  useEffect(() => {
    window.addEventListener('pointermove', moveDrag)
    window.addEventListener('pointerup',   endDrag)
    return () => {
      window.removeEventListener('pointermove', moveDrag)
      window.removeEventListener('pointerup',   endDrag)
    }
  }, [moveDrag, endDrag])

  const dragDef   = drag ? ALPHABET_DEFS.find(d => d.letter === drag.letter) : null
  const dragColor = dragDef ? CARD_COLORS[ALPHABET_DEFS.indexOf(dragDef)]! : '#999'

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden"
      style={{ background: 'var(--kids-bg)' }}>

      {/* Nebula atmosphere — respeta el tema usando los colores del módulo */}
      <div className="absolute pointer-events-none"
        style={{
          top: '-18%', right: '-10%', width: 360, height: 360,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${moduleConfig.gradientFrom}28, transparent)`,
          filter: 'blur(72px)',
        }} />
      <div className="absolute pointer-events-none"
        style={{
          bottom: '-12%', left: '-8%', width: 280, height: 280,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${moduleConfig.gradientTo}22, transparent)`,
          filter: 'blur(60px)',
        }} />

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between shrink-0"
        style={{
          padding: '16px 20px 10px',
          borderBottom: '1px solid var(--kids-border-color)',
        }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: moduleConfig.accent }}>
            ← Volver
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--kids-text-faint)' }}>
              El abecedario
            </p>
            <p className="font-extrabold text-base" style={{ color: 'var(--kids-text)' }}>
              {placedCount}
              <span style={{ color: 'var(--kids-text-faint)', fontWeight: 500 }}>/26</span>
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {Array.from({ length: progress.total }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-all"
              style={{
                background: i < progress.current ? moduleConfig.accent : 'var(--kids-border-color)',
                boxShadow: i < progress.current ? `0 0 6px ${moduleConfig.accent}99` : 'none',
              }} />
          ))}
        </div>
      </header>

      {/* ─── MAIN ────────────────────────────────────────────────── */}
      <main
        ref={containerRef}
        className="relative z-10 flex-1 flex flex-col"
        style={{
          gap: 8,
          padding: '10px 10px 6px',
        }}
      >
        {/* Instruction */}
        <p className="text-center shrink-0 font-semibold"
          style={{
            fontSize: 13,
            color: burst ? '#22c55e' : 'var(--kids-text-faint)',
            transition: 'color 0.4s',
            margin: 0,
          }}>
          {burst
            ? '¡Increíble! ¡Conoces el abecedario completo! 🌟'
            : 'Arrastra cada carta a su lugar en el abecedario'}
        </p>

        {/* Rainbow progress bar */}
        <div className="shrink-0 rounded-full overflow-hidden"
          style={{ height: 5, background: 'var(--kids-border-color)', margin: '0 4px' }}>
          <div className="rounded-full h-full transition-all"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg,#FF6B6B,#FDB347,#56C596,#4ECDC4,#45B7D1,#A29BFE,#FD79A8)',
              transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
              transitionDuration: '500ms',
              boxShadow: pct > 0 ? `0 0 8px ${moduleConfig.accent}66` : 'none',
            }} />
        </div>

        {/* ─── ABC BOARD ─────────────────────────────────── */}
        {/* flex-wrap + justify-center → última fila incompleta queda centrada igual que el pool */}
        <div className="shrink-0 flex flex-wrap justify-center"
          style={{ gap: 5, width: '100%', maxWidth: 680, margin: '0 auto' }}
        >
          {ALPHABET_DEFS.map((def, idx) => {
            const color    = CARD_COLORS[idx]!
            const isPlaced = !!placed[def.letter]
            const isWrong  = wrongSlot === def.letter

            return (
              <div
                key={def.letter}
                ref={el => { slotRefs.current[def.letter] = el }}
                className="flex flex-col items-center justify-between"
                style={{
                  width: 'clamp(50px, 13.5vw, 72px)',
                  aspectRatio: '1 / 1.1',
                  borderRadius: 10,
                  position: 'relative',
                  overflow: 'hidden',
                  background: isPlaced
                    ? color
                    : `radial-gradient(ellipse at 50% 0%, ${color}18, ${color}06)`,
                  border: `2px ${isPlaced ? 'solid' : 'dashed'} ${
                    isWrong  ? '#ef4444' :
                    isPlaced ? 'rgba(255,255,255,0.28)' :
                    `${color}55`
                  }`,
                  boxShadow: isWrong
                    ? `0 0 0 2px #ef444455, 0 0 16px #ef444433`
                    : isPlaced
                      ? `0 4px 0 ${color}aa, 0 6px 20px ${color}44, inset 0 1px 0 rgba(255,255,255,0.2)`
                      : `inset 0 2px 8px rgba(0,0,0,0.12)`,
                  animation: isWrong
                    ? 'abc-shake 0.4s ease'
                    : isPlaced
                      ? 'abc-slot-pop 0.45s cubic-bezier(0.34,1.56,0.64,1)'
                      : undefined,
                  transition: 'border 0.2s, box-shadow 0.25s',
                  padding: isPlaced ? '4px 3px 3px' : 0,
                }}
              >
                {isPlaced ? (
                  <>
                    {/* Shine */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      height: '36%',
                      background: 'linear-gradient(180deg,rgba(255,255,255,0.22),transparent)',
                      borderRadius: '8px 8px 60% 60%',
                      pointerEvents: 'none',
                    }} />
                    <span className="font-black leading-none"
                      style={{ fontSize: 'clamp(10px, 2.8vw, 15px)', color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.28)', zIndex: 1 }}>
                      {def.letter}
                    </span>
                    <span style={{ fontSize: 'clamp(12px, 3.4vw, 19px)', lineHeight: 1, zIndex: 1 }}>
                      {def.emoji}
                    </span>
                    <span className="font-bold w-full text-center truncate rounded"
                      style={{ fontSize: 'clamp(4px, 1.2vw, 6.5px)', background: 'rgba(255,255,255,0.9)', color: '#111827', padding: '1px 3px', zIndex: 1 }}>
                      {def.animal}
                    </span>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-black" style={{ fontSize: 'clamp(9px, 2.6vw, 14px)', color: `${color}50` }}>
                      {def.letter}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ─── DIVIDER ─────────────────────────────────────── */}
        <div className="shrink-0 flex items-center gap-2" style={{ margin: '2px 4px', padding: '10px' }}>
          <div className="flex-1 h-px" style={{ background: 'var(--kids-border-color)' }} />
          <span className="font-bold whitespace-nowrap"
            style={{ fontSize: 10, color: 'var(--kids-text-faint)', letterSpacing: '0.07em' }}>
            ↑ ARRASTRA HACIA ARRIBA
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--kids-border-color)' }} />
        </div>

        {/* ─── POOL — flex wrap, todas las cards visibles ─────── */}
        <div className="shrink-0 flex flex-wrap justify-center" style={{ gap: 6, padding: '2px 4px 8px', width: '100%', maxWidth: 800, margin: '0 auto' }}>
          {scrambled.filter(def => !placed[def.letter]).map(def => {
            const origIdx  = ALPHABET_DEFS.indexOf(def)
            const color    = CARD_COLORS[origIdx]!
            const isDragged = drag?.letter === def.letter

            return (
              <div
                key={def.letter}
                ref={el => { pieceRefs.current[def.letter] = el }}
                onPointerDown={e => startDrag(def, e)}
                className="flex flex-col items-center justify-between"
                style={{
                  width:  'clamp(56px, 15vw, 72px)',
                  height: 'clamp(64px, 17vw, 84px)',
                  borderRadius: 11,
                  flexShrink: 0,
                  touchAction: 'none',
                  userSelect: 'none',
                  cursor: 'grab',
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '5px 4px 4px',
                  margin: '2px 0px',
                  gap: '2px',
                  background: color,
                  border: '2.5px solid rgba(255,255,255,0.32)',
                  boxShadow: isDragged
                    ? 'none'
                    : `0 5px 0 ${color}bb, 0 8px 20px ${color}55, inset 0 1px 0 rgba(255,255,255,0.26)`,
                  opacity: isDragged ? 0.18 : 1,
                  animation: `abc-card-in 0.38s cubic-bezier(0.34,1.56,0.64,1) ${origIdx * 0.015}s both`,
                  transition: 'box-shadow 0.15s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '36%',
                  background: 'linear-gradient(180deg,rgba(255,255,255,0.24),transparent)',
                  borderRadius: '9px 9px 60% 60%', pointerEvents: 'none',
                }} />
                <span className="font-black leading-none"
                  style={{ fontSize: 'clamp(15px, 4vw, 20px)', color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.25)', zIndex: 1 }}>
                  {def.letter}
                </span>
                <span style={{ fontSize: 'clamp(15px, 4vw, 20px)', lineHeight: 1, zIndex: 1 }}>
                  {def.emoji}
                </span>
                <span className="font-bold w-full text-center truncate rounded"
                  style={{ fontSize: 'clamp(6px, 1.4vw, 8px)', background: 'rgba(255,255,255,0.9)', color: '#111827', padding: '1px 3px', zIndex: 1 }}>
                  {def.animal}
                </span>
              </div>
            )
          })}
        </div>
      </main>

      {/* ─── DRAG GHOST ─────────────────────────────────────────── */}
      {drag && dragDef && containerRef.current && (() => {
        const cr = containerRef.current!.getBoundingClientRect()
        return (
          <div
            className="fixed pointer-events-none z-50 flex flex-col items-center justify-between"
            style={{
              width:  drag.size,
              height: drag.size * 1.18,
              left:   cr.left + drag.x - drag.size / 2,
              top:    cr.top  + drag.y - drag.size * 0.59,
              borderRadius: 12,
              background: dragColor,
              border: '3px solid rgba(255,255,255,0.55)',
              boxShadow: `0 16px 44px ${dragColor}cc, 0 0 0 3px rgba(255,255,255,0.12), 0 0 60px ${dragColor}55`,
              transform: 'rotate(-4deg) scale(1.12)',
              padding: '6px 5px 5px',
              gap: '2px',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '36%',
              background: 'linear-gradient(180deg,rgba(255,255,255,0.26),transparent)',
              borderRadius: '10px 10px 60% 60%', pointerEvents: 'none',
            }} />
            <span className="font-black leading-none"
              style={{ fontSize: drag.size * 0.32, color: 'white', textShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 1 }}>
              {dragDef.letter}
            </span>
            <span style={{ fontSize: drag.size * 0.34, lineHeight: 1, zIndex: 1 }}>{dragDef.emoji}</span>
            <span className="font-bold w-full text-center truncate rounded"
              style={{ fontSize: Math.max(5, drag.size * 0.12), background: 'rgba(255,255,255,0.9)', color: '#111827', padding: '1px 4px', zIndex: 1 }}>
              {dragDef.animal}
            </span>
          </div>
        )
      })()}

      <style>{`
        /* Keyframes */
        @keyframes abc-shake {
          0%,100% { transform: translateX(0) }
          25%     { transform: translateX(-5px) }
          75%     { transform: translateX(5px) }
        }
        @keyframes abc-slot-pop {
          0%   { transform: scale(0.72) }
          60%  { transform: scale(1.09) }
          100% { transform: scale(1) }
        }
        @keyframes abc-card-in {
          from { opacity: 0; transform: translateY(14px) scale(0.9) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { VocabItem, ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { getVocabImageUrl } from '@strides/core/kids'

interface Props {
  items: VocabItem[]
  onComplete: (correct: number, total: number, wordResults?: WordResult[]) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = a[i] as T; a[i] = a[j] as T; a[j] = temp
  }
  return a
}

const COLS = 3
const ROWS = 3
const GAP  = 4

const PAIR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B731', '#A29BFE',
  '#FD79A8', '#6C5CE7', '#00B894', '#E17055', '#74B9FF',
]

const SUNBURST = [
  'rgba(255,255,255,0.13) 0deg 22.5deg', 'transparent 22.5deg 45deg',
  'rgba(255,255,255,0.13) 45deg 67.5deg', 'transparent 67.5deg 90deg',
  'rgba(255,255,255,0.13) 90deg 112.5deg', 'transparent 112.5deg 135deg',
  'rgba(255,255,255,0.13) 135deg 157.5deg', 'transparent 157.5deg 180deg',
  'rgba(255,255,255,0.13) 180deg 202.5deg', 'transparent 202.5deg 225deg',
  'rgba(255,255,255,0.13) 225deg 247.5deg', 'transparent 247.5deg 270deg',
  'rgba(255,255,255,0.13) 270deg 292.5deg', 'transparent 292.5deg 315deg',
  'rgba(255,255,255,0.13) 315deg 337.5deg', 'transparent 337.5deg 360deg',
].join(', ')

const SPARKLE_POSITIONS = [
  { top: '-16%',   left: '10%',   delay: '0s',    size: 22 },
  { top: '-20%',   left: '48%',   delay: '0.15s', size: 28 },
  { top: '-16%',   right: '10%',  delay: '0.05s', size: 20 },
  { top: '38%',    left: '-14%',  delay: '0.25s', size: 24 },
  { top: '38%',    right: '-14%', delay: '0.1s',  size: 26 },
  { bottom: '-16%',left: '14%',   delay: '0.2s',  size: 22 },
  { bottom: '-20%',left: '48%',   delay: '0.3s',  size: 28 },
  { bottom: '-16%',right: '14%',  delay: '0.08s', size: 20 },
]

type PieceId = string
function pid(row: number, col: number): PieceId { return `${row}_${col}` }
function parseId(id: PieceId): { row: number; col: number } {
  const [r, c] = id.split('_').map(Number)
  return { row: r!, col: c! }
}
const ALL_PIECES: PieceId[] = Array.from({ length: ROWS * COLS }, (_, i) =>
  pid(Math.floor(i / COLS), i % COLS)
)

function pieceBg(row: number, col: number, imageUrl: string, opacity = 1): React.CSSProperties {
  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
    backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`,
    backgroundRepeat: 'no-repeat',
    opacity,
  }
}

interface DragState { pieceId: PieceId; x: number; y: number; size: number }

export function PuzzleGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()

  const [item] = useState(() => items[Math.floor(Math.random() * items.length)]!)
  const imageUrl = getVocabImageUrl(item)
  const cardColor = PAIR_COLORS[items.indexOf(item) % PAIR_COLORS.length]!

  const [shuffled]       = useState<PieceId[]>(() => shuffle([...ALL_PIECES]))
  const [placed,          setPlaced]       = useState<Record<PieceId, boolean>>({})
  const [wrongSlot,       setWrongSlot]    = useState<PieceId | null>(null)
  const [done,            setDone]         = useState(false)
  const [revealing,       setRevealing]    = useState(false)
  const [showSparkles,    setShowSparkles] = useState(false)
  const [showWord,        setShowWord]     = useState(false)
  const [drag,            setDrag]         = useState<DragState | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const slotRefs     = useRef<Record<PieceId, HTMLDivElement | null>>({})
  const pieceRefs    = useRef<Record<PieceId, HTMLDivElement | null>>({})

  const placedCount = Object.keys(placed).length

  useEffect(() => {
    if (!done) return
    const t1 = setTimeout(() => { setShowSparkles(true); setRevealing(true) }, 120)
    const t2 = setTimeout(() => setShowWord(true), 700)
    const t3 = setTimeout(() => setShowSparkles(false), 1600)
    const t4 = setTimeout(() => onComplete(1, 1, [{ vocabId: item.id, correct: true }]), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  function startDrag(pieceId: PieceId, e: React.PointerEvent) {
    if (isTerminated || done || placed[pieceId]) return
    const el = pieceRefs.current[pieceId]
    if (!el) return
    el.setPointerCapture(e.pointerId)
    const rect = el.getBoundingClientRect()
    const cr   = containerRef.current?.getBoundingClientRect()
    setDrag({
      pieceId,
      size: rect.width,
      x: e.clientX - (cr?.left ?? 0),
      y: e.clientY - (cr?.top  ?? 0),
    })
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

    let hitSlot: PieceId | null = null
    for (const slotId of ALL_PIECES) {
      if (placed[slotId]) continue
      const el = slotRefs.current[slotId]
      if (!el) continue
      const er = el.getBoundingClientRect()
      const lx = er.left - cr.left; const ly = er.top - cr.top
      if (px >= lx && px <= lx + er.width && py >= ly && py <= ly + er.height) {
        hitSlot = slotId; break
      }
    }

    if (hitSlot) {
      if (hitSlot === drag.pieceId) {
        reportCorrect()
        const newPlaced = { ...placed, [hitSlot]: true }
        setPlaced(newPlaced)
        if (Object.keys(newPlaced).length === ROWS * COLS) setDone(true)
      } else {
        reportWrong()
        setWrongSlot(hitSlot)
        setTimeout(() => setWrongSlot(null), 600)
      }
    }
    setDrag(null)
  }, [drag, placed, reportCorrect, reportWrong])

  useEffect(() => {
    window.addEventListener('pointermove', moveDrag)
    window.addEventListener('pointerup', endDrag)
    return () => {
      window.removeEventListener('pointermove', moveDrag)
      window.removeEventListener('pointerup', endDrag)
    }
  }, [moveDrag, endDrag])

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div className="absolute top-[-15%] right-[-10%] w-[340px] h-[340px] rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }} />
      <div className="absolute bottom-[-15%] left-[-10%] w-[280px] h-[280px] rounded-full opacity-15 blur-[80px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)` }} />

      <header className="relative z-10 px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
            ← Volver
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              Rompecabezas
            </p>
            <p className="font-bold text-lg" style={{ color: 'var(--kids-text)' }}>
              {placedCount}/{ROWS * COLS} piezas
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

      <main ref={containerRef} className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-3">
        <p className="text-base font-semibold text-center" style={{ color: 'var(--kids-text-faint)' }}>
          Arrastra las piezas y arma la imagen
        </p>

        {/* Board (60%) + Source (40%) side by side — constrained by viewport height on desktop */}
        <div
          className="flex items-stretch gap-3"
          style={{
            width: '100%',
            maxWidth: 'min(calc(100vw - 32px), 720px, calc((100vh - 210px) * 2))',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: revealing ? '20px' : '0px',
            marginBottom: revealing ? '20px' : '0px',
            transition: 'margin 0.5s ease',
          }}
        >

          {/* Board — 50% */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 16,
              overflow: 'hidden',
              transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.6s ease',
              transform: revealing ? 'translateX(50%) scale(1.04)' : 'translateX(0) scale(1)',
              boxShadow: revealing
                ? `0 16px 48px ${cardColor}99`
                : `0 4px 20px rgba(0,0,0,0.18)`,
            }}
          >
            {/* Faded reference */}
            {imageUrl && !revealing && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" draggable={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2, pointerEvents: 'none' }} />
            )}
            {!revealing && (
              <div style={{ position: 'absolute', inset: 0, background: `conic-gradient(${SUNBURST})`, opacity: 0.45, pointerEvents: 'none' }} />
            )}

            {/* Slot CSS grid */}
            {!revealing && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'grid',
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                gap: GAP,
                padding: GAP,
              }}>
                {ALL_PIECES.map(slotId => {
                  const { row, col } = parseId(slotId)
                  const isPlacedHere = !!placed[slotId]
                  const isWrong      = wrongSlot === slotId
                  return (
                    <div key={slotId} ref={el => { slotRefs.current[slotId] = el }}
                      style={{
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: isPlacedHere
                          ? `2px solid ${cardColor}88`
                          : isWrong
                            ? '2px solid #ef4444'
                            : '2px dashed rgba(255,255,255,0.35)',
                        boxShadow: isWrong
                          ? '0 0 12px #ef444488'
                          : isPlacedHere ? `0 0 12px ${cardColor}55` : 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        ...(isPlacedHere && imageUrl ? pieceBg(row, col, imageUrl) : {}),
                      }}
                    />
                  )
                })}
              </div>
            )}

            {/* Full image reveal */}
            {revealing && imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={item.text_en} draggable={false}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover',
                  animation: 'puzzle-reveal 0.55s cubic-bezier(0.4,0,0.2,1) forwards',
                }} />
            )}

            {/* Sparkles */}
            {showSparkles && SPARKLE_POSITIONS.map((sp, i) => (
              <span key={i} style={{
                position: 'absolute',
                fontSize: sp.size,
                animationDelay: sp.delay,
                animation: 'sparkle-pop 1.4s ease forwards',
                pointerEvents: 'none', zIndex: 10,
                ...(('right' in sp) ? { right: sp.right } : { left: sp.left }),
                ...(('bottom' in sp) ? { bottom: sp.bottom } : { top: sp.top }),
              }}>✨</span>
            ))}
          </div>

          {/* Source pieces — 50% */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            opacity: revealing ? 0 : 1,
            pointerEvents: revealing ? 'none' : 'auto',
            transition: 'opacity 0.35s ease',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gap: GAP,
            }}>
              {shuffled.map(pieceId => {
                const { row, col } = parseId(pieceId)
                const isPlaced   = !!placed[pieceId]
                const isDragging = drag?.pieceId === pieceId
                return (
                  <div
                    key={pieceId}
                    ref={el => { pieceRefs.current[pieceId] = el }}
                    onPointerDown={e => startDrag(pieceId, e)}
                    className="touch-none select-none"
                    style={{
                      aspectRatio: '1',
                      borderRadius: 9,
                      border: isPlaced ? 'none' : '2.5px solid rgba(255,255,255,0.65)',
                      boxShadow: isPlaced ? 'none' : '0 3px 10px rgba(0,0,0,0.2)',
                      cursor: isPlaced ? 'default' : 'grab',
                      opacity: isPlaced ? 0 : isDragging ? 0.25 : 1,
                      pointerEvents: isPlaced ? 'none' : 'auto',
                      ...(imageUrl && !isPlaced ? pieceBg(row, col, imageUrl) : { background: 'transparent' }),
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Word reveal */}
        {showWord && (
          <div className="animate-pop-in flex flex-col items-center gap-1.5">
            <div className="relative flex items-center gap-3 px-7 py-3 rounded-3xl overflow-hidden"
              style={{
                background: cardColor,
                border: '4px solid rgba(255,255,255,0.65)',
                boxShadow: `0 8px 28px ${cardColor}88`,
              }}>
              <div style={{ position: 'absolute', inset: 0, background: `conic-gradient(${SUNBURST})`, pointerEvents: 'none' }} />
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={item.text_en} className="relative w-10 h-10 object-contain drop-shadow-lg" draggable={false} />
              )}
              <span className="relative font-extrabold text-2xl text-white drop-shadow-md capitalize">
                {item.text_en}
              </span>
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--kids-text-faint)' }}>{item.text_es}</p>
          </div>
        )}
      </main>

      {/* Drag ghost — uses actual piece size from element */}
      {drag && imageUrl && (() => {
        const { row, col } = parseId(drag.pieceId)
        const cr = containerRef.current?.getBoundingClientRect()
        return (
          <div style={{
            position: 'fixed',
            width: drag.size, height: drag.size,
            left: (cr?.left ?? 0) + drag.x - drag.size / 2,
            top:  (cr?.top  ?? 0) + drag.y - drag.size / 2,
            borderRadius: 10,
            border: '3px solid rgba(255,255,255,0.85)',
            boxShadow: `0 8px 24px ${cardColor}99`,
            transform: 'rotate(4deg) scale(1.08)',
            pointerEvents: 'none', zIndex: 50,
            ...pieceBg(row, col, imageUrl),
          }} />
        )
      })()}

      <style>{`
        @keyframes puzzle-reveal {
          0%   { opacity: 0; transform: scale(0.92) }
          60%  { opacity: 1; transform: scale(1.03) }
          100% { opacity: 1; transform: scale(1) }
        }
        @keyframes sparkle-pop {
          0%   { transform: scale(0) rotate(0deg);    opacity: 0; }
          25%  { transform: scale(1.5) rotate(20deg); opacity: 1; }
          65%  { transform: scale(1.1) rotate(-10deg);opacity: 1; }
          100% { transform: scale(0) rotate(40deg);   opacity: 0; }
        }
      `}</style>
    </div>
  )
}

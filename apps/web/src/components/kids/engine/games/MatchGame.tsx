'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { VocabItem, ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
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

interface Line { fromId: string; toId: string; correct: boolean }
interface WrongPair { fromId: string; toId: string }

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

export function MatchGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const speakFn = useSpeak()
  const containerRef = useRef<HTMLDivElement>(null)

  const [leftCards]  = useState(() => items.map((v, i) => ({ ...v, color: PAIR_COLORS[i % PAIR_COLORS.length]! })))
  const [rightCards] = useState(() => shuffle(items.map((v, i) => ({ ...v, color: PAIR_COLORS[i % PAIR_COLORS.length]! }))))

  const [lines,      setLines]      = useState<Line[]>([])
  const [drawing,    setDrawing]    = useState<{ fromId: string; x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set())
  const [wrongPair,  setWrongPair]  = useState<WrongPair | null>(null)
  const [correct,    setCorrect]    = useState(0)

  const anchorRefs = useRef<Record<string, HTMLDivElement | null>>({})

  function getCenter(id: string) {
    const el = anchorRefs.current[id]
    const container = containerRef.current
    if (!el || !container) return null
    const er = el.getBoundingClientRect()
    const cr = container.getBoundingClientRect()
    return { x: er.left + er.width / 2 - cr.left, y: er.top + er.height / 2 - cr.top }
  }

  function startDrag(fromId: string) {
    if (isTerminated || matchedIds.has(fromId)) return
    const center = getCenter(`left-${fromId}`)
    if (!center) return
    setDrawing({ fromId, x1: center.x, y1: center.y, x2: center.x, y2: center.y })
  }

  const updateDrag = useCallback((e: PointerEvent) => {
    if (!drawing || !containerRef.current) return
    const cr = containerRef.current.getBoundingClientRect()
    setDrawing(d => d ? { ...d, x2: e.clientX - cr.left, y2: e.clientY - cr.top } : null)
  }, [drawing])

  const endDrag = useCallback((e: PointerEvent) => {
    if (!drawing || !containerRef.current) return
    const cr = containerRef.current.getBoundingClientRect()
    const x = e.clientX - cr.left
    const y = e.clientY - cr.top

    let targetId: string | null = null
    for (const item of items) {
      const center = getCenter(`right-${item.id}`)
      if (!center) continue
      if (Math.hypot(center.x - x, center.y - y) < 60) { targetId = item.id; break }
    }

    if (targetId && !matchedIds.has(targetId)) {
      const isCorrect = targetId === drawing.fromId
      if (isCorrect) {
        reportCorrect()
        speakFn(items.find(v => v.id === drawing.fromId)?.text_en ?? '')
        setMatchedIds(prev => new Set([...prev, drawing.fromId, targetId!]))
        setLines(prev => [...prev, { fromId: drawing.fromId, toId: targetId!, correct: true }])
        setCorrect(c => {
          const next = c + 1
          if (next === items.length) {
            setTimeout(() => {
              onComplete(items.length, items.length, items.map(v => ({ vocabId: v.id, correct: true })))
            }, 1000)
          }
          return next
        })
      } else {
        reportWrong()
        const wrongLine: Line = { fromId: drawing.fromId, toId: targetId, correct: false }
        setLines(prev => [...prev, wrongLine])
        setWrongPair({ fromId: drawing.fromId, toId: targetId })
        setTimeout(() => {
          setLines(prev => prev.filter(l => !(l.fromId === drawing.fromId && l.toId === targetId && !l.correct)))
          setWrongPair(null)
        }, 750)
      }
    }
    setDrawing(null)
  }, [drawing, matchedIds, items, reportCorrect, reportWrong, speakFn, onComplete])

  useEffect(() => {
    window.addEventListener('pointermove', updateDrag)
    window.addEventListener('pointerup', endDrag)
    return () => {
      window.removeEventListener('pointermove', updateDrag)
      window.removeEventListener('pointerup', endDrag)
    }
  }, [updateDrag, endDrag])

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <div
        className="absolute top-[-15%] left-[-10%] w-[350px] h-[350px] rounded-full opacity-20 blur-[90px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
      />

      <header className="relative z-10 px-4 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
            ← Volver
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              Trazado
            </p>
            <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--kids-text)' }}>
              {correct}/{items.length} parejas
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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        <p className="text-sm sm:text-base font-semibold mb-5 sm:mb-6" style={{ color: 'var(--kids-text-faint)' }}>
          Arrastra cada imagen hasta su palabra
        </p>

        {/* containerRef debe cubrir toda el área de interacción para el SVG y los cálculos de posición */}
        <div ref={containerRef} className="relative w-full max-w-sm">
          {/* SVG lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ overflow: 'visible' }}>
            <defs>
              <filter id="glow-match" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {lines.map(l => {
              const from = getCenter(`left-${l.fromId}`)
              const to   = getCenter(`right-${l.toId}`)
              if (!from || !to) return null
              const isWrong   = wrongPair?.fromId === l.fromId && wrongPair?.toId === l.toId
              const lineColor = l.correct
                ? (leftCards.find(c => c.id === l.fromId)?.color ?? '#22c55e')
                : '#ef4444'
              return (
                <line
                  key={`${l.fromId}-${l.toId}-${l.correct}`}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={lineColor}
                  strokeWidth={l.correct ? 4 : 3}
                  strokeLinecap="round"
                  strokeDasharray={l.correct ? 'none' : '8 5'}
                  filter={l.correct ? 'url(#glow-match)' : undefined}
                  opacity={l.correct ? 1 : 0.8}
                  style={isWrong ? { animation: 'line-shake 0.4s ease' } : undefined}
                />
              )
            })}
            {drawing && (
              <line
                x1={drawing.x1} y1={drawing.y1} x2={drawing.x2} y2={drawing.y2}
                stroke={leftCards.find(c => c.id === drawing.fromId)?.color ?? moduleConfig.accent}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="8 5"
                opacity={0.7}
              />
            )}
          </svg>

          <div className="flex justify-between items-center gap-3 sm:gap-4">
            {/* Left: image cards */}
            <div className="flex flex-col gap-2 sm:gap-3">
              {leftCards.map(item => {
                const isMatched = matchedIds.has(item.id)
                const isWrong   = wrongPair?.fromId === item.id
                const imgUrl    = getVocabImageUrl(item)

                return (
                  <div
                    key={item.id}
                    ref={el => { anchorRefs.current[`left-${item.id}`] = el }}
                    onPointerDown={() => startDrag(item.id)}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center overflow-hidden select-none touch-none"
                    style={{
                      background: item.color,
                      border: `3px solid ${isMatched ? 'rgba(255,255,255,0.3)' : isWrong ? '#ef4444' : 'rgba(255,255,255,0.65)'}`,
                      boxShadow: isMatched
                        ? `0 0 18px ${item.color}55`
                        : isWrong
                          ? '0 0 14px #ef444466'
                          : `0 4px 14px rgba(0,0,0,0.2)`,
                      opacity: isMatched ? 0.5 : 1,
                      cursor: isMatched ? 'default' : 'grab',
                      animation: isWrong ? 'card-shake 0.4s ease' : undefined,
                    }}
                  >
                    <div className="absolute inset-0" style={{ background: `conic-gradient(${SUNBURST})` }} />
                    <div className="relative z-10 flex flex-col items-center gap-1 p-1">
                      {imgUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgUrl} alt={item.text_en} className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md" draggable={false} />
                      ) : (
                        <span className="font-extrabold text-white text-xs text-center px-1 break-words leading-tight">{item.text_en}</span>
                      )}
                      {isMatched && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl sm:rounded-3xl" style={{ background: 'rgba(0,0,0,0.18)' }}>
                          <span className="text-2xl font-black" style={{ color: '#22c55e' }}>✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right: word cards */}
            <div className="flex flex-col gap-2 sm:gap-3">
              {rightCards.map(item => {
                const isMatched   = matchedIds.has(item.id)
                const isWrongDest = wrongPair?.toId === item.id

                return (
                  <div
                    key={item.id}
                    ref={el => { anchorRefs.current[`right-${item.id}`] = el }}
                    className="h-20 sm:h-24 px-3 sm:px-5 rounded-2xl sm:rounded-3xl flex items-center justify-center min-w-[110px] sm:min-w-[130px]"
                    style={{
                      background: isMatched ? `${item.color}22` : 'var(--kids-surface)',
                      border: `3px solid ${isMatched ? item.color : isWrongDest ? '#ef4444' : 'var(--kids-border-color)'}`,
                      boxShadow: isMatched
                        ? `0 0 18px ${item.color}55`
                        : isWrongDest
                          ? '0 0 12px #ef444466'
                          : 'none',
                      animation: isWrongDest ? 'card-shake 0.4s ease' : undefined,
                      transition: 'box-shadow 0.15s, border-color 0.15s',
                    }}
                  >
                    <span
                      className="font-extrabold text-xs sm:text-sm text-center capitalize break-words leading-tight"
                      style={{ color: isMatched ? item.color : isWrongDest ? '#ef4444' : 'var(--kids-text)' }}
                    >
                      {item.text_en}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </main>

      <style>{`
        @keyframes card-shake {
          0%,100% { transform: translateX(0) rotate(0deg) }
          20%     { transform: translateX(-7px) rotate(-2deg) }
          40%     { transform: translateX(7px)  rotate(2deg)  }
          60%     { transform: translateX(-5px) rotate(-1deg) }
          80%     { transform: translateX(5px)  rotate(1deg)  }
        }
        @keyframes line-shake {
          0%,100% { transform: translateY(0) }
          25%     { transform: translateY(-3px) }
          75%     { transform: translateY(3px) }
        }
      `}</style>
    </div>
  )
}

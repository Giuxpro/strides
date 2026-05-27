'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { VocabItem, ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { useSpeak } from '@/components/kids/VoicePresetProvider'
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

interface DragState { id: string; x: number; y: number }

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

export function DragMatchGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const speakFn = useSpeak()

  const [colorMap]  = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((v, i) => [v.id, PAIR_COLORS[i % PAIR_COLORS.length]!]))
  )
  const [words]  = useState(() => shuffle([...items]))
  const [images] = useState(() => shuffle([...items]))

  const [matched,      setMatched]      = useState<Record<string, string>>({})
  const [wrongIds,     setWrongIds]     = useState<Set<string>>(new Set())
  const [correctCount, setCorrectCount] = useState(0)
  const [drag,         setDrag]         = useState<DragState | null>(null)

  const dropZoneRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const wordCardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  function startDrag(id: string, e: React.PointerEvent) {
    if (isTerminated || matched[id] !== undefined) return
    const el = wordCardRefs.current[id]
    if (!el) return
    el.setPointerCapture(e.pointerId)
    const cr = containerRef.current?.getBoundingClientRect()
    setDrag({ id, x: e.clientX - (cr?.left ?? 0), y: e.clientY - (cr?.top ?? 0) })
  }

  const moveDrag = useCallback((e: PointerEvent) => {
    if (!drag || !containerRef.current) return
    const cr = containerRef.current.getBoundingClientRect()
    setDrag(d => d ? { ...d, x: e.clientX - cr.left, y: e.clientY - cr.top } : null)
  }, [drag])

  const endDrag = useCallback((e: PointerEvent) => {
    if (!drag || !containerRef.current) return
    const cr = containerRef.current.getBoundingClientRect()
    const x = e.clientX - cr.left
    const y = e.clientY - cr.top

    let droppedOnId: string | null = null
    for (const item of images) {
      const el = dropZoneRefs.current[item.id]
      if (!el) continue
      const er = el.getBoundingClientRect()
      const lx = er.left - cr.left; const ly = er.top - cr.top
      if (x >= lx && x <= lx + er.width && y >= ly && y <= ly + er.height) {
        droppedOnId = item.id; break
      }
    }

    if (droppedOnId) {
      const isCorrect = droppedOnId === drag.id
      if (isCorrect) {
        reportCorrect()
        speakFn(items.find(v => v.id === drag.id)?.text_en ?? '')
        setMatched(prev => ({ ...prev, [drag.id]: droppedOnId! }))
        setCorrectCount(c => {
          const next = c + 1
          if (next === items.length) {
            setTimeout(() => onComplete(items.length, items.length, items.map(v => ({ vocabId: v.id, correct: true }))), 900)
          }
          return next
        })
      } else {
        reportWrong()
        setWrongIds(prev => new Set([...prev, drag.id]))
        setTimeout(() => setWrongIds(prev => { const n = new Set(prev); n.delete(drag.id); return n }), 650)
      }
    }
    setDrag(null)
  }, [drag, images, items, reportCorrect, reportWrong, speakFn, onComplete])

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
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-20 blur-[80px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)` }}
      />

      <header className="relative z-10 px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
            ← Volver
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              Arrastra y une
            </p>
            <p className="font-bold text-lg" style={{ color: 'var(--kids-text)' }}>
              {correctCount}/{items.length} parejas
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

      <main className="relative z-10 flex-1 flex flex-col px-4 gap-6 justify-center" ref={containerRef}>
        <p className="text-base font-semibold text-center" style={{ color: 'var(--kids-text-faint)' }}>
          Arrastra cada palabra a su imagen
        </p>

        <div className="w-full max-w-2xl lg:max-w-4xl mx-auto flex flex-col gap-6">

        {/* Image drop zones */}
        <div
          className="grid gap-3 w-full"
          style={{ gridTemplateColumns: `repeat(${images.length}, 1fr)` }}
        >
          {images.map(item => {
            const wordMatchedHere   = Object.entries(matched).find(([, imgId]) => imgId === item.id)
            const isCorrectlyFilled = !!(wordMatchedHere && wordMatchedHere[0] === item.id)
            const imgUrl  = getVocabImageUrl(item)
            const color   = colorMap[item.id]!
            const isDragOver = drag && !matched[drag.id] && (() => {
              const el = dropZoneRefs.current[item.id]
              if (!el || !containerRef.current) return false
              const cr = containerRef.current.getBoundingClientRect()
              const er = el.getBoundingClientRect()
              return drag.x >= er.left - cr.left && drag.x <= er.right - cr.left &&
                     drag.y >= er.top  - cr.top  && drag.y <= er.bottom - cr.top
            })()

            return (
              <div
                key={item.id}
                ref={el => { dropZoneRefs.current[item.id] = el }}
                className="relative aspect-square rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-150"
                style={{
                  background: color,
                  border: isDragOver
                    ? '4px solid white'
                    : isCorrectlyFilled
                      ? '4px solid rgba(255,255,255,0.3)'
                      : '4px solid rgba(255,255,255,0.6)',
                  boxShadow: isDragOver
                    ? `0 0 0 3px ${color}, 0 8px 24px ${color}88`
                    : isCorrectlyFilled
                      ? `0 0 20px ${color}66`
                      : '0 4px 14px rgba(0,0,0,0.18)',
                  transform: isDragOver ? 'scale(1.08)' : 'scale(1)',
                  opacity: isCorrectlyFilled ? 0.6 : 1,
                }}
              >
                <div className="absolute inset-0" style={{ background: `conic-gradient(${SUNBURST})` }} />
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt={item.text_en} className="w-3/5 h-3/5 object-contain drop-shadow-lg" draggable={false} />
                  ) : (
                    <span className="font-extrabold text-white text-xl">{item.text_en[0]?.toUpperCase()}</span>
                  )}
                </div>
                {isCorrectlyFilled && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-3xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <span className="text-3xl font-black drop-shadow" style={{ color: '#22c55e' }}>✓</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Word cards — draggable */}
        <div
          className="grid gap-3 w-full"
          style={{ gridTemplateColumns: `repeat(${words.length}, 1fr)` }}
        >
          {words.map(item => {
            const isMatched  = matched[item.id] !== undefined
            const isWrong    = wrongIds.has(item.id)
            const isDragging = drag?.id === item.id
            const color      = colorMap[item.id]!

            return (
              <div
                key={item.id}
                ref={el => { wordCardRefs.current[item.id] = el }}
                onPointerDown={e => startDrag(item.id, e)}
                className="h-14 px-3 rounded-3xl flex items-center justify-center font-extrabold text-sm select-none touch-none transition-all duration-150"
                style={{
                  background: isMatched ? `${color}22` : isWrong ? 'rgba(239,68,68,0.12)' : 'var(--kids-surface)',
                  border: `4px solid ${isMatched ? color : isWrong ? '#ef4444' : 'var(--kids-border-color)'}`,
                  boxShadow: isMatched ? `0 0 16px ${color}55` : isWrong ? '0 0 10px #ef444466' : 'none',
                  color: isMatched ? color : isWrong ? '#ef4444' : 'var(--kids-text)',
                  opacity: isMatched ? 0.55 : isDragging ? 0.25 : 1,
                  cursor: isMatched ? 'default' : 'grab',
                  animation: isWrong ? 'drag-shake 0.4s ease' : undefined,
                }}
              >
                {item.text_en}
              </div>
            )
          })}
        </div>

        </div>{/* end max-w container */}

        {/* Drag ghost */}
        {drag && (
          <div
            className="fixed pointer-events-none z-50 min-w-[110px] md:min-w-[140px] h-16 md:h-20 px-6 rounded-3xl flex items-center justify-center font-extrabold text-base md:text-lg"
            style={{
              background: colorMap[drag.id] ?? moduleConfig.gradientFrom,
              border: '4px solid rgba(255,255,255,0.7)',
              boxShadow: `0 8px 28px ${colorMap[drag.id] ?? moduleConfig.accent}88`,
              color: '#fff',
              left: (containerRef.current?.getBoundingClientRect().left ?? 0) + drag.x - 48,
              top:  (containerRef.current?.getBoundingClientRect().top  ?? 0) + drag.y - 28,
              transform: 'rotate(3deg) scale(1.1)',
            }}
          >
            {items.find(v => v.id === drag.id)?.text_en}
          </div>
        )}
      </main>

      <style>{`
        @keyframes drag-shake {
          0%,100% { transform: translateX(0) rotate(0deg) }
          25%     { transform: translateX(-6px) rotate(-2deg) }
          75%     { transform: translateX(6px)  rotate(2deg)  }
        }
      `}</style>
    </div>
  )
}

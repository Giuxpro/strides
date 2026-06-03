'use client'

import { useState, useCallback, useEffect } from 'react'
import type { VocabItem, ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import { getVocabImageUrl } from '@strides/core/kids'

interface Card {
  uid: string
  pairId: string
  lang: 'en' | 'es'
  text: string
  enText: string
  imageUrl: string | null
}

interface Props {
  items: VocabItem[]
  onComplete: (correct: number, total: number, wordResults?: WordResult[]) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

function bestCols(total: number): number {
  if (total <= 6) return 3
  if (total % 4 === 0) return 4
  if (total % 5 === 0) return 5
  if (total % 3 === 0) return 3
  return 4
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = a[i] as T
    a[i] = a[j] as T
    a[j] = temp
  }
  return a
}

const CARD_BACK = `repeating-linear-gradient(
  -45deg,
  #f87171 0px,  #f87171 16px,
  #fb923c 16px, #fb923c 32px,
  #fbbf24 32px, #fbbf24 48px,
  #4ade80 48px, #4ade80 64px,
  #38bdf8 64px, #38bdf8 80px
)`

const SUNBURST_STOPS = [
  'rgba(255,255,255,0.14) 0deg 22.5deg',
  'transparent 22.5deg 45deg',
  'rgba(255,255,255,0.14) 45deg 67.5deg',
  'transparent 67.5deg 90deg',
  'rgba(255,255,255,0.14) 90deg 112.5deg',
  'transparent 112.5deg 135deg',
  'rgba(255,255,255,0.14) 135deg 157.5deg',
  'transparent 157.5deg 180deg',
  'rgba(255,255,255,0.14) 180deg 202.5deg',
  'transparent 202.5deg 225deg',
  'rgba(255,255,255,0.14) 225deg 247.5deg',
  'transparent 247.5deg 270deg',
  'rgba(255,255,255,0.14) 270deg 292.5deg',
  'transparent 292.5deg 315deg',
  'rgba(255,255,255,0.14) 315deg 337.5deg',
  'transparent 337.5deg 360deg',
].join(', ')

const LEV_DELAYS = ['0s','0.5s','1s','1.5s','0.25s','0.75s','1.25s','1.75s','0.1s','0.6s','1.1s','1.6s']

const PAIR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B731', '#A29BFE',
  '#FD79A8', '#6C5CE7', '#00B894', '#E17055', '#74B9FF',
  '#55EFC4', '#FDCB6E', '#E84393', '#00CEC9', '#FF7675',
]

export function MemoryGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const speakFn = useSpeak()

  const [cards] = useState<Card[]>(() =>
    shuffle([
      ...items.map(v => ({ uid: `en-${v.id}`, pairId: v.id, lang: 'en' as const, text: v.text_en, enText: v.text_en, imageUrl: getVocabImageUrl(v) })),
      ...items.map(v => ({ uid: `es-${v.id}`, pairId: v.id, lang: 'es' as const, text: v.text_es, enText: v.text_en, imageUrl: getVocabImageUrl(v) })),
    ])
  )

  const [flipped, setFlipped]       = useState<string[]>([])
  const [matched, setMatched]       = useState<Set<string>>(new Set())
  const [locked, setLocked]         = useState(false)
  const [pairsFound, setPairsFound] = useState(0)

  const totalPairs = items.length
  const getCard    = useCallback((uid: string) => cards.find(c => c.uid === uid)!, [cards])

  function flip(uid: string) {
    if (locked || isTerminated) return
    const card = getCard(uid)
    if (matched.has(card.pairId)) return
    if (flipped.includes(uid)) return
    if (flipped.length >= 2) return

    const next = [...flipped, uid]
    setFlipped(next)

    if (next.length === 2) {
      setLocked(true)
      const [a, b] = [getCard(next[0]!), getCard(next[1]!)]

      if (a.pairId === b.pairId && a.lang !== b.lang) {
        reportCorrect()
        speakFn(a.enText)
        setTimeout(() => {
          setMatched(prev => new Set([...prev, a.pairId]))
          setFlipped([])
          setLocked(false)
          setPairsFound(p => p + 1)
        }, 500)
      } else {
        reportWrong()
        setTimeout(() => { setFlipped([]); setLocked(false) }, 900)
      }
    }
  }

  function isFaceUp(uid: string) {
    return flipped.includes(uid) || matched.has(getCard(uid).pairId)
  }

  // Desktop: best layout; móvil: máx 4 cols para que las cartas no queden minúsculas
  const desktopCols = bestCols(cards.length)
  const mobileCols  = Math.min(desktopCols, 4)

  useEffect(() => {
    if (pairsFound === totalPairs && totalPairs > 0) {
      const t = setTimeout(() => {
        onComplete(totalPairs, totalPairs, items.map(v => ({ vocabId: v.id, correct: true })))
      }, 700)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairsFound])

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <div
        className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
      />

      <header className="relative z-10 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: moduleConfig.accent }}
          >
            ← Volver
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              Memoria
            </p>
            <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--kids-text)' }}>
              {pairsFound}/{totalPairs} parejas
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: progress.total }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: i < progress.current ? moduleConfig.accent : 'var(--kids-border-color)' }}
            />
          ))}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-5 sm:gap-8 py-4">
        <p className="text-sm sm:text-base font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
          Voltea las cartas y encuentra las dos iguales
        </p>

        <div
          className="mg-grid gap-2 sm:gap-3 md:gap-4 w-full max-w-2xl md:max-w-3xl lg:max-w-4xl"
          style={{ '--mg-cols': desktopCols, '--mg-cols-sm': mobileCols } as React.CSSProperties}
        >
          {cards.map((card, idx) => {
            const faceUp   = isFaceUp(card.uid)
            const isMatch  = matched.has(card.pairId)
            const levDelay = LEV_DELAYS[idx % LEV_DELAYS.length] ?? '0s'
            const pairIdx  = items.findIndex(v => v.id === card.pairId)
            const frontBg  = PAIR_COLORS[pairIdx % PAIR_COLORS.length] ?? moduleConfig.gradientFrom

            return (
              <div
                key={card.uid}
                className="aspect-square cursor-pointer select-none"
                style={{ perspective: '700px' }}
                onClick={() => flip(card.uid)}
              >
                <div
                  className="relative w-full h-full"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: faceUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 420ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* Back */}
                  <div
                    className="absolute inset-0 rounded-2xl sm:rounded-3xl flex items-center justify-center"
                    style={{
                      backfaceVisibility: 'hidden',
                      background: CARD_BACK,
                      border: '3px solid rgba(255,255,255,0.7)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.25)',
                    }}
                  >
                    <span className="text-white/40 text-2xl sm:text-3xl">✦</span>
                  </div>

                  {/* Front */}
                  <div
                    className="absolute inset-0 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center overflow-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: frontBg,
                      border: `3px solid rgba(255,255,255,${isMatch ? '0.35' : '0.72'})`,
                      boxShadow: isMatch
                        ? `0 0 28px ${moduleConfig.accentLight}, 0 4px 12px rgba(0,0,0,0.1)`
                        : '0 6px 20px rgba(0,0,0,0.22)',
                      opacity: isMatch ? 0.65 : 1,
                    }}
                  >
                    {/* Sunburst */}
                    <div
                      className="absolute inset-0"
                      style={{ background: `conic-gradient(${SUNBURST_STOPS})` }}
                    />

                    <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 w-full">
                      {card.imageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.imageUrl}
                            alt={card.enText}
                            className={`w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain drop-shadow-lg ${isMatch ? '' : 'animate-levitate'}`}
                            draggable={false}
                            style={{ animationDelay: levDelay }}
                          />
                          <div className="rounded-full px-1.5 sm:px-2.5 py-0.5" style={{ background: 'rgba(255,255,255,0.88)' }}>
                            <span className="text-gray-700 font-bold text-[9px] sm:text-[11px] md:text-xs leading-tight capitalize">
                              {card.enText}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="font-extrabold text-xs sm:text-sm leading-tight text-center text-white px-1.5 sm:px-2 break-words">
                          {card.enText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <style>{`
        .mg-grid {
          display: grid;
          grid-template-columns: repeat(var(--mg-cols-sm), 1fr);
        }
        @media (min-width: 640px) {
          .mg-grid {
            grid-template-columns: repeat(var(--mg-cols), 1fr);
          }
        }
      `}</style>
    </div>
  )
}

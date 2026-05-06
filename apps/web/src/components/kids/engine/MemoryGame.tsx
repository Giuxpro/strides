'use client'

import { useState, useCallback } from 'react'
import type { VocabItem } from './LessonEngine'
import type { ModuleConfig } from '@/components/kids/moduleConfig'
import { useGameEvents } from './modifiers/ModifierContext'

interface Card {
  uid: string
  pairId: string
  lang: 'en' | 'es'
  text: string
  imageUrl: string | null
}

interface Props {
  items: VocabItem[]
  onComplete: (correct: number, total: number) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
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

export function MemoryGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const [cards] = useState<Card[]>(() =>
    shuffle([
      ...items.map(v => ({ uid: `en-${v.id}`, pairId: v.id, lang: 'en' as const, text: v.text_en, imageUrl: v.image_url })),
      ...items.map(v => ({ uid: `es-${v.id}`, pairId: v.id, lang: 'es' as const, text: v.text_es, imageUrl: null })),
    ])
  )

  const [flipped, setFlipped] = useState<string[]>([])
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [locked, setLocked] = useState(false)
  const [pairsFound, setPairsFound] = useState(0)

  const totalPairs = items.length

  const getCard = useCallback((uid: string) => cards.find(c => c.uid === uid)!, [cards])

  function flip(uid: string) {
    if (locked || isTerminated) return
    const card = getCard(uid)
    if (matched.has(card.pairId)) return
    if (flipped.includes(uid)) return
    if (flipped.length >= 2) return

    const newFlipped = [...flipped, uid]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setLocked(true)
      const [a, b] = [getCard(newFlipped[0]!), getCard(newFlipped[1]!)]

      if (a.pairId === b.pairId && a.lang !== b.lang) {
        reportCorrect()
        setTimeout(() => {
          setMatched(prev => new Set([...prev, a.pairId]))
          setFlipped([])
          setLocked(false)
          setPairsFound(prev => prev + 1)
        }, 500)
      } else {
        reportWrong()
        setTimeout(() => {
          setFlipped([])
          setLocked(false)
        }, 800)
      }
    }
  }

  function isFaceUp(uid: string) {
    return flipped.includes(uid) || matched.has(getCard(uid).pairId)
  }

  const allMatched = pairsFound === totalPairs

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div
        className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
      />

      {/* Header */}
      <header className="relative z-10 px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: moduleConfig.accent }}
          >
            ← Volver
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              Memorama
            </p>
            <p className="font-bold text-lg" style={{ color: 'var(--kids-text)' }}>
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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-8">
        {/* Card grid — 4 cols for bigger cards */}
        <div className="grid grid-cols-4 gap-3 w-full max-w-md">
          {cards.map(card => {
            const faceUp  = isFaceUp(card.uid)
            const isMatch = matched.has(card.pairId)

            return (
              <button
                key={card.uid}
                onClick={() => flip(card.uid)}
                disabled={faceUp}
                className="aspect-square rounded-2xl flex items-center justify-center p-2 transition-all duration-200 active:scale-90 min-h-[80px]"
                style={{
                  background: faceUp
                    ? card.lang === 'en'
                      ? moduleConfig.gradient
                      : 'var(--kids-flip)'
                    : 'var(--kids-down)',
                  border: `2px solid ${
                    isMatch
                      ? moduleConfig.accent + '80'
                      : faceUp
                        ? 'var(--kids-border-color)'
                        : 'transparent'
                  }`,
                  opacity: isMatch ? 0.5 : 1,
                  boxShadow: isMatch ? `0 0 10px ${moduleConfig.accentLight}` : 'none',
                  transform: faceUp && !isMatch ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {faceUp ? (
                  card.lang === 'en' && card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.text}
                      className="w-12 h-12 object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span
                      className="font-bold text-sm leading-tight text-center break-words"
                      style={{ color: card.lang === 'en' ? '#ffffff' : 'var(--kids-text)' }}
                    >
                      {card.text}
                    </span>
                  )
                ) : (
                  <span style={{ color: 'var(--kids-text-faint)', fontSize: 16 }}>✦</span>
                )}
              </button>
            )
          })}
        </div>

        {allMatched && (
          <button
            onClick={() => onComplete(totalPairs, totalPairs)}
            className="animate-pop-in text-white font-extrabold text-lg px-10 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
          >
            ¡Listo! ✓
          </button>
        )}
      </main>
    </div>
  )
}

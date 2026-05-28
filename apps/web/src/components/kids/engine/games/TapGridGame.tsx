'use client'

import { useState } from 'react'
import type { VocabItem, ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { getVocabImageUrl } from '@strides/core/kids'

interface Card {
  uid: string
  type: 'image' | 'word'
  vocabId: string
  text_en: string
  imageUrl: string | null
  color: string
}

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

function bestCols(total: number): number {
  if (total <= 6)  return 3
  if (total === 10) return 5
  return 4
}

const PAIR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B731', '#A29BFE',
  '#FD79A8', '#6C5CE7', '#00B894', '#E17055', '#74B9FF',
  '#55EFC4', '#FDCB6E', '#E84393', '#00CEC9', '#FF7675',
]

export function TapGridGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()

  const [cards] = useState<Card[]>(() =>
    shuffle([
      ...items.map((v, i) => ({
        uid: `img-${v.id}`, type: 'image' as const,
        vocabId: v.id, text_en: v.text_en,
        imageUrl: getVocabImageUrl(v),
        color: PAIR_COLORS[i % PAIR_COLORS.length]!,
      })),
      ...items.map((v, i) => ({
        uid: `word-${v.id}`, type: 'word' as const,
        vocabId: v.id, text_en: v.text_en,
        imageUrl: null,
        color: PAIR_COLORS[i % PAIR_COLORS.length]!,
      })),
    ])
  )

  const [selected,   setSelected]   = useState<Card | null>(null)
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set())
  const [wrongUids,  setWrongUids]  = useState<Set<string>>(new Set())
  const [pairsFound, setPairsFound] = useState(0)

  function tapCard(card: Card) {
    if (isTerminated || matchedIds.has(card.vocabId)) return

    // Deselect if same card
    if (selected?.uid === card.uid) { setSelected(null); return }

    // Switch selection if same type
    if (!selected || selected.type === card.type) { setSelected(card); return }

    // Different type → check match
    const isCorrect = card.vocabId === selected.vocabId

    if (isCorrect) {
      reportCorrect()
      const next = pairsFound + 1
      setMatchedIds(prev => new Set([...prev, card.vocabId]))
      setSelected(null)
      setPairsFound(next)
      if (next === items.length) {
        setTimeout(() => onComplete(items.length, items.length, items.map(v => ({ vocabId: v.id, correct: true }))), 700)
      }
    } else {
      reportWrong()
      setWrongUids(new Set([card.uid, selected.uid]))
      setTimeout(() => { setWrongUids(new Set()); setSelected(null) }, 700)
    }
  }

  // Desktop: layout óptimo; móvil: máx 3 cols para que cards/texto sean legibles
  const desktopCols = bestCols(cards.length)
  const mobileCols  = Math.min(desktopCols, 3)
  const desktopRows = Math.ceil(cards.length / desktopCols)

  const instruction = !selected
    ? 'Toca la imagen o palabra para empezar'
    : selected.type === 'image'
      ? '¿Cuál es la palabra que corresponde a esta imagen?'
      : '¿Cuál es la imagen que corresponde a esta palabra?'

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <div
        className="absolute top-[-20%] right-[-20%] w-[350px] h-[350px] rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
      />

      <header className="relative z-10 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
            ← Volver
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              Toca los pares
            </p>
            <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--kids-text)' }}>
              {pairsFound}/{items.length} parejas
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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-4 sm:gap-5 py-4">

        <p
          className="text-sm sm:text-base font-semibold text-center transition-all duration-300 px-2"
          style={{ color: selected ? moduleConfig.accent : 'var(--kids-text-faint)' }}
        >
          {instruction}
        </p>

        <div
          className="tg-grid gap-2 sm:gap-3 w-full"
          style={{
            '--tg-cols':    desktopCols,
            '--tg-cols-sm': mobileCols,
            maxWidth: `min(calc(100vw - 32px), calc((100vh - 240px) * ${desktopCols} / ${desktopRows}))`,
            margin: '0 auto',
          } as React.CSSProperties}
        >
          {cards.map(card => {
            const isMatched  = matchedIds.has(card.vocabId)
            const isSelected = selected?.uid === card.uid
            const isWrong    = wrongUids.has(card.uid)

            // Texto adaptado al tamaño de card: más corto en móvil si es palabra larga
            const wordFontSize = card.text_en.length > 8
              ? '0.7rem'
              : card.text_en.length > 5
                ? '0.85rem'
                : '1rem'

            return (
              <button
                key={card.uid}
                onClick={() => tapCard(card)}
                disabled={isMatched}
                className="aspect-square rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all duration-200 active:scale-90 select-none relative overflow-hidden"
                style={{
                  background: card.type === 'image'
                    ? card.color
                    : isMatched
                      ? `${card.color}22`
                      : 'var(--kids-surface)',
                  border: isSelected
                    ? `4px solid white`
                    : isMatched
                      ? `4px solid ${card.color}`
                      : isWrong
                        ? `4px solid #ef4444`
                        : card.type === 'image'
                          ? `4px solid rgba(255,255,255,0.55)`
                          : `4px solid var(--kids-border-color)`,
                  boxShadow: isSelected
                    ? `0 0 0 3px ${card.color}, 0 8px 24px ${card.color}88`
                    : isMatched
                      ? `0 0 18px ${card.color}55`
                      : isWrong
                        ? '0 0 14px #ef444466'
                        : card.type === 'image'
                          ? '0 4px 14px rgba(0,0,0,0.18)'
                          : 'none',
                  opacity: isMatched ? 0.5 : 1,
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                  animation: isWrong ? 'tap-shake 0.4s ease' : undefined,
                }}
              >
                {card.type === 'image' ? (
                  <>
                    {card.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.imageUrl}
                        alt={card.text_en}
                        className="w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain drop-shadow-lg"
                        draggable={false}
                      />
                    ) : (
                      <span className="font-extrabold text-white text-xs sm:text-sm text-center px-1 break-words leading-tight">{card.text_en}</span>
                    )}
                    {isMatched && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl sm:rounded-3xl"
                        style={{ background: 'rgba(0,0,0,0.18)' }}>
                        <span className="text-2xl sm:text-3xl font-black drop-shadow" style={{ color: '#22c55e' }}>✓</span>
                      </div>
                    )}
                  </>
                ) : (
                  <span
                    className="font-extrabold text-center leading-tight capitalize px-1.5 sm:px-2 break-words"
                    style={{
                      fontSize: wordFontSize,
                      color: isMatched ? card.color : isWrong ? '#ef4444' : 'var(--kids-text)',
                    }}
                  >
                    {card.text_en}
                  </span>
                )}
              </button>
            )
          })}
        </div>

      </main>

      <style>{`
        @keyframes tap-shake {
          0%,100% { transform: translateX(0) }
          20%     { transform: translateX(-8px) }
          40%     { transform: translateX(8px) }
          60%     { transform: translateX(-5px) }
          80%     { transform: translateX(5px) }
        }
        .tg-grid {
          display: grid;
          grid-template-columns: repeat(var(--tg-cols-sm), 1fr);
        }
        @media (min-width: 640px) {
          .tg-grid {
            grid-template-columns: repeat(var(--tg-cols), 1fr);
          }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import type { VocabItem } from '../LessonEngine'
import type { ModuleConfig, WordResult, CountEmoji, GameRuntimeConfig } from '@strides/core/kids'
import { EMOJI_COUNT_POOL, numberWordEn, getVocabImageUrl, COUNTING_DEFAULTS } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'

interface Props {
  items: VocabItem[]
  onComplete: (correct: number, total: number, wordResults?: WordResult[]) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
  config?: GameRuntimeConfig
}

const MIN_COUNT = 1
const OPTION_COLORS = ['#FF6B6B', '#4ECDC4', '#F7B731']

interface Round {
  emoji: CountEmoji
  count: number
  options: number[]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp
  }
  return a
}

function numberOptions(correct: number, maxCount: number): number[] {
  const opts = new Set<number>([correct])
  // Con rango muy pequeño no siempre hay 3 distintos: acota las opciones al rango.
  const target = Math.min(3, maxCount - MIN_COUNT + 1)
  let guard = 0
  while (opts.size < target && guard++ < 50) {
    const delta = ([-2, -1, 1, 2] as const)[randInt(0, 3)]!
    let cand = correct + delta
    if (cand < MIN_COUNT) cand = correct + Math.abs(delta)
    if (cand > maxCount) cand = correct - Math.abs(delta)
    if (cand >= MIN_COUNT && cand <= maxCount) opts.add(cand)
  }
  return shuffle([...opts])
}

function buildRounds(maxCount: number, rounds: number): Round[] {
  const result: Round[] = []
  let lastCp = ''
  for (let i = 0; i < rounds; i++) {
    let emoji = EMOJI_COUNT_POOL[randInt(0, EMOJI_COUNT_POOL.length - 1)]!
    while (emoji.codepoint === lastCp) emoji = EMOJI_COUNT_POOL[randInt(0, EMOJI_COUNT_POOL.length - 1)]!
    lastCp = emoji.codepoint
    const count = randInt(MIN_COUNT, maxCount)
    result.push({ emoji, count, options: numberOptions(count, maxCount) })
  }
  return result
}

export function CountingGame({ onComplete, onBack, moduleConfig, progress, config }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const speak = useSpeak()

  const [rounds] = useState(() => {
    const maxCount = Math.max(MIN_COUNT + 1, Math.min(config?.maxCount ?? COUNTING_DEFAULTS.maxCount, 20))
    const roundCount = Math.max(1, Math.min(config?.rounds ?? COUNTING_DEFAULTS.rounds, 15))
    return buildRounds(maxCount, roundCount)
  })
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [countedUpTo, setCountedUpTo] = useState(0)
  const [counting, setCounting] = useState(false)
  const correctCountRef = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const round = rounds[current]!

  useEffect(() => {
    return () => { timers.current.forEach(clearTimeout) }
  }, [])

  useEffect(() => {
    // Reinicia el resaltado al cambiar de ronda
    setCountedUpTo(0)
    setCounting(false)
  }, [current])

  const imgUrl = getVocabImageUrl({ emoji_unicode: round.emoji.codepoint, image_url: null })
  const noun = round.count === 1 ? round.emoji.singular : round.emoji.plural

  function countAlong() {
    if (counting || selected !== null || isTerminated) return
    setCounting(true)
    setCountedUpTo(0)
    for (let n = 1; n <= round.count; n++) {
      const t = setTimeout(() => {
        setCountedUpTo(n)
        speak(numberWordEn(n))
        if (n === round.count) {
          const done = setTimeout(() => setCounting(false), 700)
          timers.current.push(done)
        }
      }, (n - 1) * 750)
      timers.current.push(t)
    }
  }

  function answer(option: number) {
    if (selected !== null || counting || isTerminated) return
    setSelected(option)
    const isCorrect = option === round.count
    if (isCorrect) {
      reportCorrect()
      correctCountRef.current += 1
      setCountedUpTo(round.count)
      speak(numberWordEn(round.count), { onEnd: () => speak(`${round.count} ${noun}`) })
    } else {
      reportWrong()
    }

    const t = setTimeout(() => {
      setSelected(null)
      if (current < rounds.length - 1) {
        setCurrent(c => c + 1)
      } else {
        onComplete(correctCountRef.current, rounds.length)
      }
    }, isCorrect ? 1600 : 1100)
    timers.current.push(t)
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[420px] h-[420px] rounded-full opacity-15 blur-[110px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)` }}
      />
      <div
        className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-10 blur-[90px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
      />

      <header className="relative z-10 px-4 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
            ← Volver
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              A contar
            </p>
            <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--kids-text)' }}>
              {current + 1}/{rounds.length}
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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-5 gap-5 sm:gap-6 py-4">

        {/* Pregunta */}
        <div className="flex flex-col items-center gap-1">
          <p className="font-extrabold text-lg sm:text-xl capitalize" style={{ color: 'var(--kids-text)' }}>
            How many {round.emoji.plural}?
          </p>
          <p className="text-sm font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
            ¿Cuántos ves?
          </p>
        </div>

        {/* Emojis a contar */}
        <div
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-md w-full p-4 rounded-3xl"
          style={{ background: 'rgba(255,255,255,0.55)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
        >
          {Array.from({ length: round.count }).map((_, i) => {
            const counted = i < countedUpTo
            return (
              <div key={i} className="relative">
                {imgUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl}
                    alt={round.emoji.singular}
                    draggable={false}
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain transition-transform duration-200"
                    style={{ transform: counted ? 'scale(1.18)' : 'scale(1)', filter: counted ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' : 'none' }}
                  />
                )}
                {counted && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-extrabold text-[10px] w-4 h-4"
                    style={{ background: moduleConfig.accent }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Contemos juntos */}
        <button
          onClick={countAlong}
          disabled={counting || selected !== null}
          className="font-bold text-sm px-5 py-2 rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
        >
          🔢 Contemos juntos
        </button>

        {/* Opciones de número */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs sm:max-w-sm">
          {round.options.map((opt, idx) => {
            const isSelected = selected === opt
            const isRight    = opt === round.count
            let borderColor = 'rgba(255,255,255,0.55)'
            let boxShadow   = '0 4px 14px rgba(0,0,0,0.18)'
            if (selected !== null && isRight) {
              borderColor = '#22c55e'; boxShadow = '0 0 0 3px #22c55e, 0 6px 24px #22c55e66'
            } else if (isSelected && !isRight) {
              borderColor = '#ef4444'; boxShadow = '0 0 0 3px #ef4444, 0 6px 24px #ef444466'
            }
            return (
              <button
                key={opt}
                onClick={() => answer(opt)}
                disabled={selected !== null || counting}
                className="aspect-square rounded-3xl flex flex-col items-center justify-center transition-all duration-150 active:scale-90 disabled:cursor-not-allowed"
                style={{
                  background: OPTION_COLORS[idx % OPTION_COLORS.length],
                  border: `4px solid ${borderColor}`,
                  boxShadow,
                  animation: isSelected && !isRight ? 'count-shake 0.45s ease' : undefined,
                }}
              >
                <span className="text-white font-extrabold text-4xl sm:text-5xl drop-shadow">{opt}</span>
                <span className="text-white/90 font-bold text-[11px] sm:text-xs lowercase drop-shadow">{numberWordEn(opt)}</span>
              </button>
            )
          })}
        </div>
      </main>

      <style>{`
        @keyframes count-shake {
          0%,100% { transform: translateX(0) }
          20%     { transform: translateX(-8px) }
          40%     { transform: translateX(8px) }
          60%     { transform: translateX(-5px) }
          80%     { transform: translateX(5px) }
        }
      `}</style>
    </div>
  )
}

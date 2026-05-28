'use client'

import { useState } from 'react'
import type { VocabItem, ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { useSpeak } from '@/components/kids/VoicePresetProvider'

interface Props {
  items: VocabItem[]
  onComplete: (correct: number, total: number, wordResults?: WordResult[]) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

interface LetterData { animal: string; emoji: string; color: string }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp
  }
  return a
}

const LETTER_DATA: Record<string, LetterData> = {
  A: { animal: 'Ant',         emoji: '🐜', color: '#FF6B6B' },
  B: { animal: 'Bee',         emoji: '🐝', color: '#FF8E53' },
  C: { animal: 'Cat',         emoji: '🐈', color: '#FDB347' },
  D: { animal: 'Dog',         emoji: '🦮', color: '#A8E063' },
  E: { animal: 'Elephant',    emoji: '🐘', color: '#4ECDC4' },
  F: { animal: 'Fox',         emoji: '🦊', color: '#45B7D1' },
  G: { animal: 'Giraffe',     emoji: '🦒', color: '#4F86C6' },
  H: { animal: 'Hippo',       emoji: '🦛', color: '#A29BFE' },
  I: { animal: 'Iguana',      emoji: '🦎', color: '#E17055' },
  J: { animal: 'Jellyfish',   emoji: '🪼', color: '#FD79A8' },
  K: { animal: 'Kangaroo',    emoji: '🦘', color: '#E84393' },
  L: { animal: 'Lion',        emoji: '🦁', color: '#F7B731' },
  M: { animal: 'Monkey',      emoji: '🐒', color: '#FF6B6B' },
  N: { animal: 'Nightingale', emoji: '🐦', color: '#6C5CE7' },
  O: { animal: 'Octopus',     emoji: '🐙', color: '#00B894' },
  P: { animal: 'Panda',       emoji: '🐼', color: '#E17055' },
  Q: { animal: 'Quetzal',     emoji: '🦜', color: '#74B9FF' },
  R: { animal: 'Rabbit',      emoji: '🐰', color: '#FF8E53' },
  S: { animal: 'Snake',       emoji: '🐍', color: '#4ECDC4' },
  T: { animal: 'Tiger',       emoji: '🐯', color: '#FDB347' },
  U: { animal: 'Unicorn',     emoji: '🦄', color: '#A29BFE' },
  V: { animal: 'Vulture',     emoji: '🦅', color: '#C44569' },
  W: { animal: 'Wolf',        emoji: '🐺', color: '#45B7D1' },
  X: { animal: 'X-ray Fish',  emoji: '🐠', color: '#56C596' },
  Y: { animal: 'Yak',         emoji: '🐂', color: '#FD79A8' },
  Z: { animal: 'Zebra',       emoji: '🦓', color: '#FF6B6B' },
}

// Vocales — siempre presentes en toda sesión
const VOWELS_CHALLENGE = { letters: ['A','E','I','O','U'] }

// Consonantes: 4 grupos que cubren las 21 consonantes sin solapamiento
const CONSONANT_GROUPS: Array<{ letters: string[] }> = [
  { letters: ['B','C','D','F','G'] },
  { letters: ['H','J','K','L','M'] },
  { letters: ['N','P','Q','R','S'] },
  { letters: ['T','V','W','X','Y','Z'] },
]

// Grupos de variedad extra para sesiones largas
const VARIETY_POOL: Array<{ letters: string[] }> = [
  { letters: ['B','D','F','H','J'] },
  { letters: ['L','M','N','P','R'] },
  { letters: ['C','F','K','S','X'] },
  { letters: ['G','J','N','Q','V'] },
  { letters: ['D','H','L','P','T'] },
  { letters: ['B','E','H','K','N'] },
  { letters: ['A','G','M','S','Y'] },
  { letters: ['C','I','O','U','Z'] },
  { letters: ['F','J','R','V','W'] },
]

export function LetterOrderGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const speakFn = useSpeak()

  const [challenges] = useState(() => {
    const n = Math.max(1, items.length)
    // Consonant groups shuffled (take up to n-1 since vowels occupy 1 slot)
    const consonantsShuffled = shuffle([...CONSONANT_GROUPS, ...VARIETY_POOL])
    const picked = consonantsShuffled.slice(0, Math.max(0, n - 1))
    // Insert vowels at a random position
    const vowelPos = Math.floor(Math.random() * (picked.length + 1))
    picked.splice(vowelPos, 0, VOWELS_CHALLENGE)
    return picked
  })

  const [scrambledMap] = useState<Record<number, string[]>>(() => {
    const map: Record<number, string[]> = {}
    challenges.forEach((ch, i) => { map[i] = shuffle([...ch.letters]) })
    return map
  })


  const [currentQ,  setCurrentQ]  = useState(0)
  const [results,   setResults]   = useState<boolean[]>([])
  const [tapped,    setTapped]    = useState(0)
  const [hadWrong,  setHadWrong]  = useState(false)
  const [wrongIdx,  setWrongIdx]  = useState<number | null>(null)
  const [burst,     setBurst]     = useState(false)

  const challenge = challenges[currentQ]!
  const sorted    = [...challenge.letters].sort()
  const scrambled = scrambledMap[currentQ]!
  const placed    = new Set(sorted.slice(0, tapped))

  function handleTap(tileIdx: number) {
    if (isTerminated || burst || wrongIdx !== null) return
    const letter = scrambled[tileIdx]!
    if (placed.has(letter)) return

    const expected = sorted[tapped]!

    if (letter === expected) {
      speakFn(letter)
      const next = tapped + 1
      setTapped(next)

      if (next === sorted.length) {
        setBurst(true)
        reportCorrect()
        const isCorrect = !hadWrong
        const newResults = [...results, isCorrect]
        setResults(newResults)

        setTimeout(() => {
          if (currentQ < challenges.length - 1) {
            setCurrentQ(q => q + 1)
            setTapped(0)
            setHadWrong(false)
            setBurst(false)
          } else {
            const wordResults = items.slice(0, newResults.length).map((v, i) => ({
              vocabId: v.id, correct: newResults[i] ?? false,
            }))
            onComplete(newResults.filter(Boolean).length, newResults.length, wordResults)
          }
        }, 1100)
      }
    } else {
      setWrongIdx(tileIdx)
      setHadWrong(true)
      reportWrong()
      setTimeout(() => { setWrongIdx(null); setTapped(0) }, 700)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <div className="absolute top-[-15%] right-[-10%] w-[340px] h-[340px] rounded-full opacity-20 blur-[90px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }} />
      <div className="absolute bottom-[-15%] left-[-10%] w-[280px] h-[280px] rounded-full opacity-15 blur-[80px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)` }} />

      <header className="relative z-10 px-4 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: moduleConfig.accent }}>← Volver</button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              Ordena las letras
            </p>
            <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--kids-text)' }}>
              {currentQ + 1}/{challenges.length}
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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-2 sm:px-6 gap-4 sm:gap-6 py-8 sm:py-10">

        <div className="flex flex-col items-center gap-1.5">
          <p className="text-sm sm:text-base font-semibold text-center" style={{ color: 'var(--kids-text-faint)' }}>
            Toca las letras en orden
          </p>
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest"
            style={{ background: `${moduleConfig.accent}18`, color: moduleConfig.accent, border: `1.5px solid ${moduleConfig.accent}44` }}>
            {sorted[0]} {Array(sorted.length - 2).fill('·').join(' ')} {sorted[sorted.length - 1]}
          </span>
        </div>

        {/* Answer slots */}
        <div className="relative flex flex-nowrap gap-2 sm:gap-3 justify-center w-full px-2 py-2">
          {sorted.map((letter, i) => {
            const isPlaced  = i < tapped
            const isCurrent = i === tapped && !burst
            const data      = LETTER_DATA[letter]!

            return (
              <div key={i}
                className="flex flex-col items-center justify-between rounded-2xl transition-all duration-300"
                style={{
                  width:  'clamp(58px, 16.5vw, 92px)',
                  height: 'clamp(70px, 19.5vw, 110px)',
                  background: burst ? 'rgba(34,197,94,0.18)' : isPlaced ? data.color : 'transparent',
                  border: `3px ${isPlaced || burst ? 'solid' : 'dashed'} ${
                    burst     ? '#22c55e' :
                    isPlaced  ? 'rgba(255,255,255,0.5)' :
                    isCurrent ? `${moduleConfig.accent}88` :
                    'var(--kids-border-color)'
                  }`,
                  boxShadow: burst ? '0 0 18px #22c55e55' : isPlaced ? `0 6px 0 ${data.color}bb, 0 10px 24px ${data.color}44` : 'none',
                  padding: isPlaced ? '8px 6px 6px' : '0',
                  gap: '2px',
                  transform: isPlaced && !burst ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                {isPlaced && (
                  <>
                    <span className="font-extrabold text-white leading-none"
                      style={{ fontSize: 'clamp(20px, 5.8vw, 30px)', textShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                      {burst ? '✓' : letter}
                    </span>
                    <span style={{ fontSize: 'clamp(20px, 5.8vw, 30px)', lineHeight: 1 }}>{data.emoji}</span>
                    <span className="font-bold rounded-lg w-full text-center truncate px-1 py-0.5"
                      style={{ fontSize: 'clamp(8px, 2.2vw, 11px)', background: 'rgba(255,255,255,0.85)', color: '#374151' }}>
                      {data.animal}
                    </span>
                  </>
                )}
              </div>
            )
          })}

          {burst && (
            <div className="absolute inset-x-0 flex justify-center pointer-events-none animate-pop-in" style={{ bottom: '-24px' }}>
              <span className="text-3xl" style={{ filter: 'drop-shadow(0 2px 8px rgba(255,200,0,0.7))' }}>⭐</span>
            </div>
          )}
        </div>

        {/* Scrambled tiles */}
        <div className="flex flex-nowrap gap-2 sm:gap-3 justify-center w-full px-2 py-3">
          {scrambled.map((letter, i) => {
            const isPlaced = placed.has(letter)
            const isWrong  = wrongIdx === i
            const data     = LETTER_DATA[letter]!

            return (
              <button key={i} onClick={() => handleTap(i)}
                disabled={isPlaced || burst}
                className="flex flex-col items-center justify-between rounded-2xl transition-all duration-150 active:scale-90 select-none"
                style={{
                  width:  'clamp(58px, 16.5vw, 92px)',
                  height: 'clamp(70px, 19.5vw, 110px)',
                  background: isPlaced ? 'var(--kids-surface)' : data.color,
                  border: `3px solid ${isPlaced ? 'transparent' : isWrong ? '#ef4444' : 'rgba(255,255,255,0.45)'}`,
                  boxShadow: isPlaced ? 'none' : isWrong ? `0 0 0 3px #ef444466` : `0 6px 0 ${data.color}bb, 0 10px 24px ${data.color}44`,
                  opacity:   isPlaced ? 0.18 : 1,
                  cursor:    isPlaced ? 'default' : 'pointer',
                  padding:   isPlaced ? '0' : '8px 6px 6px',
                  gap:       '2px',
                  animation: isWrong ? 'lo-shake 0.45s ease' : undefined,
                  pointerEvents: isPlaced ? 'none' : 'auto',
                }}
              >
                {!isPlaced && (
                  <>
                    <span className="font-extrabold text-white leading-none"
                      style={{ fontSize: 'clamp(20px, 5.8vw, 30px)', textShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                      {letter}
                    </span>
                    <span style={{ fontSize: 'clamp(20px, 5.8vw, 30px)', lineHeight: 1 }}>{data.emoji}</span>
                    <span className="font-bold rounded-lg w-full text-center truncate px-1 py-0.5"
                      style={{ fontSize: 'clamp(8px, 2.2vw, 11px)', background: 'rgba(255,255,255,0.85)', color: '#374151' }}>
                      {data.animal}
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>

        <p className="text-xs sm:text-sm text-center" style={{ color: 'var(--kids-text-faint)', opacity: 0.99 }}>
          {tapped === 0 ? '¿Cuál va primero?' : burst ? '¡Perfecto! 🎉' : `${tapped} de ${sorted.length} colocadas`}
        </p>
      </main>

      <style>{`
        @keyframes lo-shake {
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

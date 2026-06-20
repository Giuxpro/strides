'use client'

import { useState, useEffect, useRef } from 'react'
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

// Señuelos escalan con la longitud de la palabra
function getDecoyCount(wordLen: number): number {
  if (wordLen <= 3) return 2
  if (wordLen <= 5) return 3
  if (wordLen <= 7) return 4
  return 5
}

function generateDecoys(word: string, count: number): string[] {
  const wordSet = new Set(word.toUpperCase().split(''))
  const candidates = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => !wordSet.has(l))
  return shuffle(candidates).slice(0, count)
}

function buildTiles(w: string): string[] {
  const upper = w.toUpperCase()
  const decoyCount = getDecoyCount(upper.length)
  const decoys = generateDecoys(upper, decoyCount)
  return shuffle([...upper.split(''), ...decoys])
}

type SlotState = 'empty' | 'filled' | 'correct' | 'wrong'

const CARD_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B731', '#A29BFE',
  '#FD79A8', '#6C5CE7', '#00B894', '#E17055', '#74B9FF',
]

const SUNBURST = [
  'rgba(255,255,255,0.15) 0deg 22.5deg', 'transparent 22.5deg 45deg',
  'rgba(255,255,255,0.15) 45deg 67.5deg', 'transparent 67.5deg 90deg',
  'rgba(255,255,255,0.15) 90deg 112.5deg', 'transparent 112.5deg 135deg',
  'rgba(255,255,255,0.15) 135deg 157.5deg', 'transparent 157.5deg 180deg',
  'rgba(255,255,255,0.15) 180deg 202.5deg', 'transparent 202.5deg 225deg',
  'rgba(255,255,255,0.15) 225deg 247.5deg', 'transparent 247.5deg 270deg',
  'rgba(255,255,255,0.15) 270deg 292.5deg', 'transparent 292.5deg 315deg',
  'rgba(255,255,255,0.15) 315deg 337.5deg', 'transparent 337.5deg 360deg',
].join(', ')

export function ListeningSpellGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, isTerminated } = useGameEvents()
  const speakFn = useSpeak()
  const [questions] = useState(() => shuffle([...items]))
  const [currentQ, setCurrentQ] = useState(0)
  const [results, setResults] = useState<boolean[]>([])

  const question = questions[currentQ]!
  const word = question.text_en.toUpperCase()

  const [cardColor, setCardColor] = useState(() => CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)]!)
  const [tiles, setTiles] = useState<string[]>(() => buildTiles(word))
  const [slots, setSlots] = useState<(string | null)[]>(() => Array(word.length).fill(null))
  const [slotStates, setSlotStates] = useState<SlotState[]>(() => Array(word.length).fill('empty'))
  const [usedTileIdxs, setUsedTileIdxs] = useState<Set<number>>(new Set())
  const [shaking, setShaking] = useState(false)
  const [burst, setBurst] = useState(false)
  // wrongCount acumula errores POR PREGUNTA — no se resetea al reshuflear los tiles
  const [wrongCount, setWrongCount] = useState(0)
  const [showHint, setShowHint] = useState(false)

  // Ref para leer wrongCount sin closure stale dentro de placeTile
  const wrongCountRef = useRef(wrongCount)
  wrongCountRef.current = wrongCount

  function resetTiles(w: string, resetErrors = false) {
    setTiles(buildTiles(w))
    setSlots(Array(w.length).fill(null))
    setSlotStates(Array(w.length).fill('empty' as SlotState))
    setUsedTileIdxs(new Set())
    setShaking(false)
    setBurst(false)
    setShowHint(false)
    if (resetErrors) setWrongCount(0)
  }

  useEffect(() => {
    if (!question) return
    const w = question.text_en.toUpperCase()
    resetTiles(w, true)
    setCardColor(CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)]!)
    const t = setTimeout(() => speakFn(question.text_en), 400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ])

  function placeTile(tileIdx: number) {
    if (isTerminated || burst) return
    const letter = tiles[tileIdx]
    if (!letter || usedTileIdxs.has(tileIdx)) return

    const nextSlot = slots.findIndex(s => s === null)
    if (nextSlot === -1) return

    const correct = letter === word[nextSlot]
    const newSlots = [...slots]
    newSlots[nextSlot] = letter
    const newUsed = new Set(usedTileIdxs)
    newUsed.add(tileIdx)
    const newStates = [...slotStates] as SlotState[]
    // Feedback inmediato por posición (incluye señuelos → rojo).
    newStates[nextSlot] = correct ? 'correct' : 'wrong'

    setSlots(newSlots)
    setUsedTileIdxs(newUsed)
    setSlotStates(newStates)

    if (!correct) {
      // Cuenta el error (pista cada 3); el niño toca la letra para quitarla.
      const newWrong = wrongCountRef.current + 1
      setWrongCount(newWrong)
      if (newWrong % 3 === 0) setShowHint(true)
      return
    }

    // Completa solo cuando TODAS las letras están en su posición correcta.
    if (newSlots.every((s, i) => s === word[i])) {
      setBurst(true)
      reportCorrect()
      speakFn(question.text_en)
      setSlotStates(newSlots.map(() => 'correct' as SlotState))
      const newResults = [...results, true]
      setResults(newResults)
      setTimeout(() => {
        if (currentQ < questions.length - 1) {
          setCurrentQ(q => q + 1)
        } else {
          const wordResults = questions.map((q, i) => ({
            vocabId: q.id,
            correct: newResults[i] ?? false,
            skillType: 'spelling' as const,
          }))
          onComplete(newResults.filter(Boolean).length, newResults.length, wordResults)
        }
      }, 1800)
    }
  }

  function removeSlot(slotIdx: number) {
    if (isTerminated || burst) return
    if (slots[slotIdx] === null) return

    const letter = slots[slotIdx]!
    const newSlots = [...slots]
    newSlots[slotIdx] = null  // libera el espacio sin compactar (la posición importa)

    const newUsed = new Set(usedTileIdxs)
    for (const idx of Array.from(usedTileIdxs)) {
      if (tiles[idx] === letter) { newUsed.delete(idx); break }
    }

    const newStates = [...slotStates] as SlotState[]
    newStates[slotIdx] = 'empty'
    setSlots(newSlots)
    setSlotStates(newStates)
    setUsedTileIdxs(newUsed)
  }

  const imgUrl = getVocabImageUrl(question)
  const showImage = burst || showHint

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <div
        className="absolute top-[-15%] right-[-15%] w-[380px] h-[380px] rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
      />
      <div
        className="absolute bottom-[-15%] left-[-10%] w-[320px] h-[320px] rounded-full opacity-15 blur-[90px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)` }}
      />

      <header className="relative z-10 px-4 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center justify-between">
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
              Escucha y escribe
            </p>
            <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--kids-text)' }}>
              {currentQ + 1}/{questions.length}
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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 gap-5 sm:gap-8 py-4">

        {/* Tarjeta de audio / imagen */}
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <p className="text-sm sm:text-base font-semibold text-center" style={{ color: 'var(--kids-text-faint)' }}>
            {burst
              ? '¡Correcto! 🎉'
              : showHint
              ? '¡Pista! 👀'
              : 'Escucha la palabra y arma las letras'}
          </p>

          <div className="relative">
            <button
              onClick={() => speakFn(question.text_en)}
              className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-2xl sm:rounded-3xl flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95"
              style={{
                background: cardColor,
                border: `4px solid ${showImage ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)'}`,
                boxShadow: burst
                  ? `0 8px 28px ${cardColor}88, 0 0 0 4px #22c55e`
                  : showHint
                  ? `0 8px 28px ${cardColor}88, 0 0 0 4px ${moduleConfig.accent}`
                  : `0 8px 28px ${cardColor}55`,
              }}
            >
              <div className="absolute inset-0" style={{ background: `conic-gradient(${SUNBURST})` }} />
              {burst && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl"
                  style={{ background: 'rgba(34,197,94,0.18)' }}
                />
              )}

              <div className="relative z-10 flex items-center justify-center">
                {showImage ? (
                  imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgUrl}
                      alt={question.text_en}
                      className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain drop-shadow-lg"
                      style={{
                        animation: burst
                          ? 'ls-reveal 0.5s cubic-bezier(0.34,1.56,0.64,1) both'
                          : 'ls-hint 0.25s ease both',
                      }}
                      draggable={false}
                    />
                  ) : (
                    <span
                      className="text-5xl sm:text-6xl"
                      style={{ animation: 'ls-reveal 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}
                    >
                      🔊
                    </span>
                  )
                ) : (
                  // Estado normal: ícono de escucha
                  <span
                    className="text-5xl sm:text-6xl select-none"
                    style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.25))' }}
                  >
                    🎧
                  </span>
                )}
              </div>
            </button>

            {burst && (
              <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ bottom: '-20px' }}
              >
                <span className="text-3xl" style={{ filter: 'drop-shadow(0 2px 8px rgba(255,200,0,0.7))' }}>⭐</span>
              </div>
            )}
          </div>
        </div>

        {/* Slots de respuesta */}
        <div className={`flex gap-1.5 sm:gap-2 flex-wrap justify-center ${shaking ? 'animate-[lsg-shake_0.45s_ease]' : ''}`}>
          {slots.map((letter, i) => {
            const state = slotStates[i]!
            const isCorrect = state === 'correct'
            const isWrong   = state === 'wrong'
            const isFilled  = state === 'filled'
            return (
              <button
                key={i}
                onClick={() => removeSlot(i)}
                className="w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] md:w-[60px] md:h-[60px] rounded-xl sm:rounded-2xl flex items-center justify-center font-extrabold text-lg sm:text-xl md:text-2xl transition-all duration-150"
                style={{
                  background: isCorrect
                    ? 'rgba(34,197,94,0.18)'
                    : isWrong
                    ? 'rgba(239,68,68,0.18)'
                    : isFilled
                    ? `${moduleConfig.accent}22`
                    : 'transparent',
                  border: `3px ${letter ? 'solid' : 'dashed'} ${
                    isCorrect ? '#22c55e' : isWrong ? '#ef4444' : isFilled ? moduleConfig.accent : 'var(--kids-border-color)'
                  }`,
                  color: isCorrect ? '#22c55e' : isWrong ? '#ef4444' : isFilled ? moduleConfig.accent : 'transparent',
                  transform: isCorrect ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isCorrect
                    ? `0 0 16px ${moduleConfig.accentLight}`
                    : isWrong
                    ? '0 0 12px #ef444466'
                    : 'none',
                }}
              >
                {letter ?? ''}
              </button>
            )
          })}
        </div>

        {/* Banco de tiles (letras correctas + señuelos) */}
        <div className="flex gap-2 sm:gap-3 flex-wrap justify-center" style={{ maxWidth: 440 }}>
          {tiles.map((letter, i) => {
            const used = usedTileIdxs.has(i)
            return (
              <button
                key={i}
                onClick={() => placeTile(i)}
                disabled={used}
                className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] md:w-[64px] md:h-[64px] rounded-xl sm:rounded-2xl font-extrabold text-lg sm:text-xl md:text-2xl transition-all duration-100 active:scale-90 hover:scale-105"
                style={{
                  background: 'var(--kids-surface)',
                  border: `3px solid ${used ? 'transparent' : 'var(--kids-border-color)'}`,
                  color: used ? 'transparent' : 'var(--kids-text)',
                  opacity: used ? 0.22 : 1,
                }}
              >
                {used ? '' : letter}
              </button>
            )
          })}
        </div>
      </main>

      <style>{`
        @keyframes lsg-shake {
          0%,100% { transform: translateX(0) }
          20%     { transform: translateX(-9px) }
          40%     { transform: translateX(9px) }
          60%     { transform: translateX(-6px) }
          80%     { transform: translateX(6px) }
        }
        @keyframes ls-reveal {
          0%   { transform: scale(0.25) rotate(-10deg); opacity: 0 }
          60%  { transform: scale(1.18) rotate(4deg);  opacity: 1 }
          100% { transform: scale(1)   rotate(0deg);   opacity: 1 }
        }
        @keyframes ls-hint {
          0%   { transform: scale(0.6); opacity: 0 }
          100% { transform: scale(1);   opacity: 1 }
        }
      `}</style>
    </div>
  )
}

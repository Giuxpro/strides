'use client'

import { useState, useEffect } from 'react'
import type { VocabItem } from '../LessonEngine'
import type { ModuleConfig, WordResult } from '@strides/core/kids'
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

function getOptions(items: VocabItem[], correctId: string, count: number): VocabItem[] {
  const available   = Math.min(count, items.length)
  const distractors = shuffle(items.filter(v => v.id !== correctId)).slice(0, available - 1)
  return shuffle([...distractors, items.find(v => v.id === correctId)!])
}

const LEV_DELAYS = ['0s', '0.4s', '0.8s', '1.2s', '0.2s', '0.6s', '1.0s', '1.4s']

const OPTION_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B731',
  '#A29BFE', '#FD79A8', '#6C5CE7', '#00B894',
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

export function RecognitionExercise({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const speakFn   = useSpeak()
  const [questions] = useState(() => shuffle([...items]))
  const [currentQ,  setCurrentQ]  = useState(0)
  const [options,   setOptions]   = useState<VocabItem[]>([])
  const [selected,  setSelected]  = useState<string | null>(null)
  const [results,   setResults]   = useState<boolean[]>([])
  const [speaking,  setSpeaking]  = useState(false)

  const question    = questions[currentQ]
  const optionCount = Math.min(4, items.length)

  function speak(text: string, slow = false) {
    setSpeaking(true)
    speakFn(text, { slow })
    setTimeout(() => setSpeaking(false), slow ? 2200 : 1000)
  }

  useEffect(() => {
    if (!question) return
    setOptions(getOptions(items, question.id, optionCount))
    const t = setTimeout(() => speak(question.text_en), 350)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ])

  function handleAnswer(option: VocabItem) {
    if (selected !== null || !question || isTerminated) return

    const isCorrect = option.id === question.id
    if (isCorrect) reportCorrect(); else reportWrong()
    setResults(prev => [...prev, isCorrect])
    setSelected(option.id)
    speak(question.text_en)

    setTimeout(() => {
      setSelected(null)
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1)
      } else {
        const newResults = [...results, isCorrect]
        const wordResults = questions.map((q, i) => ({ vocabId: q.id, correct: newResults[i] ?? false }))
        onComplete(newResults.filter(Boolean).length, newResults.length, wordResults)
      }
    }, 950)
  }

  if (!question || options.length === 0) return null

  const colClass = 'grid-cols-2'

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
              Reconocimiento
            </p>
            <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--kids-text)' }}>
              {currentQ + 1}/{questions.length}
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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-5 gap-5 sm:gap-7 py-4">

        {/* Question block */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm sm:text-base font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
            ¿Cuál de estas imágenes corresponde?
          </p>

          <div className="flex items-center gap-3">
            {/* Main speak button */}
            <button
              onClick={() => speak(question.text_en)}
              className="relative flex flex-col items-center justify-center gap-2 rounded-3xl transition-all active:scale-95 hover:scale-105 w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] md:w-[160px] md:h-[160px]"
              style={{
                background: moduleConfig.gradient,
                boxShadow: speaking
                  ? `0 0 0 6px ${moduleConfig.gradientFrom}55, ${moduleConfig.shadow}`
                  : moduleConfig.shadow,
                border: '4px solid rgba(255,255,255,0.6)',
                transition: 'box-shadow 0.2s',
              }}
            >
              <div className="absolute inset-0 rounded-3xl" style={{ background: `conic-gradient(${SUNBURST})` }} />
              <span className="relative text-3xl sm:text-4xl" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }}>
                {speaking ? '🔊' : '🔉'}
              </span>
              {/* La palabra aparece solo tras responder — el niño primero usa el oído */}
              {selected !== null && (
                <span className="relative text-white font-extrabold text-sm sm:text-base leading-tight capitalize drop-shadow">
                  {question.text_en}
                </span>
              )}
            </button>

            {/* Slow button */}
            <button
              onClick={() => speak(question.text_en, true)}
              title="Más lento"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all hover:scale-110 active:scale-95"
              style={{ background: moduleConfig.accentLight, border: `2px solid ${moduleConfig.accent}33` }}
            >
              <span className="text-2xl sm:text-3xl leading-none">🐢</span>
              <span className="text-[9px] sm:text-[10px] font-bold" style={{ color: moduleConfig.accent }}>lento</span>
            </button>
          </div>
        </div>

        {/* Options grid — max-w-xs en móvil da cards de ~154px (2 cols), cómodas para tap */}
        <div className={`grid ${colClass} gap-3 w-full max-w-xs sm:max-w-sm`}>
          {options.map((option, idx) => {
            const isSelected = selected === option.id
            const isCorrect  = option.id === question.id
            const imgUrl     = getVocabImageUrl(option)
            const color      = OPTION_COLORS[idx % OPTION_COLORS.length]!

            let borderColor = 'rgba(255,255,255,0.55)'
            let boxShadow   = '0 4px 14px rgba(0,0,0,0.18)'
            let wrongOverlay: React.ReactNode = null
            const showStar = isSelected && isCorrect

            if (isSelected) {
              if (isCorrect) {
                borderColor = '#22c55e'
                boxShadow   = `0 0 0 3px #22c55e, 0 6px 24px #22c55e66`
              } else {
                borderColor = '#ef4444'
                boxShadow   = `0 0 0 3px #ef4444, 0 6px 24px #ef444466`
                wrongOverlay = (
                  <div className="absolute inset-0 rounded-3xl flex items-center justify-center z-20"
                    style={{ background: 'rgba(239,68,68,0.25)' }}>
                    <span className="text-4xl">✗</span>
                  </div>
                )
              }
            }

            return (
              <div key={option.id} className="relative aspect-square">
                <button
                  onClick={() => handleAnswer(option)}
                  disabled={selected !== null}
                  className="w-full h-full rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-150 active:scale-90"
                  style={{
                    background: color,
                    border: `4px solid ${borderColor}`,
                    boxShadow,
                    animation: isSelected && !isCorrect ? 'recog-shake 0.45s ease' : undefined,
                    transform: showStar ? 'scale(1.06)' : 'scale(1)',
                  }}
                >
                  <div className="absolute inset-0" style={{ background: `conic-gradient(${SUNBURST})` }} />

                  <div className="relative z-10 flex flex-col items-center gap-1.5 p-2">
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl}
                        alt={option.text_en}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-lg animate-levitate"
                        draggable={false}
                        style={{ animationDelay: LEV_DELAYS[idx % LEV_DELAYS.length] }}
                      />
                    ) : (
                      <span className="text-4xl font-extrabold text-white drop-shadow">
                        {option.text_en[0]?.toUpperCase()}
                      </span>
                    )}
                    <div className="rounded-full px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.88)' }}>
                      <span className="text-gray-700 font-bold text-[10px] sm:text-[11px] leading-tight capitalize">
                        {option.text_en}
                      </span>
                    </div>
                  </div>

                  {wrongOverlay}
                </button>

                {showStar && (
                  <div
                    className="absolute inset-x-0 flex justify-center animate-pop-in pointer-events-none z-30"
                    style={{ bottom: '-18px' }}
                  >
                    <span className="text-2xl" style={{ filter: 'drop-shadow(0 2px 8px rgba(255,200,0,0.7))' }}>⭐</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      <style>{`
        @keyframes recog-shake {
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

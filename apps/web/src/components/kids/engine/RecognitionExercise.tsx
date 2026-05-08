'use client'

import { useState, useEffect } from 'react'
import type { VocabItem } from './LessonEngine'
import type { ModuleConfig } from '@/components/kids/moduleConfig'
import { useGameEvents } from './modifiers/ModifierContext'
import { SPEECH_RATE_NORMAL, SPEECH_RATE_SLOW } from './speechRates'
import type { WordResult } from './modifiers/types'

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
    const temp = a[i] as T
    a[i] = a[j] as T
    a[j] = temp
  }
  return a
}

function getOptions(items: VocabItem[], correctId: string, count: number): VocabItem[] {
  const available = Math.min(count, items.length)
  const distractors = shuffle(items.filter(v => v.id !== correctId)).slice(0, available - 1)
  const correct = items.find(v => v.id === correctId)!
  return shuffle([...distractors, correct])
}

export function RecognitionExercise({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated, modifierState } = useGameEvents()
  const [questions] = useState(() => shuffle([...items]))
  const [currentQ, setCurrentQ] = useState(0)
  const [options, setOptions] = useState<VocabItem[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [results, setResults] = useState<boolean[]>([])

  const question = questions[currentQ]
  const optionCount = Math.min(modifierState.optionCount, items.length)

  function speakWord(text: string, slow = false) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-US'
    utt.rate = slow ? SPEECH_RATE_SLOW : SPEECH_RATE_NORMAL
    window.speechSynthesis.speak(utt)
  }

  useEffect(() => {
    if (!question) return
    setOptions(getOptions(items, question.id, optionCount))
    const timer = setTimeout(() => speakWord(question.text_en), 350)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ])

  function handleAnswer(option: VocabItem) {
    if (selected !== null || !question || isTerminated) return

    const isCorrect = option.id === question.id
    if (isCorrect) reportCorrect()
    else reportWrong()
    const newResults = [...results, isCorrect]
    setResults(newResults)
    setSelected(option.id)

    setTimeout(() => {
      setSelected(null)
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1)
      } else {
        const wordResults = questions.map((q, i) => ({ vocabId: q.id, correct: newResults[i] ?? false }))
        onComplete(newResults.filter(Boolean).length, newResults.length, wordResults)
      }
    }, 900)
  }

  if (!question || options.length === 0) return null

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)` }}
      />

      {/* Header */}
      <header className="relative z-10 px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: moduleConfig.accent }}
          >
            ← Volver
          </button>
          <p className="text-sm" style={{ color: 'var(--kids-text-muted)' }}>
            <span className="font-bold" style={{ color: 'var(--kids-text)' }}>{currentQ + 1}</span>
            /{questions.length}
          </p>
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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* Question */}
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--kids-text-muted)' }}>
            ¿Cuál es esta palabra?
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => speakWord(question.text_en, false)}
              className="w-28 h-28 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
              style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
            >
              <span className="text-4xl">🔊</span>
              <span className="text-white font-extrabold text-sm">{question.text_en}</span>
            </button>

            <button
              onClick={() => speakWord(question.text_en, true)}
              title="Reproducir más lento"
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95"
              style={{ background: moduleConfig.accentLight }}
            >
              🐢
            </button>
          </div>
        </div>

        {/* Options */}
        <div className={`grid gap-3 w-full ${optionCount <= 4 ? 'grid-cols-2 max-w-xs' : 'grid-cols-4 max-w-sm'}`}>
          {options.map(option => {
            const isSelected = selected === option.id
            const isCorrect  = option.id === question.id

            let bg     = 'var(--kids-surface)'
            let border = '2px solid var(--kids-border-color)'

            if (isSelected) {
              bg     = isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'
              border = `2px solid ${isCorrect ? '#22c55e' : '#ef4444'}`
            }

            return (
              <button
                key={option.id}
                onClick={() => handleAnswer(option)}
                disabled={selected !== null}
                className="rounded-2xl p-3 flex flex-col items-center justify-center gap-2 transition-all duration-150 active:scale-95 hover:scale-[1.03]"
                style={{ background: bg, border, minHeight: 110 }}
              >
                {option.image_url ? (
                  <img
                    src={option.image_url}
                    alt={option.text_es}
                    className="w-14 h-14 object-contain"
                    draggable={false}
                  />
                ) : (
                  <span className="text-3xl select-none">{option.text_es[0]?.toUpperCase()}</span>
                )}
                <span
                  className="font-bold text-xs text-center leading-tight"
                  style={{ color: 'var(--kids-text)' }}
                >
                  {option.text_es}
                </span>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}

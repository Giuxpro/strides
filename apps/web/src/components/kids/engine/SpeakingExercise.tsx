'use client'

import { useState, useEffect, useRef } from 'react'
import type { VocabItem } from './LessonEngine'
import type { ModuleConfig } from '@/components/kids/moduleConfig'
import { useGameEvents } from './modifiers/ModifierContext'

interface Props {
  items: VocabItem[]
  onComplete: (correct: number, total: number) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

type MicState = 'idle' | 'listening' | 'correct' | 'wrong' | 'unsupported'

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = a[i] as T; a[i] = a[j] as T; a[j] = temp
  }
  return a
}

export function SpeakingExercise({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const [questions] = useState(() => shuffle([...items]))
  const [currentQ, setCurrentQ] = useState(0)
  const [micState, setMicState] = useState<MicState>('idle')
  const [heard, setHeard] = useState<string | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null)

  const question = questions[currentQ]

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setMicState('unsupported')
    }
  }, [])

  function startListening() {
    if (micState === 'listening' || !question || isTerminated) return

    const SpeechRecognitionAPI =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) return

    const rec = new SpeechRecognitionAPI()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 3
    recognitionRef.current = rec

    setMicState('listening')
    setHeard(null)

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results[0] ?? [])
        .map((alt: SpeechRecognitionAlternative) => alt.transcript)
        .find(t => normalize(t) === normalize(question.text_en)) ?? (event.results[0]?.[0]?.transcript ?? '')

      const isCorrect = normalize(transcript) === normalize(question.text_en)
      if (isCorrect) reportCorrect()
      else reportWrong()
      setHeard(transcript)
      setMicState(isCorrect ? 'correct' : 'wrong')

      const newResults = [...results, isCorrect]
      setResults(newResults)

      setTimeout(() => {
        setMicState('idle')
        setHeard(null)
        if (currentQ < questions.length - 1) {
          setCurrentQ(prev => prev + 1)
        } else {
          onComplete(newResults.filter(Boolean).length, newResults.length)
        }
      }, 1500)
    }

    rec.onerror = () => {
      setMicState('idle')
    }

    rec.onend = () => {
      if (micState === 'listening') setMicState('idle')
    }

    rec.start()
  }

  function skipItem() {
    recognitionRef.current?.abort()
    const newResults = [...results, false]
    setResults(newResults)
    setMicState('idle')
    setHeard(null)
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1)
    } else {
      onComplete(newResults.filter(Boolean).length, newResults.length)
    }
  }

  if (!question) return null

  const micEmoji = micState === 'listening' ? '🔴' : '🎤'
  const feedbackEmoji = micState === 'correct' ? '✅' : micState === 'wrong' ? '❌' : null

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

        {micState === 'unsupported' ? (
          <div className="text-center max-w-xs">
            <p className="text-4xl mb-3">😔</p>
            <p className="font-extrabold text-lg mb-1" style={{ color: 'var(--kids-text)' }}>
              Tu navegador no soporta el micrófono
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--kids-text-muted)' }}>
              Prueba con Chrome en escritorio o Android
            </p>
            <button
              onClick={onBack}
              className="font-bold px-6 py-3 rounded-2xl"
              style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
            >
              Volver
            </button>
          </div>
        ) : (
          <>
            {/* Imagen + palabra en español */}
            <div className="text-center">
              <p className="text-sm mb-3" style={{ color: 'var(--kids-text-muted)' }}>
                Di esta palabra en inglés
              </p>
              <div
                className="w-36 h-36 rounded-3xl flex items-center justify-center mx-auto mb-3"
                style={{ background: moduleConfig.accentLight }}
              >
                {question.image_url ? (
                  <img
                    src={question.image_url}
                    alt={question.text_es}
                    className="w-28 h-28 object-contain"
                    draggable={false}
                  />
                ) : (
                  <span className="text-5xl">{question.text_es[0]?.toUpperCase()}</span>
                )}
              </div>
              <p className="font-extrabold text-xl" style={{ color: 'var(--kids-text)' }}>
                {question.text_es}
              </p>
            </div>

            {/* Botón micrófono */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={startListening}
                disabled={micState === 'listening' || micState === 'correct' || micState === 'wrong'}
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                style={{
                  background: micState === 'listening'
                    ? '#ef4444'
                    : moduleConfig.gradient,
                  boxShadow: micState === 'listening'
                    ? '0 0 0 8px rgba(239,68,68,0.25)'
                    : moduleConfig.shadow,
                }}
              >
                {micEmoji}
              </button>

              <p className="text-sm font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
                {micState === 'listening' ? 'Escuchando…' : '¡Toca para hablar!'}
              </p>

              {feedbackEmoji && (
                <div className="text-center animate-slide-up">
                  <p className="text-3xl">{feedbackEmoji}</p>
                  {heard && (
                    <p className="text-sm mt-1" style={{ color: 'var(--kids-text-muted)' }}>
                      Dijiste: <span className="font-bold" style={{ color: 'var(--kids-text)' }}>{heard}</span>
                    </p>
                  )}
                  {micState === 'wrong' && (
                    <p className="text-sm font-semibold mt-0.5" style={{ color: moduleConfig.accent }}>
                      Era: {question.text_en}
                    </p>
                  )}
                </div>
              )}
            </div>

            {micState === 'idle' && (
              <button
                onClick={skipItem}
                className="text-xs font-semibold"
                style={{ color: 'var(--kids-text-muted)' }}
              >
                Saltar →
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}

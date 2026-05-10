'use client'

import { useState, useEffect, useRef } from 'react'
import type { VocabItem } from '../LessonEngine'
import type { ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'

interface Props {
  items: VocabItem[]
  onComplete: (correct: number, total: number, wordResults?: WordResult[]) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

type MicState = 'idle' | 'listening' | 'listening-retry' | 'correct' | 'wrong' | 'unsupported' | 'no-speech'

interface SpeechAlt { transcript: string }
interface SpeechResult extends ArrayLike<SpeechAlt> { isFinal: boolean }
interface SpeechEvent { results: ArrayLike<SpeechResult> }
interface RecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: SpeechEvent) => void) | null
  onnomatch: ((e: SpeechEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type RecognitionCtor = new () => RecognitionInstance

function getSpeechRecognition(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

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
  const [debugMsg, setDebugMsg] = useState<string>('—')
  const recognitionRef = useRef<RecognitionInstance | null>(null)
  const sessionRef = useRef(0)

  const question = questions[currentQ]

  useEffect(() => {
    if (!getSpeechRecognition()) setMicState('unsupported')
    return () => { try { recognitionRef.current?.abort() } catch { /* ignore */ } }
  }, [])

  function startListening() {
    if (micState === 'listening' || micState === 'listening-retry' || !question || isTerminated) return
    const RecognitionCtor = getSpeechRecognition()
    if (!RecognitionCtor) return

    // Incrementar sesión ANTES de abortar la anterior para que sus callbacks async fallen el check
    const session = ++sessionRef.current
    try { recognitionRef.current?.abort() } catch { /* ignore */ }
    recognitionRef.current = null

    setMicState('listening')
    setHeard(null)
    setDebugMsg('iniciando…')

    let gotResult = false

    function isSpeechMatch(transcript: string, expected: string): boolean {
      const h = normalize(transcript)
      const target = normalize(expected)
      if (h === target) return true
      return h.split(/\s+/).includes(target)
    }

    function advance(isCorrect: boolean) {
      const newResults = [...results, isCorrect]
      setResults(newResults)
      const cap = session
      setTimeout(() => {
        if (cap !== sessionRef.current) return
        setMicState('idle')
        setHeard(null)
        if (currentQ < questions.length - 1) {
          setCurrentQ(prev => prev + 1)
        } else {
          const wordResults = questions.map((q, i) => ({ vocabId: q.id, correct: newResults[i] ?? false }))
          onComplete(newResults.filter(Boolean).length, newResults.length, wordResults)
        }
      }, isCorrect ? 1200 : 1600)
    }

    // attempt: crea y arranca una instancia de reconocimiento.
    // Si Chrome dispara onerror→"aborted" antes de capturar audio (bug conocido de Chrome),
    // se reintenta automáticamente hasta MAX_RETRIES veces.
    function attempt(retryCount: number) {
      if (session !== sessionRef.current) return

      const rec = new RecognitionCtor()
      rec.lang = 'en-US'
      rec.continuous = false
      rec.interimResults = false
      rec.maxAlternatives = 3
      recognitionRef.current = rec

      if (retryCount > 0) {
        setMicState('listening-retry')
        setDebugMsg(`reintento ${retryCount}/2…`)
      }

      const safetyTimer = setTimeout(() => {
        if (session !== sessionRef.current) return
        setDebugMsg('⏱ timeout')
        try { recognitionRef.current?.abort() } catch { /* ignore */ }
        setMicState('idle')
      }, 7000)

      // thisAttemptHandled: evita que onend reactive estado después de que onerror
      // ya programó un retry o ya gestionó el resultado.
      let thisAttemptHandled = false

      rec.onresult = (event: SpeechEvent) => {
        if (session !== sessionRef.current) return
        gotResult = true
        thisAttemptHandled = true
        clearTimeout(safetyTimer)

        const result = event.results[0]
        if (!result) { setDebugMsg('results[0] vacío'); return }

        let transcript = result[0]?.transcript ?? ''
        for (let j = 1; j < result.length; j++) {
          const alt = result[j]?.transcript ?? ''
          if (normalize(alt) === normalize(question.text_en)) { transcript = alt; break }
        }

        const isCorrect = isSpeechMatch(transcript, question.text_en)
        setDebugMsg(`"${transcript}" | correcto: ${isCorrect}`)
        if (isCorrect) reportCorrect(); else reportWrong()
        setHeard(transcript)
        setMicState(isCorrect ? 'correct' : 'wrong')
        advance(isCorrect)
      }

      rec.onnomatch = () => {
        if (session !== sessionRef.current) return
        gotResult = true
        thisAttemptHandled = true
        clearTimeout(safetyTimer)
        setDebugMsg('onnomatch (sin confianza)')
        reportWrong()
        setMicState('wrong')
        advance(false)
      }

      rec.onerror = (e: { error: string }) => {
        if (session !== sessionRef.current) return
        clearTimeout(safetyTimer)
        setDebugMsg(`onerror "${e.error}" (intento ${retryCount + 1})`)

        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          thisAttemptHandled = true
          setMicState('unsupported')
        } else if (e.error === 'no-speech') {
          thisAttemptHandled = true
          setMicState('no-speech')
          setTimeout(() => { if (session !== sessionRef.current) return; setMicState('idle') }, 1400)
        } else if (e.error === 'aborted' && !gotResult && retryCount < 2) {
          // Chrome abortó antes de capturar audio → retry automático
          recognitionRef.current = null
          // thisAttemptHandled permanece false → onend lo ignora; el retry lo maneja todo
          setTimeout(() => attempt(retryCount + 1), 300)
        } else {
          thisAttemptHandled = true
          setMicState('idle')
        }
      }

      rec.onend = () => {
        if (session !== sessionRef.current) return
        clearTimeout(safetyTimer)
        recognitionRef.current = null
        if (!thisAttemptHandled) {
          // Terminó sin que ningún handler lo haya gestionado (ej. abort + retry pendiente o sin voz)
          setDebugMsg(prev => `onend sin handler (prev: ${prev})`)
          setMicState('no-speech')
          setTimeout(() => { if (session !== sessionRef.current) return; setMicState('idle') }, 1400)
        } else {
          setDebugMsg(prev => `onend OK (prev: ${prev})`)
        }
      }

      // Chrome a veces aborta SpeechRecognition si el hardware del micrófono no fue
      // inicializado previamente por la Media API. getUserMedia lo "prende" y lo libera
      // de inmediato para que rec.start() encuentre el dispositivo listo.
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(t => t.stop())
          if (session !== sessionRef.current) return
          try {
            rec.start()
          } catch (err) {
            clearTimeout(safetyTimer)
            setDebugMsg(`start() excepción: ${String(err)}`)
            setMicState('idle')
          }
        })
        .catch(() => {
          clearTimeout(safetyTimer)
          setDebugMsg('getUserMedia denegado')
          setMicState('unsupported')
        })
    }

    attempt(0)
  }

  function skipItem() {
    try { recognitionRef.current?.abort() } catch { /* ignore */ }
    sessionRef.current++
    const newResults = [...results, false]
    setResults(newResults)
    setMicState('idle')
    setHeard(null)
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1)
    } else {
      const wordResults = questions.map((q, i) => ({ vocabId: q.id, correct: newResults[i] ?? false }))
      onComplete(newResults.filter(Boolean).length, newResults.length, wordResults)
    }
  }

  if (!question) return null

  const isListening = micState === 'listening' || micState === 'listening-retry'
  const feedbackEmoji = micState === 'correct' ? '✅' : micState === 'wrong' ? '❌' : null

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)` }}
      />

      <header className="relative z-10 px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
            ← Volver
          </button>
          <p className="text-sm" style={{ color: 'var(--kids-text-muted)' }}>
            <span className="font-bold" style={{ color: 'var(--kids-text)' }}>{currentQ + 1}</span>/{questions.length}
          </p>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: progress.total }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{ background: i < progress.current ? moduleConfig.accent : 'var(--kids-border-color)' }} />
          ))}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {micState === 'unsupported' ? (
          <div className="text-center max-w-xs">
            <p className="text-4xl mb-3">😔</p>
            <p className="font-extrabold text-lg mb-1" style={{ color: 'var(--kids-text)' }}>Tu navegador no soporta el micrófono</p>
            <p className="text-sm mb-6" style={{ color: 'var(--kids-text-muted)' }}>Prueba con Chrome en escritorio o Android</p>
            <button onClick={onBack} className="font-bold px-6 py-3 rounded-2xl"
              style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}>Volver</button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-sm mb-3" style={{ color: 'var(--kids-text-muted)' }}>Say it in English!</p>
              <div className="w-36 h-36 rounded-3xl flex items-center justify-center mx-auto mb-3"
                style={{ background: moduleConfig.accentLight }}>
                {question.image_url
                  ? <img src={question.image_url} alt={question.text_en} className="w-28 h-28 object-contain" draggable={false} />
                  : <span className="text-5xl">{question.text_en[0]?.toUpperCase()}</span>}
              </div>
              <p className="font-extrabold text-2xl" style={{ color: 'var(--kids-text)' }}>{question.text_en}</p>
              <p className="text-sm mt-1 opacity-50" style={{ color: 'var(--kids-text)' }}>{question.text_es}</p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={startListening}
                disabled={micState !== 'idle'}
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                style={{
                  background: isListening ? '#ef4444' : moduleConfig.gradient,
                  boxShadow: isListening ? '0 0 0 8px rgba(239,68,68,0.25)' : moduleConfig.shadow,
                }}
              >
                {isListening ? '🔴' : '🎤'}
              </button>

              <p className="text-sm font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
                {micState === 'listening-retry' ? 'Reintentando…' : isListening ? 'Escuchando…' : '¡Toca para hablar!'}
              </p>

              {feedbackEmoji && (
                <div className="text-center">
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
              <button onClick={skipItem} className="text-xs font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
                Saltar →
              </button>
            )}

            {micState === 'no-speech' && (
              <p className="text-sm font-bold text-center">
                No te escuché bien. Intenta otra vez 🎤
              </p>
            )}

            {/* Panel debug temporal */}
            <div className="w-full max-w-sm rounded-xl p-3 text-xs font-mono break-all"
              style={{ background: 'rgba(0,0,0,0.4)', color: '#a3e635', height: '150px' }}>
              <p className="opacity-50 mb-1">DEBUG (temporal) · {typeof window !== 'undefined' ? window.location.protocol : '?'}</p>
              <p>{debugMsg}</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

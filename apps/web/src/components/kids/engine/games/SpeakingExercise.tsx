'use client'

import { useState, useEffect, useRef } from 'react'
import type { VocabItem } from '../LessonEngine'
import type { ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { useSpeechProvider } from '../SpeechConfigContext'

interface Props {
  items: VocabItem[]
  onComplete: (correct: number, total: number, wordResults?: WordResult[]) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

type MicState =
  | 'idle'
  | 'listening'
  | 'listening-retry'
  | 'recording'
  | 'processing'
  | 'correct'
  | 'wrong'
  | 'unsupported'
  | 'no-speech'

interface SpeechAlt { transcript: string }
interface SpeechResult extends ArrayLike<SpeechAlt> { isFinal: boolean }
interface SpeechEvent { results: ArrayLike<SpeechResult> }
interface RecognitionInstance {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number
  onresult: ((e: SpeechEvent) => void) | null
  onnomatch: ((e: SpeechEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void; stop(): void; abort(): void
}
type RecognitionCtor = new () => RecognitionInstance

function getSpeechRecognition(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function normalize(t: string) { return t.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '') }
function isSpeechMatch(transcript: string, expected: string) {
  const h = normalize(transcript), target = normalize(expected)
  return h === target || h.split(/\s+/).includes(target)
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T]
  }
  return a
}

// ── 3-D flip card ─────────────────────────────────────────────────────────────

function WordCard({
  imageUrl, wordEn, wordEs, flipped, isCorrect, heard, moduleConfig,
}: {
  imageUrl?: string | null
  wordEn: string
  wordEs: string
  flipped: boolean
  isCorrect: boolean
  heard: string | null
  moduleConfig: ModuleConfig
}) {
  return (
    <>
      <style>{`
        @keyframes stamp {
          0%   { transform: scale(0.2) rotate(-15deg); opacity: 0; }
          65%  { transform: scale(1.25) rotate(4deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
        }
        @keyframes rise {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .stamp-anim { animation: stamp 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .rise-anim  { animation: rise  0.35s ease forwards; }
      `}</style>

      {/* Perspectiva 3D */}
      <div style={{ perspective: '900px' }} className="w-52 h-60">
        <div style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
          position: 'relative', width: '100%', height: '100%',
        }}>

          {/* ── Frente ── */}
          <div style={{
            backfaceVisibility: 'hidden',
            position: 'absolute', inset: 0,
            background: moduleConfig.accentLight,
            borderRadius: '1.75rem',
            boxShadow: `0 8px 0 ${moduleConfig.accent}55, 0 12px 32px rgba(0,0,0,0.14)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', padding: '1rem',
          }}>
            {imageUrl
              ? <img src={imageUrl} alt={wordEn} style={{ width: 100, height: 100, objectFit: 'contain' }} draggable={false} />
              : <span style={{ fontSize: '4rem', lineHeight: 1 }}>{wordEn[0]?.toUpperCase()}</span>}
            <p style={{
              fontWeight: 900, fontSize: '1.25rem', color: moduleConfig.accent,
              letterSpacing: '-0.01em', textAlign: 'center', lineHeight: 1.1,
            }}>{wordEn}</p>
            <p style={{ fontSize: '0.75rem', color: moduleConfig.accent, opacity: 0.55, fontWeight: 600 }}>{wordEs}</p>
          </div>

          {/* ── Reverso ── */}
          <div style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute', inset: 0,
            borderRadius: '1.75rem',
            boxShadow: isCorrect
              ? `0 8px 0 rgba(0,0,0,0.18), 0 12px 32px rgba(0,0,0,0.16)`
              : `0 8px 0 rgba(0,0,0,0.18), 0 12px 32px rgba(0,0,0,0.16)`,
            background: isCorrect
              ? `linear-gradient(145deg, ${moduleConfig.gradientFrom}, ${moduleConfig.gradientTo})`
              : 'linear-gradient(145deg, #ff6b6b, #ee4444)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.6rem', padding: '1rem', overflow: 'hidden',
          }}>
            {/* Brillo decorativo */}
            <div style={{
              position: 'absolute', top: '-30%', right: '-20%',
              width: '70%', height: '70%', borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)', filter: 'blur(20px)', pointerEvents: 'none',
            }} />

            {/* Emoji con animación stamp */}
            {flipped && (
              <span className="stamp-anim" style={{ fontSize: '3rem', lineHeight: 1, display: 'block' }}>
                {isCorrect ? '🏆' : '💪'}
              </span>
            )}

            {/* Título */}
            {flipped && (
              <p className="rise-anim" style={{
                fontWeight: 900, fontSize: '1.1rem', color: '#fff',
                textShadow: '0 2px 0 rgba(0,0,0,0.15)', animationDelay: '0.1s', opacity: 0,
              }}>
                {isCorrect ? '¡Perfecto!' : '¡Casi!'}
              </p>
            )}

            {/* Dijiste / Era */}
            {flipped && (
              <div className="rise-anim" style={{
                background: 'rgba(255,255,255,0.22)', borderRadius: '1rem',
                padding: '0.4rem 0.9rem', textAlign: 'center',
                animationDelay: '0.2s', opacity: 0,
              }}>
                {heard && (
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Dijiste
                  </p>
                )}
                {heard && (
                  <p style={{ fontWeight: 900, fontSize: '1rem', color: '#fff' }}>{heard}</p>
                )}
                {!isCorrect && (
                  <>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: heard ? '0.35rem' : 0 }}>
                      Era
                    </p>
                    <p style={{ fontWeight: 900, fontSize: '1rem', color: '#fff' }}>{wordEn}</p>
                  </>
                )}
              </div>
            )}

            {/* Estrellas en correcto */}
            {flipped && isCorrect && (
              <p className="rise-anim" style={{ fontSize: '1.1rem', animationDelay: '0.3s', opacity: 0 }}>
                ⭐⭐⭐
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Botón de mic con anillo pulsante ──────────────────────────────────────────

function MicButton({ isActive, isProcessing, disabled, onClick, moduleConfig }: {
  isActive: boolean
  isProcessing: boolean
  disabled: boolean
  onClick: () => void
  moduleConfig: ModuleConfig
}) {
  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.5; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        .pulse-ring { animation: pulse-ring 1.1s ease-out infinite; }
      `}</style>

      <div style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Anillo pulsante */}
        {isActive && (
          <div className="pulse-ring" style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: isProcessing ? moduleConfig.accent : '#ef4444',
            pointerEvents: 'none',
          }} />
        )}

        <button
          onClick={onClick}
          disabled={disabled}
          style={{
            width: 88, height: 88, borderRadius: '50%',
            background: isActive
              ? (isProcessing ? moduleConfig.gradient : '#ef4444')
              : moduleConfig.gradient,
            boxShadow: isActive
              ? '0 6px 0 rgba(0,0,0,0.2)'
              : `0 6px 0 ${moduleConfig.accent}88, ${moduleConfig.shadow}`,
            border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.1s, background 0.25s',
            transform: 'translateY(0)',
            opacity: disabled ? 0.6 : 1,
          }}
          onMouseDown={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(3px)' }}
          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
        >
          {isProcessing ? '⏳' : isActive ? '🔴' : '🎤'}
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export function SpeakingExercise({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const speechProvider = useSpeechProvider()
  const [questions] = useState(() => shuffle([...items]))
  const [currentQ, setCurrentQ] = useState(0)
  const [micState, setMicState] = useState<MicState>('idle')
  const [heard, setHeard] = useState<string | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const recognitionRef = useRef<RecognitionInstance | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const sessionRef = useRef(0)

  const question = questions[currentQ]

  useEffect(() => {
    if (speechProvider === 'web-speech' && !getSpeechRecognition()) setMicState('unsupported')
    return () => {
      try { recognitionRef.current?.abort() } catch { /* ignore */ }
      try { mediaRecorderRef.current?.stop() } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function advanceWith(newResults: boolean[], isCorrect: boolean, sessionGuard?: number) {
    setResults(newResults)
    setTimeout(() => {
      if (sessionGuard !== undefined && sessionGuard !== sessionRef.current) return
      setMicState('idle')
      setHeard(null)
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1)
      } else {
        const wordResults = questions.map((q, i) => ({ vocabId: q.id, correct: newResults[i] ?? false }))
        onComplete(newResults.filter(Boolean).length, newResults.length, wordResults)
      }
    }, isCorrect ? 2200 : 2800)
  }

  // ── Whisper ───────────────────────────────────────────────────────────────
  async function startListeningWhisper() {
    if (micState !== 'idle' || !question || isTerminated) return
    setMicState('recording')
    setHeard(null)

    let stream: MediaStream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) }
    catch { setMicState('unsupported'); return }

    const chunks: Blob[] = []
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      setMicState('processing')
      const blob = new Blob(chunks, { type: recorder.mimeType })
      const ext = recorder.mimeType.includes('ogg') ? 'audio.ogg' : 'audio.webm'
      const file = new File([blob], ext, { type: blob.type })
      const body = new FormData()
      body.append('audio', file)
      body.append('expected', question.text_en)
      try {
        const res = await fetch('/api/speech/evaluate', { method: 'POST', body })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { transcript: string; correct: boolean }
        setHeard(data.transcript)
        if (data.correct) reportCorrect(); else reportWrong()
        setMicState(data.correct ? 'correct' : 'wrong')
        advanceWith([...results, data.correct], data.correct)
      } catch { setMicState('idle') }
    }
    recorder.start()
    setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    }, 3000)
  }

  // ── Web Speech ────────────────────────────────────────────────────────────
  function startListening() {
    if (micState === 'listening' || micState === 'listening-retry' || !question || isTerminated) return
    const RecognitionCtor = getSpeechRecognition()
    if (!RecognitionCtor) return
    const currentQuestion = question
    const session = ++sessionRef.current
    try { recognitionRef.current?.abort() } catch { /* ignore */ }
    recognitionRef.current = null
    setMicState('listening')
    setHeard(null)
    let gotResult = false

    function attempt(retryCount: number) {
      if (session !== sessionRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const rec = new RecognitionCtor!()
      rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 3
      recognitionRef.current = rec
      if (retryCount > 0) setMicState('listening-retry')

      const safetyTimer = setTimeout(() => {
        if (session !== sessionRef.current) return
        try { recognitionRef.current?.abort() } catch { /* ignore */ }
        setMicState('idle')
      }, 7000)
      let handled = false

      rec.onresult = (event: SpeechEvent) => {
        if (session !== sessionRef.current) return
        gotResult = true; handled = true; clearTimeout(safetyTimer)
        const result = event.results[0]
        if (!result) return
        let transcript = result[0]?.transcript ?? ''
        for (let j = 1; j < result.length; j++) {
          const alt = result[j]?.transcript ?? ''
          if (normalize(alt) === normalize(currentQuestion.text_en)) { transcript = alt; break }
        }
        const isCorrect = isSpeechMatch(transcript, currentQuestion.text_en)
        if (isCorrect) reportCorrect(); else reportWrong()
        setHeard(transcript)
        setMicState(isCorrect ? 'correct' : 'wrong')
        advanceWith([...results, isCorrect], isCorrect, session)
      }
      rec.onnomatch = () => {
        if (session !== sessionRef.current) return
        gotResult = true; handled = true; clearTimeout(safetyTimer)
        reportWrong(); setMicState('wrong')
        advanceWith([...results, false], false, session)
      }
      rec.onerror = (e: { error: string }) => {
        if (session !== sessionRef.current) return
        clearTimeout(safetyTimer)
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          handled = true; setMicState('unsupported')
        } else if (e.error === 'no-speech') {
          handled = true; setMicState('no-speech')
          setTimeout(() => { if (session !== sessionRef.current) return; setMicState('idle') }, 1400)
        } else if (e.error === 'aborted' && !gotResult && retryCount < 2) {
          // Chrome abortó antes de capturar → retry automático
          recognitionRef.current = null
          setTimeout(() => attempt(retryCount + 1), 300)
        } else { handled = true; setMicState('idle') }
      }
      rec.onend = () => {
        if (session !== sessionRef.current) return
        clearTimeout(safetyTimer); recognitionRef.current = null
        if (!handled) {
          setMicState('no-speech')
          setTimeout(() => { if (session !== sessionRef.current) return; setMicState('idle') }, 1400)
        }
      }
      // Chrome warm-up fix
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(t => t.stop())
          if (session !== sessionRef.current) return
          try { rec.start() } catch { clearTimeout(safetyTimer); setMicState('idle') }
        })
        .catch(() => { clearTimeout(safetyTimer); setMicState('unsupported') })
    }
    attempt(0)
  }

  function skipItem() {
    try { recognitionRef.current?.abort() } catch { /* ignore */ }
    try { mediaRecorderRef.current?.stop() } catch { /* ignore */ }
    sessionRef.current++
    const newResults = [...results, false]
    setResults(newResults); setMicState('idle'); setHeard(null)
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1)
    } else {
      const wordResults = questions.map((q, i) => ({ vocabId: q.id, correct: newResults[i] ?? false }))
      onComplete(newResults.filter(Boolean).length, newResults.length, wordResults)
    }
  }

  if (!question) return null

  const isListening  = micState === 'listening' || micState === 'listening-retry'
  const isRecording  = micState === 'recording'
  const isProcessing = micState === 'processing'
  const isActive     = isListening || isRecording || isProcessing
  const isFlipped    = micState === 'correct' || micState === 'wrong'

  function handleMicPress() {
    if (speechProvider === 'whisper') void startListeningWhisper()
    else startListening()
  }

  function micLabel() {
    if (micState === 'listening-retry') return 'Reintentando…'
    if (isListening)  return 'Escuchando…'
    if (isRecording)  return 'Grabando…'
    if (isProcessing) return 'Procesando…'
    if (isFlipped)    return ''
    return '¡Toca para hablar!'
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Fondo decorativo */}
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: 400, height: 400, borderRadius: '50%', opacity: 0.15,
        background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)`,
        filter: 'blur(100px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '-10%', right: '-10%',
        width: 300, height: 300, borderRadius: '50%', opacity: 0.1,
        background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)`,
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      {/* Header */}
      <header className="relative z-10 px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: moduleConfig.accent }}>
            ← Volver
          </button>
          <p className="text-sm" style={{ color: 'var(--kids-text-muted)' }}>
            <span className="font-bold" style={{ color: 'var(--kids-text)' }}>{currentQ + 1}</span>/{questions.length}
          </p>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: progress.total }).map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300" style={{
              width: i === currentQ ? 10 : 7, height: i === currentQ ? 10 : 7,
              background: results[i] !== undefined ? moduleConfig.accent : i === currentQ ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
              boxShadow: i === currentQ ? `0 0 0 2px ${moduleConfig.accent}` : 'none',
            }} />
          ))}
        </div>
      </header>

      {micState === 'unsupported' ? (
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <p className="text-5xl">😔</p>
          <p className="font-extrabold text-lg" style={{ color: 'var(--kids-text)' }}>Tu navegador no soporta el micrófono</p>
          <p className="text-sm" style={{ color: 'var(--kids-text-muted)' }}>Prueba con Chrome en escritorio o Android</p>
          <button onClick={onBack} className="font-bold px-6 py-3 rounded-2xl mt-2"
            style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}>Volver</button>
        </main>
      ) : (
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-5">

          {/* Instrucción */}
          <p className="text-sm font-semibold tracking-wide uppercase"
            style={{ color: 'var(--kids-text-muted)', letterSpacing: '0.08em' }}>
            Say it in English!
          </p>

          {/* Tarjeta con flip */}
          <WordCard
            imageUrl={question.image_url}
            wordEn={question.text_en}
            wordEs={question.text_es}
            flipped={isFlipped}
            isCorrect={micState === 'correct'}
            heard={heard}
            moduleConfig={moduleConfig}
          />

          {/* Micro */}
          <MicButton
            isActive={isActive}
            isProcessing={isProcessing}
            disabled={isActive || isFlipped}
            onClick={handleMicPress}
            moduleConfig={moduleConfig}
          />

          {/* Estado / label */}
          {micLabel() && (
            <p className="text-sm font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
              {micLabel()}
            </p>
          )}

          {micState === 'no-speech' && (
            <p className="text-sm font-bold" style={{ color: 'var(--kids-text-muted)' }}>
              No te escuché. Intenta otra vez 🎤
            </p>
          )}

          {micState === 'idle' && (
            <button onClick={skipItem} className="text-xs font-semibold mt-1"
              style={{ color: 'var(--kids-text-muted)', opacity: 0.6 }}>
              Saltar →
            </button>
          )}
        </main>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import type { VocabItem } from '../LessonEngine'
import type { ModuleConfig, WordResult } from '@strides/core/kids'
import { getVocabImageUrl } from '@strides/core/kids'
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
  | 'retry'
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

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = i
    for (let j = 1; j <= b.length; j++) {
      const curr = a[i - 1] === b[j - 1]
        ? dp[j - 1]!
        : 1 + Math.min(dp[j]!, dp[j - 1]!, prev)
      dp[j - 1] = prev
      prev = curr
    }
    dp[b.length] = prev
  }
  return dp[b.length]!
}

function isSpeechMatch(transcript: string, expected: string): boolean {
  const heard = normalize(transcript)
  const target = normalize(expected)
  if (!heard) return false
  if (heard === target) return true
  for (const word of heard.split(/\s+/)) {
    if (word === target) return true
    if (target.length >= 6 && levenshtein(word, target) <= 1) return true
  }
  return false
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T]
  }
  return a
}

const PAIR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B731', '#A29BFE',
  '#FD79A8', '#6C5CE7', '#00B894', '#E17055', '#74B9FF',
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

// ── Tarjeta con flip 3D ───────────────────────────────────────────────────────

function WordCard({
  imageUrl, wordEn, wordEs, flipped, isCorrect, heard, cardColor,
}: {
  imageUrl?: string | null
  wordEn: string
  wordEs: string
  flipped: boolean
  isCorrect: boolean
  heard: string | null
  cardColor: string
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

      {/* w-48 h-56 en móvil (192×224px), w-52 h-60 en sm+ (208×240px) */}
      <div style={{ perspective: '900px' }} className="w-48 h-56 sm:w-52 sm:h-60">
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
            background: cardColor,
            borderRadius: '1.75rem',
            border: '4px solid rgba(255,255,255,0.65)',
            boxShadow: `0 8px 28px ${cardColor}88`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', padding: '1rem', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: `conic-gradient(${SUNBURST})`,
              borderRadius: '1.75rem',
            }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              {imageUrl
                ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={wordEn}
                    className="animate-levitate"
                    style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
                    draggable={false}
                  />
                )
                : <span className="animate-levitate" style={{ fontSize: '4rem', lineHeight: 1 }}>{wordEn[0]?.toUpperCase()}</span>
              }
              <div style={{
                background: 'rgba(255,255,255,0.88)', borderRadius: '999px',
                padding: '0.2rem 0.75rem',
              }}>
                <p style={{ fontWeight: 900, fontSize: '0.95rem', color: '#374151', letterSpacing: '-0.01em' }}>{wordEn}</p>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{wordEs}</p>
            </div>
          </div>

          {/* ── Reverso ── */}
          <div style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute', inset: 0,
            borderRadius: '1.75rem',
            border: '4px solid rgba(255,255,255,0.5)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            background: isCorrect
              ? 'linear-gradient(145deg, #22c55e, #16a34a)'
              : 'linear-gradient(145deg, #ff6b6b, #dc2626)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.6rem', padding: '1rem', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-30%', right: '-20%',
              width: '70%', height: '70%', borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)', filter: 'blur(20px)', pointerEvents: 'none',
            }} />

            {flipped && (
              <span className="stamp-anim" style={{ fontSize: '3.5rem', lineHeight: 1, display: 'block' }}>
                {isCorrect ? '🏆' : '💪'}
              </span>
            )}
            {flipped && (
              <p className="rise-anim" style={{
                fontWeight: 900, fontSize: '1.2rem', color: '#fff',
                textShadow: '0 2px 0 rgba(0,0,0,0.18)', animationDelay: '0.1s', opacity: 0,
              }}>
                {isCorrect ? '¡Perfecto!' : '¡Casi!'}
              </p>
            )}
            {flipped && (
              <div className="rise-anim" style={{
                background: 'rgba(255,255,255,0.22)', borderRadius: '1rem',
                padding: '0.35rem 0.8rem', textAlign: 'center',
                animationDelay: '0.2s', opacity: 0,
              }}>
                {heard && (
                  <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Dijiste
                  </p>
                )}
                {heard && (
                  <p style={{ fontWeight: 900, fontSize: '0.95rem', color: '#fff' }}>{heard}</p>
                )}
                {!isCorrect && (
                  <>
                    <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: heard ? '0.3rem' : 0 }}>
                      Era
                    </p>
                    <p style={{ fontWeight: 900, fontSize: '0.95rem', color: '#fff' }}>{wordEn}</p>
                  </>
                )}
              </div>
            )}
            {flipped && isCorrect && (
              <p className="rise-anim" style={{ fontSize: '1.3rem', animationDelay: '0.3s', opacity: 0 }}>
                ⭐⭐⭐
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Botón de micrófono ────────────────────────────────────────────────────────

function MicButton({ isActive, isProcessing, disabled, onClick, color }: {
  isActive: boolean
  isProcessing: boolean
  disabled: boolean
  onClick: () => void
  color: string
}) {
  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.55; }
          100% { transform: scale(1.7);  opacity: 0; }
        }
        .pulse-ring { animation: pulse-ring 1.1s ease-out infinite; }
      `}</style>

      {/* 80px en móvil, 90px en sm+ — ambos son buenos touch targets */}
      <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
           className="sm:!w-[90px] sm:!h-[90px]">
        {isActive && (
          <div className="pulse-ring" style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: isProcessing ? color : '#ef4444',
            pointerEvents: 'none',
          }} />
        )}
        <button
          onClick={onClick}
          disabled={disabled}
          style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: isActive
              ? (isProcessing ? color : '#ef4444')
              : color,
            boxShadow: isActive
              ? '0 6px 0 rgba(0,0,0,0.2)'
              : `0 6px 0 rgba(0,0,0,0.18), 0 12px 28px ${color}66`,
            border: '4px solid rgba(255,255,255,0.65)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '2.2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
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
  const [heardList, setHeardList] = useState<(string | null)[]>([])
  const [cardColor, setCardColor] = useState(() => PAIR_COLORS[Math.floor(Math.random() * PAIR_COLORS.length)]!)
  const recognitionRef    = useRef<RecognitionInstance | null>(null)
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null)
  const recordingStartRef = useRef<number>(0)
  const sessionRef        = useRef(0)
  const lowConfListRef    = useRef<(boolean | undefined)[]>([])
  const attemptRef        = useRef(0)
  const audioCtxRef       = useRef<AudioContext | null>(null)
  const vadIntervalRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const resetTimeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxTimeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const volumeBarRef      = useRef<HTMLDivElement | null>(null)

  const question = questions[currentQ]

  useEffect(() => {
    if (speechProvider === 'web-speech' && !getSpeechRecognition()) setMicState('unsupported')
    return () => {
      try { recognitionRef.current?.abort() } catch { /* ignore */ }
      try { mediaRecorderRef.current?.stop() } catch { /* ignore */ }
      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current)
      if (maxTimeoutRef.current)  clearTimeout(maxTimeoutRef.current)
      audioCtxRef.current?.close().catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setCardColor(PAIR_COLORS[Math.floor(Math.random() * PAIR_COLORS.length)]!)
    attemptRef.current = 0
  }, [currentQ])

  function advanceWith(newResults: boolean[], isCorrect: boolean, heardTranscript: string | null, sessionGuard?: number) {
    const newHeardList = [...heardList, heardTranscript]
    setResults(newResults)
    setHeardList(newHeardList)
    setTimeout(() => {
      if (sessionGuard !== undefined && sessionGuard !== sessionRef.current) return
      setMicState('idle')
      setHeard(null)
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1)
      } else {
        const wordResults = questions.map((q, i) => ({
          vocabId: q.id,
          correct: newResults[i] ?? false,
          skillType: 'pronunciation' as const,
          heard: newHeardList[i] ?? undefined,
          expected: q.text_en,
          lowConfidence: lowConfListRef.current[i],
        }))
        onComplete(newResults.filter(Boolean).length, newResults.length, wordResults)
      }
    }, isCorrect ? 2200 : 2800)
  }

  function handleSpeechResult(
    isCorrect: boolean,
    transcript: string | null,
    lowConf: boolean,
    session?: number,
  ) {
    if (isCorrect) {
      reportCorrect()
      setHeard(transcript)
      setMicState('correct')
      lowConfListRef.current = [...lowConfListRef.current, lowConf]
      advanceWith([...results, true], true, transcript, session)
    } else if (attemptRef.current === 0) {
      attemptRef.current = 1
      setMicState('retry')
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = setTimeout(() => {
        resetTimeoutRef.current = null
        if (session !== undefined && session !== sessionRef.current) return
        setMicState('idle')
      }, 1600)
    } else {
      reportWrong()
      setHeard(transcript)
      setMicState('wrong')
      lowConfListRef.current = [...lowConfListRef.current, lowConf]
      advanceWith([...results, false], false, transcript, session)
    }
  }

  // ── Whisper + VAD (RMS) ───────────────────────────────────────────────────
  async function startListeningWhisper() {
    if ((micState !== 'idle' && micState !== 'no-speech' && micState !== 'retry') || !question || isTerminated) return

    const whisperSession = ++sessionRef.current
    setMicState('recording')
    setHeard(null)

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
    } catch { setMicState('unsupported'); return }

    const capturedQuestion = question
    const chunks: Blob[] = []

    // ── VAD state ──────────────────────────────────────────────────────────
    // RMS sobre datos de tiempo (getByteTimeDomainData) — técnica más fiable
    // que el promedio de frecuencias para detectar silencio.
    const SPEECH_RMS_THRESHOLD = 0.012  // ~1.2% de amplitud máxima
    const SILENCE_AFTER_SPEECH = 380    // ms de silencio tras hablar → cortar
    const NO_SPEECH_MAX        = 3500   // ms sin detectar habla → abortar
    const MIN_RECORD_AFTER_SPEECH = 250 // ms mínimos grabados tras detectar habla
    const HARD_MAX             = 6000   // ms absoluto máximo

    let speechDetected = false
    let speechEndedAt  = 0
    let vadWorking     = false

    function stopVAD() {
      if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null }
      audioCtxRef.current?.close().catch(() => {}); audioCtxRef.current = null
      if (volumeBarRef.current) volumeBarRef.current.style.width = '0%'
    }

    function stopRecording() {
      if (maxTimeoutRef.current) { clearTimeout(maxTimeoutRef.current); maxTimeoutRef.current = null }
      stopVAD()
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    }

    try {
      const AudioCtxCtor = (
        window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      )
      if (AudioCtxCtor) {
        const audioCtx   = new AudioCtxCtor()
        audioCtxRef.current = audioCtx
        const analyser   = audioCtx.createAnalyser()
        analyser.fftSize = 256
        audioCtx.createMediaStreamSource(stream).connect(analyser)
        const timeData   = new Uint8Array(analyser.fftSize)
        vadWorking       = true
        const startTs    = Date.now()

        vadIntervalRef.current = setInterval(() => {
          if (mediaRecorderRef.current?.state !== 'recording') { stopVAD(); return }

          // Calcular RMS
          analyser.getByteTimeDomainData(timeData)
          let sum = 0
          for (const s of timeData) { const n = (s - 128) / 128; sum += n * n }
          const rms = Math.sqrt(sum / timeData.length)

          // Actualizar barra de volumen sin causar re-render de React
          if (volumeBarRef.current) {
            volumeBarRef.current.style.width = `${Math.min(100, rms * 6000)}%`
          }

          const elapsed = Date.now() - startTs

          if (rms > SPEECH_RMS_THRESHOLD) {
            speechDetected = true
            speechEndedAt  = 0
          } else if (speechDetected) {
            if (speechEndedAt === 0) speechEndedAt = Date.now()
            const silenceDuration = Date.now() - speechEndedAt
            const recordedAfterSpeech = elapsed - (speechEndedAt - startTs)
            if (silenceDuration > SILENCE_AFTER_SPEECH && recordedAfterSpeech > MIN_RECORD_AFTER_SPEECH) {
              stopRecording()
            }
          } else if (elapsed > NO_SPEECH_MAX) {
            // Usuario no habló en 3.5s
            stopRecording()
          }
        }, 50)
      }
    } catch { /* AudioContext no disponible — usa el hard max */ }

    // Hard max absoluto
    maxTimeoutRef.current = setTimeout(stopRecording, HARD_MAX)

    recordingStartRef.current = Date.now()
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

    recorder.onstop = async () => {
      stopVAD()
      stream.getTracks().forEach(t => t.stop())

      // VAD activo pero sin habla detectada → no-speech
      if (vadWorking && !speechDetected) {
        setMicState('no-speech')
        resetTimeoutRef.current = setTimeout(() => {
          resetTimeoutRef.current = null
          if (sessionRef.current === whisperSession) setMicState('idle')
        }, 1400)
        return
      }

      const durationMs = Date.now() - recordingStartRef.current
      setMicState('processing')

      const blob = new Blob(chunks, { type: recorder.mimeType })
      const ext  = recorder.mimeType.includes('ogg') ? 'audio.ogg' : 'audio.webm'
      const file = new File([blob], ext, { type: blob.type })
      const body = new FormData()
      body.append('audio', file)
      body.append('expected', capturedQuestion.text_en)
      body.append('duration_ms', String(durationMs))

      try {
        const res  = await fetch('/api/speech/evaluate', { method: 'POST', body })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json() as { transcript: string; correct: boolean; noSpeech: boolean; lowConfidence: boolean }
        if (data.noSpeech) {
          setMicState('no-speech')
          resetTimeoutRef.current = setTimeout(() => {
            resetTimeoutRef.current = null
            if (sessionRef.current === whisperSession) setMicState('idle')
          }, 1400)
          return
        }
        handleSpeechResult(data.correct, data.transcript, data.lowConfidence, whisperSession)
      } catch {
        if (sessionRef.current === whisperSession) setMicState('idle')
      }
    }

    recorder.start()
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
        handleSpeechResult(isCorrect, transcript, false, session)
      }
      rec.onnomatch = () => {
        if (session !== sessionRef.current) return
        gotResult = true; handled = true; clearTimeout(safetyTimer)
        handleSpeechResult(false, null, false, session)
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
    const newResults   = [...results, false]
    const newHeardList = [...heardList, null]
    lowConfListRef.current = [...lowConfListRef.current, undefined]
    setResults(newResults); setHeardList(newHeardList); setMicState('idle'); setHeard(null)
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1)
    } else {
      const wordResults = questions.map((q, i) => ({
        vocabId: q.id,
        correct: newResults[i] ?? false,
        heard: newHeardList[i] ?? undefined,
        expected: q.text_en,
        lowConfidence: lowConfListRef.current[i],
      }))
      onComplete(newResults.filter(Boolean).length, newResults.length, wordResults)
    }
  }

  if (!question) return null

  const isListening  = micState === 'listening' || micState === 'listening-retry'
  const isRecording  = micState === 'recording'
  const isProcessing = micState === 'processing'
  const isActive     = isListening || isRecording || isProcessing
  const isFlipped    = micState === 'correct' || micState === 'wrong'
  const isRetry      = micState === 'retry'

  function handleMicPress() {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
    if (speechProvider === 'whisper') void startListeningWhisper()
    else startListening()
  }

  function micLabel() {
    if (micState === 'listening-retry') return 'Reintentando…'
    if (isListening)  return 'Escuchando…'
    if (isRecording)  return 'Grabando…'
    if (isProcessing) return 'Procesando…'
    if (isFlipped || isRetry) return ''
    return '¡Toca para hablar!'
  }

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
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: moduleConfig.accent }}>
            ← Volver
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              Pronunciación
            </p>
            <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--kids-text)' }}>
              {currentQ + 1}/{questions.length}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 items-center">
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
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-8 text-center gap-4">
          <p className="text-5xl">😔</p>
          <p className="font-extrabold text-base sm:text-lg" style={{ color: 'var(--kids-text)' }}>Tu navegador no soporta el micrófono</p>
          <p className="text-sm" style={{ color: 'var(--kids-text-muted)' }}>Prueba con Chrome en escritorio o Android</p>
          <button onClick={onBack} className="font-bold px-5 sm:px-6 py-3 rounded-2xl mt-2"
            style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}>Volver</button>
        </main>
      ) : (
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 gap-4 sm:gap-6 py-4">

          <p className="text-sm sm:text-base font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
            ¡Di la palabra en inglés!
          </p>

          {/* WordCard escalada — el scale extra en md/lg da más presencia en pantallas grandes */}
          <div className="scale-100 md:scale-125 lg:scale-150 origin-center mt-0 md:mt-8 lg:mt-16 mb-0 md:mb-8 lg:mb-16">
            <WordCard
              imageUrl={getVocabImageUrl(question)}
              wordEn={question.text_en}
              wordEs={question.text_es}
              flipped={isFlipped}
              isCorrect={micState === 'correct'}
              heard={heard}
              cardColor={cardColor}
            />
          </div>

          {/* MicButton fuera del scale para que el layout sea correcto */}
          <MicButton
            isActive={isActive}
            isProcessing={isProcessing}
            disabled={isActive || isFlipped || isRetry}
            onClick={handleMicPress}
            color={cardColor}
          />

          {/* Barra de volumen — se actualiza via DOM ref sin re-render */}
          <div className="w-40 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.1)' }}>
            <div
              ref={volumeBarRef}
              className="h-full rounded-full"
              style={{ width: '0%', background: cardColor, transition: 'width 40ms linear' }}
            />
          </div>

          {micLabel() && (
            <p className="text-sm sm:text-base font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
              {micLabel()}
            </p>
          )}

          {isRetry && (
            <p className="text-sm sm:text-base font-bold animate-pulse" style={{ color: '#F59E0B' }}>
              ¡Casi! Try again. 🎤
            </p>
          )}

          {micState === 'no-speech' && (
            <p className="text-sm font-bold" style={{ color: 'var(--kids-text-muted)' }}>
              No te escuché. ¡Intenta otra vez! 🎤
            </p>
          )}

          {micState === 'idle' && (
            <button onClick={skipItem} className="text-xs font-semibold mt-4 sm:mt-6"
              style={{ color: 'var(--kids-text-muted)', opacity: 0.55 }}>
              Saltar →
            </button>
          )}
        </main>
      )}
    </div>
  )
}

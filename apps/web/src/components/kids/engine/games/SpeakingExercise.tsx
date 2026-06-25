'use client'

import { useState, useEffect, useRef } from 'react'
import type { VocabItem } from '../LessonEngine'
import type { ModuleConfig, WordResult } from '@strides/core/kids'
import { getVocabImageUrl } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import { useSpeechAttempt } from '../speech/useSpeechAttempt'
import { playSuccessSound } from '@/components/kids/ui/AnimatedStar'

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
  const speak = useSpeak()
  const [questions] = useState(() => shuffle([...items]))
  const [currentQ, setCurrentQ] = useState(0)
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null)
  const [retry, setRetry] = useState(false)
  const [heard, setHeard] = useState<string | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [heardList, setHeardList] = useState<(string | null)[]>([])
  const [cardColor, setCardColor] = useState(() => PAIR_COLORS[Math.floor(Math.random() * PAIR_COLORS.length)]!)
  const lowConfListRef  = useRef<(boolean | undefined)[]>([])
  const attemptRef      = useRef(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const question = questions[currentQ]

  // Toda la lógica de micrófono/Whisper/Web-Speech vive en el hook compartido.
  const { state, start, volumeRef } = useSpeechAttempt({
    onResult: ({ correct, heard: transcript, lowConfidence }) => handleSpeechResult(correct, transcript, lowConfidence),
  })

  useEffect(() => {
    setCardColor(PAIR_COLORS[Math.floor(Math.random() * PAIR_COLORS.length)]!)
    attemptRef.current = 0
    setRetry(false)
    setResult(null)
    setHeard(null)
  }, [currentQ])

  useEffect(() => () => { if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current) }, [])

  function advanceWith(newResults: boolean[], isCorrect: boolean, heardTranscript: string | null) {
    const newHeardList = [...heardList, heardTranscript]
    setResults(newResults)
    setHeardList(newHeardList)
    setTimeout(() => {
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
    }, isCorrect ? 2600 : 2800)
  }

  function handleSpeechResult(isCorrect: boolean, transcript: string | null, lowConf: boolean) {
    if (isCorrect) {
      reportCorrect()
      setHeard(transcript)
      setResult('correct')
      playSuccessSound()
      const word = question?.text_en
      if (word) setTimeout(() => speak(word), 700)
      lowConfListRef.current = [...lowConfListRef.current, lowConf]
      advanceWith([...results, true], true, transcript)
    } else if (attemptRef.current === 0) {
      // Primer fallo: otra oportunidad (pudo ser ruido).
      attemptRef.current = 1
      setRetry(true)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = setTimeout(() => { retryTimeoutRef.current = null; setRetry(false) }, 1600)
    } else {
      reportWrong()
      setHeard(transcript)
      setResult('wrong')
      lowConfListRef.current = [...lowConfListRef.current, lowConf]
      advanceWith([...results, false], false, transcript)
    }
  }

  function skipItem() {
    const newResults   = [...results, false]
    const newHeardList = [...heardList, null]
    lowConfListRef.current = [...lowConfListRef.current, undefined]
    setResults(newResults); setHeardList(newHeardList); setResult(null); setHeard(null); setRetry(false)
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

  const isProcessing = state === 'processing'
  const isActive     = state === 'listening' || state === 'recording' || isProcessing
  const isFlipped    = result !== null
  const unsupported  = state === 'unsupported'

  function handleMicPress() {
    if (isTerminated || !question) return
    setRetry(false)
    start(question.text_en)
  }

  function micLabel() {
    if (state === 'listening')  return 'Escuchando…'
    if (state === 'recording')  return 'Grabando…'
    if (isProcessing)           return 'Procesando…'
    if (isFlipped || retry)     return ''
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

      {unsupported ? (
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
              isCorrect={result === 'correct'}
              heard={heard}
              cardColor={cardColor}
            />
          </div>

          {/* MicButton fuera del scale para que el layout sea correcto */}
          <MicButton
            isActive={isActive}
            isProcessing={isProcessing}
            disabled={isActive || isFlipped || retry}
            onClick={handleMicPress}
            color={cardColor}
          />

          {/* Barra de volumen — se actualiza via DOM ref sin re-render */}
          <div className="w-40 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.1)' }}>
            <div
              ref={volumeRef}
              className="h-full rounded-full"
              style={{ width: '0%', background: cardColor, transition: 'width 40ms linear' }}
            />
          </div>

          {micLabel() && (
            <p className="text-sm sm:text-base font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
              {micLabel()}
            </p>
          )}

          {retry && (
            <p className="text-sm sm:text-base font-bold animate-pulse" style={{ color: '#F59E0B' }}>
              ¡Casi! Try again. 🎤
            </p>
          )}

          {state === 'no-speech' && (
            <p className="text-sm font-bold" style={{ color: 'var(--kids-text-muted)' }}>
              No te escuché. ¡Intenta otra vez! 🎤
            </p>
          )}

          {state === 'idle' && !isFlipped && !retry && (
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

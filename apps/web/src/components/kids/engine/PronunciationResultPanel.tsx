'use client'

import { useState, useRef, useEffect } from 'react'
import type { WordResult, ModuleConfig } from '@strides/core/kids'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import type { VocabItem } from './LessonEngine'

function getPronunciationTip(word: string): string {
  const w = word.toLowerCase()
  if (/th/.test(w))     return 'Lengua entre los dientes para "th"'
  if (w.includes('wh')) return '"W" suave redondeando los labios'
  if (w.includes('sh')) return 'Labios hacia adelante, como "shhh"'
  if (w.includes('oo')) return 'Boca bien redonda para esta vocal'
  if (/e$/.test(w))     return '"E" final muda — alarga la vocal anterior'
  if (w.includes('v'))  return '"V": dientes superiores en el labio inferior'
  if (w.includes('w'))  return '"W": redondea labios antes del sonido'
  if (w.includes('r'))  return '"R" inglesa: lengua curvada sin tocar el paladar'
  return 'Pronúncialo despacio, sílaba a sílaba'
}

function ScoreCircle({ percent }: { percent: number }) {
  const r    = 46
  const circ = 2 * Math.PI * r
  const dash = (percent / 100) * circ
  const color = percent >= 70 ? '#86efac' : percent >= 40 ? '#fde68a' : '#fca5a5'
  return (
    <svg width={112} height={112} viewBox="0 0 112 112">
      <circle cx={56} cy={56} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={9} />
      <circle
        cx={56} cy={56} r={r} fill="none" stroke={color} strokeWidth={9}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 56 56)"
        style={{ filter: `drop-shadow(0 0 10px ${color}99)` }}
      />
      <text x={56} y={47} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize={23} fontWeight={900}>{percent}%</text>
      <text x={56} y={68} textAnchor="middle" dominantBaseline="central"
        fill="rgba(255,255,255,0.55)" fontSize={8} fontWeight={700} letterSpacing={0.5}>
        PRONUNCIACIÓN
      </text>
    </svg>
  )
}

function SpeakerButton({ word, audioUrl }: { word: string; audioUrl?: string | null }) {
  const [playing, setPlaying] = useState(false)
  const speak = useSpeak()

  function play() {
    if (playing) return
    setPlaying(true)
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.onended = () => setPlaying(false)
      audio.onerror = () => { setPlaying(false); tts() }
      audio.play().catch(() => { setPlaying(false); tts() })
    } else { tts() }
  }

  function tts() {
    speak(word, { onEnd: () => setPlaying(false) })
  }

  return (
    <button
      onClick={play} disabled={playing}
      aria-label={`Escuchar: ${word}`}
      className="flex-shrink-0 transition-all active:scale-90 hover:scale-110"
      style={{
        width: 32, height: 32, borderRadius: '50%',
        background: playing ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)',
        border: '1.5px solid rgba(255,255,255,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.9rem', cursor: playing ? 'default' : 'pointer',
        animation: playing ? 'speaker-pulse 0.9s ease-in-out infinite' : 'none',
      }}
    >
      {playing ? '🔊' : '🔈'}
    </button>
  )
}

interface Props {
  wordResults: WordResult[]
  vocabMap: Record<string, VocabItem>
  moduleConfig: ModuleConfig
}

export function PronunciationResultPanel({ wordResults, vocabMap, moduleConfig }: Props) {
  const speakingResults = wordResults.filter(r => r.expected !== undefined)
  if (speakingResults.length === 0) return null

  const wrongWords  = speakingResults.filter(r => !r.correct)
  const percent     = Math.round((speakingResults.filter(r => r.correct).length / speakingResults.length) * 100)

  const scrollRef   = useRef<HTMLDivElement>(null)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => setShowHint(el.scrollHeight > el.clientHeight + el.scrollTop + 10)
    const timer = setTimeout(check, 80)
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => { clearTimeout(timer); el.removeEventListener('scroll', check); ro.disconnect() }
  }, [])

  return (
    <>
      <style>{`
        @keyframes speaker-pulse {
          0%,100% { box-shadow:0 0 0 2px rgba(255,255,255,0.2); }
          50%      { box-shadow:0 0 0 7px rgba(255,255,255,0.06); }
        }
        @keyframes card-rise {
          from { opacity:0; transform:translateY(12px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
        @keyframes bounce-down {
          0%,100% { transform:translateY(0); opacity:0.7; }
          50%     { transform:translateY(5px); opacity:1; }
        }
        .pron-card   { animation:card-rise 0.38s cubic-bezier(0.34,1.1,0.64,1) both; }
        .scroll-hint { animation:bounce-down 1.1s ease-in-out infinite; }
        .pron-scroll::-webkit-scrollbar { display:none; }
      `}</style>

      <div
        className="rounded-3xl flex flex-col"
        style={{
          background: `linear-gradient(155deg, ${moduleConfig.gradientFrom}f0, ${moduleConfig.gradientTo}d0)`,
          boxShadow: `0 12px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.28)`,
          border: '1px solid rgba(255,255,255,0.18)',
          minHeight: 520,
        }}
      >
        {/* ── Score ── */}
        <div className="flex flex-col items-center pt-5 pb-2 flex-shrink-0">
          <ScoreCircle percent={percent} />
          {wrongWords.length === 0 ? (
            <p className="text-white font-extrabold text-sm mt-2">¡Pronunciaste todo perfecto! 🎯</p>
          ) : (
            <div className="text-center mt-2 px-4">
              <p className="text-white font-extrabold text-base">Practica estas palabras</p>
              <p className="text-white/55 text-xs mt-0.5">Escúchalas y repite para mejorar 🎧</p>
            </div>
          )}
        </div>

        {/* ── Grid de palabras incorrectas ── */}
        {wrongWords.length > 0 && (
          <div className="relative flex-1 overflow-hidden">

            {/* Fade top */}
            <div className="absolute top-0 left-0 right-0 h-4 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to bottom, ${moduleConfig.gradientFrom}c0, transparent)` }} />

            {/* Scroll container */}
            <div
              ref={scrollRef}
              className="pron-scroll grid grid-cols-2 gap-2.5 overflow-y-auto px-3 pb-10 pt-2"
              style={{ maxHeight: 430, scrollbarWidth: 'none' }}
            >
              {wrongWords.map((r, idx) => {
                const vocab = vocabMap[r.vocabId]
                return (
                  <div
                    key={idx}
                    className="pron-card rounded-2xl p-2.5 flex flex-col gap-1.5"
                    style={{
                      animationDelay: `${idx * 0.06}s`,
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.14)',
                    }}
                  >
                    {/* Imagen + palabra + botón */}
                    <div className="flex items-center gap-1.5">
                      {vocab && getVocabImageUrl(vocab) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getVocabImageUrl(vocab)!} alt=""
                          className="rounded-xl object-contain flex-shrink-0"
                          style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)' }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-extrabold text-sm leading-tight truncate">
                          {r.expected}
                        </p>
                        {vocab?.text_es && (
                          <p className="text-white/45 text-xs truncate">{vocab.text_es}</p>
                        )}
                      </div>
                      <SpeakerButton word={r.expected ?? ''} audioUrl={vocab?.audio_url} />
                    </div>

                    {/* Lo que dijo */}
                    {r.heard && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-white/45 text-xs">Dijiste:</span>
                        <span className="text-white/90 text-xs font-bold px-1.5 py-0.5 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.12)' }}>
                          &ldquo;{r.heard}&rdquo;
                        </span>
                      </div>
                    )}

                    {r.lowConfidence && (
                      <p className="text-yellow-200/70 text-xs">🎙️ No te escuché bien, ¡intenta de nuevo!</p>
                    )}

                    {/* Tip */}
                    <p className="text-white/55 text-xs leading-snug">
                      💡 {getPronunciationTip(r.expected ?? '')}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Fade bottom + flecha de scroll */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center pointer-events-none"
              style={{ paddingBottom: 8 }}>
              <div style={{ height: 40, width: '100%',
                background: `linear-gradient(to top, ${moduleConfig.gradientTo}dd, transparent)` }} />
              {showHint && (
                <div className="scroll-hint -mt-2 flex flex-col items-center gap-0.5">
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="white" strokeWidth={2.5}
                      strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.8} />
                  </svg>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  )
}

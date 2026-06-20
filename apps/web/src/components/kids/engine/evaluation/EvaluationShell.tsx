'use client'

import { useState, useEffect, useRef } from 'react'
import type { ModuleConfig, VocabItem, WordResult, EvaluationConfig, EvalItem } from '@strides/core/kids'
import { buildEvalItems, getEvalFormat } from '@strides/core/kids'
import { getEvalFormatComponent } from './formatPool'

interface Props {
  config: EvaluationConfig
  vocab: VocabItem[]
  enabled: Record<string, boolean>
  childAge: number
  moduleConfig: ModuleConfig
  missionTitle: string
  onComplete: (r: { correct: number; total: number; wordResults: WordResult[] }) => void
  onBack: () => void
}

type CardStatus = 'locked' | 'active' | 'correct' | 'wrong'

const DEFAULT_INTRO = 'Vamos a comprobar lo que aprendiste con unos retos cortos. ¡Tú puedes!'

export function EvaluationShell({ config, vocab, enabled, childAge, moduleConfig, missionTitle, onComplete, onBack }: Props) {
  // Los ítems se generan tras montar (usan Math.random): si se generaran en el
  // render del servidor, el HTML SSR ≠ cliente → error de hidratación.
  const [items, setItems]         = useState<EvalItem[] | null>(null)
  const [stage, setStage]         = useState<'intro' | 'playing'>('intro')
  const [activeIdx, setActiveIdx] = useState(0)
  const [results, setResults]     = useState<(boolean | null)[]>([])
  const [timeLeft, setTimeLeft]   = useState(config.timerSeconds ?? 0)
  const correctRef = useRef(0)
  const resultsRef = useRef<WordResult[]>([])
  const doneRef    = useRef(false)
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([])
  const answeringRef = useRef(false)

  function finishAll(total: number) {
    if (doneRef.current) return
    doneRef.current = true
    onComplete({ correct: correctRef.current, total, wordResults: resultsRef.current })
  }

  useEffect(() => {
    const built = buildEvalItems({ vocab, config, enabled, childAge })
    setItems(built)
    setResults(built.map(() => null))
    if (built.length === 0) finishAll(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll a la tarjeta activa + libera el guard para la nueva tarjeta.
  useEffect(() => {
    answeringRef.current = false
    cardRefs.current[activeIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIdx])

  // Timer global opcional (arranca al empezar, con los ítems listos).
  useEffect(() => {
    if (stage !== 'playing' || !items || !config.timerEnabled || !config.timerSeconds) return
    const total = items.length
    const t = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(t); finishAll(total); return 0 } return prev - 1 })
    }, 1000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, stage])

  function handleAnswer(correct: boolean) {
    if (!items || answeringRef.current) return
    answeringRef.current = true
    const item = items[activeIdx]
    if (item) {
      if (correct) correctRef.current++
      resultsRef.current.push({ vocabId: item.vocab.id, correct })
    }
    setResults(prev => { const n = [...prev]; n[activeIdx] = correct; return n })
    if (activeIdx < items.length - 1) setActiveIdx(activeIdx + 1)
    else finishAll(items.length)
  }

  // ── Intro: bienvenida a la misión ──
  if (stage === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--kids-bg)' }}>
        <button onClick={onBack} className="absolute top-6 left-6 text-sm font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
          ← Salir
        </button>
        <div className="flex flex-col items-center gap-4 max-w-xs">
          <span className="text-6xl leading-none">📝</span>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--kids-text-muted)' }}>Misión</p>
          <h2 className="text-2xl font-extrabold leading-tight" style={{ color: 'var(--kids-text)' }}>{missionTitle}</h2>
          <p className="text-sm" style={{ color: 'var(--kids-text-muted)' }}>{config.intro || DEFAULT_INTRO}</p>
          <button
            onClick={() => setStage('playing')}
            className="mt-2 text-white font-extrabold px-8 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: moduleConfig.accent }}
          >
            Empezar →
          </button>
        </div>
      </div>
    )
  }

  if (items === null || items.length === 0) return null

  const answered = results.filter(r => r !== null).length
  const pct = Math.round((answered / items.length) * 100)

  return (
    <div className="min-h-screen px-4 py-6 sm:py-8" style={{ background: 'var(--kids-bg)' }}>
      <div className="w-full max-w-md mx-auto">

        {/* ── Cabecera de misión ── */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <button onClick={onBack} className="text-xs font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
              ← Salir
            </button>
            {config.timerEnabled && config.timerSeconds ? (
              <span className="text-xs font-extrabold tabular-nums" style={{ color: moduleConfig.accent }}>⏱ {timeLeft}</span>
            ) : (
              <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--kids-text-muted)' }}>{answered}/{items.length}</span>
            )}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--kids-text-muted)' }}>Misión</p>
          <h2 className="text-xl font-extrabold leading-tight mb-3" style={{ color: 'var(--kids-text)' }}>
            {missionTitle}
          </h2>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--kids-border-color)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: moduleConfig.accent }} />
          </div>
        </div>

        {/* ── Tarjetas de la misión ── */}
        <div className="space-y-3">
          {items.map((it, i) => {
            const status: CardStatus = results[i] === null ? (i === activeIdx ? 'active' : 'locked') : (results[i] ? 'correct' : 'wrong')
            const meta = getEvalFormat(it.formatId)
            const FormatComp = getEvalFormatComponent(it.formatId)

            const border =
              status === 'active'  ? moduleConfig.accent
              : status === 'correct' ? '#22c55e'
              : status === 'wrong'   ? '#ef4444'
              : 'var(--kids-border-color)'

            return (
              <div
                key={it.vocab.id + '-' + i}
                ref={el => { cardRefs.current[i] = el }}
                className="rounded-2xl transition-all"
                style={{
                  background: 'var(--kids-surface)',
                  border: `2px solid ${border}`,
                  opacity: status === 'locked' ? 0.45 : 1,
                  boxShadow: status === 'active' ? '0 8px 28px rgba(0,0,0,0.10)' : 'none',
                }}
              >
                {/* Header de tarjeta */}
                <div className="flex items-center gap-2.5 px-4 py-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                    style={{
                      background: status === 'correct' ? '#22c55e' : status === 'wrong' ? '#ef4444' : status === 'active' ? moduleConfig.accent : 'var(--kids-border-color)',
                      color: status === 'locked' ? 'var(--kids-text-muted)' : '#fff',
                    }}
                  >
                    {status === 'correct' ? '✓' : status === 'wrong' ? '✗' : status === 'locked' ? '🔒' : i + 1}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--kids-text)' }}>
                    {meta?.label ?? 'Reto'}
                  </span>
                </div>

                {/* Cuerpo: solo la tarjeta activa es interactiva */}
                {status === 'active' && (
                  <div className="px-4 pb-4 pt-1">
                    {FormatComp ? (
                      <FormatComp item={it} allVocab={vocab} moduleConfig={moduleConfig} onAnswer={handleAnswer} />
                    ) : (
                      <button onClick={() => handleAnswer(false)} className="font-bold px-6 py-3 rounded-2xl" style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}>
                        Continuar →
                      </button>
                    )}
                    {/* Nunca bloquea: siempre puede pasar a la siguiente */}
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => handleAnswer(false)}
                        className="text-xs font-semibold transition-opacity hover:opacity-100"
                        style={{ color: 'var(--kids-text-muted)', opacity: 0.6 }}
                      >
                        🤔 No lo sé →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

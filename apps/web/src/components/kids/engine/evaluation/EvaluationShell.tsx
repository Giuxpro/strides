'use client'

import { useState, useEffect, useRef } from 'react'
import type { ModuleConfig, VocabItem, WordResult, EvaluationConfig, EvalItem, EvalAttemptQuestion } from '@strides/core/kids'
import { buildEvalItems, getEvalFormat } from '@strides/core/kids'
import { getEvalFormatComponent } from './formatPool'
import type { EvalSnapshot } from './snapshots'

export interface PreviousAttempt {
  detail: EvalAttemptQuestion[]
  correct: number
  total: number
  stars: number
  attempts: number
}

interface Props {
  config: EvaluationConfig
  vocab: VocabItem[]
  enabled: Record<string, boolean>
  childAge: number
  previewMode?: boolean
  moduleConfig: ModuleConfig
  missionTitle: string
  previousAttempt?: PreviousAttempt | null
  onComplete: (r: { correct: number; total: number; wordResults: WordResult[]; detail: EvalAttemptQuestion[] }) => void
  onBack: () => void
}

const DEFAULT_INTRO = 'Vamos a comprobar lo que aprendiste con unos retos cortos. ¡Tú puedes!'

export function EvaluationShell({ config, vocab, enabled, childAge, previewMode = false, moduleConfig, missionTitle, previousAttempt, onComplete, onBack }: Props) {
  // Los ítems se generan tras montar (usan Math.random): si se generaran en el
  // render del servidor, el HTML SSR ≠ cliente → error de hidratación.
  const [items, setItems]       = useState<EvalItem[] | null>(null)
  const [stage, setStage]       = useState<'intro' | 'playing' | 'review'>('intro')
  const [results, setResults]   = useState<(boolean | null)[]>([])
  const [timeLeft, setTimeLeft] = useState(config.timerSeconds ?? 0)
  const [confirmRetake, setConfirmRetake] = useState(false)
  // El primer audio espera a que la página cargue y las voces estén disponibles:
  // si no, el navegador a veces arranca la síntesis cortada al iniciar la eval.
  const [ready, setReady] = useState(false)
  const doneRef     = useRef(false)
  const itemsRef    = useRef<EvalItem[] | null>(null)
  const resultsRef  = useRef<(boolean | null)[]>([])
  const snapshotsRef = useRef<(EvalSnapshot | null)[]>([])
  itemsRef.current   = items
  resultsRef.current = results

  // Cierra la evaluación con lo respondido hasta ahora (sin respuesta = incorrecta).
  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    const its = itemsRef.current ?? []
    const res = resultsRef.current
    const correct = res.filter(r => r === true).length
    const wordResults: WordResult[] = its.map((it, i) => ({ vocabId: it.vocab.id, correct: res[i] === true }))
    const detail: EvalAttemptQuestion[] = its.map((it, i) => ({
      formatId: it.formatId,
      vocabId:  it.vocab.id,
      correct:  res[i] === true,
      snapshot: snapshotsRef.current[i] ?? null,
    }))
    onComplete({ correct, total: its.length, wordResults, detail })
  }

  // Listo = documento cargado + voces de síntesis disponibles (con fallback por si
  // 'voiceschanged' no dispara). Hasta entonces no se autoreproduce el primer audio.
  useEffect(() => {
    let settled = false
    function check() {
      if (settled) return
      const pageOk = document.readyState === 'complete'
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
      const voicesOk = synth ? synth.getVoices().length > 0 : true
      if (pageOk && voicesOk) { settled = true; setReady(true) }
    }
    check()
    window.addEventListener('load', check)
    window.speechSynthesis?.addEventListener('voiceschanged', check)
    const fallback = setTimeout(() => { settled = true; setReady(true) }, 1500)
    return () => {
      window.removeEventListener('load', check)
      window.speechSynthesis?.removeEventListener('voiceschanged', check)
      clearTimeout(fallback)
    }
  }, [])

  useEffect(() => {
    const built = buildEvalItems({ vocab, config, enabled, childAge })
    setItems(built)
    setResults(built.map(() => null))
    snapshotsRef.current = built.map(() => null)
    // Eval vacía: en juego real se salta; en preview se muestra el aviso (no finish).
    if (built.length === 0 && !previewMode) finish()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El examen lo cierra el niño con "Terminar misión" (o el timer si está activo):
  // no se autocierra al responder la última, para no redirigir de golpe.

  // Timer global opcional (arranca al empezar, con los ítems listos).
  useEffect(() => {
    if (stage !== 'playing' || !items || !config.timerEnabled || !config.timerSeconds) return
    const t = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(t); finish(); return 0 } return prev - 1 })
    }, 1000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, stage])

  function handleSnapshot(idx: number, snap: EvalSnapshot) {
    if (resultsRef.current[idx] != null) return // ya respondida: no pisar con el inicial
    snapshotsRef.current[idx] = snap
  }

  function handleAnswer(idx: number, correct: boolean, snap: EvalSnapshot) {
    snapshotsRef.current[idx] = snap
    setResults(prev => {
      if (prev[idx] !== null) return prev
      const n = [...prev]; n[idx] = correct; return n
    })
  }

  // ── Intro: bienvenida a la misión (o resumen si ya fue realizada) ──
  if (stage === 'intro') {
    const alreadyDone = !!previousAttempt && !previewMode
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--kids-bg)' }}>
        <button onClick={onBack} className="absolute top-6 left-6 text-sm font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
          ← Salir
        </button>
        <div className="flex flex-col items-center gap-4 max-w-xs">
          <span className="text-6xl leading-none">{alreadyDone ? '✅' : '📝'}</span>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--kids-text-muted)' }}>Misión</p>
          <h2 className="text-2xl font-extrabold leading-tight" style={{ color: 'var(--kids-text)' }}>{missionTitle}</h2>

          {alreadyDone ? (
            <>
              <p className="text-sm" style={{ color: 'var(--kids-text-muted)' }}>
                Ya completaste esta evaluación: <strong style={{ color: 'var(--kids-text)' }}>{previousAttempt!.correct} de {previousAttempt!.total} correctas</strong>. Puedes ver tus respuestas o intentarla de nuevo.
              </p>
              <button
                onClick={() => setStage('review')}
                className="mt-1 w-full font-extrabold px-8 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
              >
                👀 Ver mis respuestas
              </button>
              <button
                onClick={() => setConfirmRetake(true)}
                className="w-full text-white font-extrabold px-8 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={{ background: moduleConfig.accent }}
              >
                🔄 Repetir evaluación
              </button>
            </>
          ) : (
            <>
              <p className="text-sm" style={{ color: 'var(--kids-text-muted)' }}>{config.intro || DEFAULT_INTRO}</p>
              <button
                onClick={() => setStage('playing')}
                className="mt-2 text-white font-extrabold px-8 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={{ background: moduleConfig.accent }}
              >
                Empezar →
              </button>
            </>
          )}
        </div>

        {/* Modal de confirmación de repetición */}
        {confirmRetake && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div className="w-full max-w-xs rounded-3xl p-6 text-center flex flex-col gap-3" style={{ background: 'var(--kids-bg)', border: '2px solid var(--kids-border-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}>
              <span className="text-5xl">⚠️</span>
              <h3 className="text-lg font-extrabold" style={{ color: 'var(--kids-text)' }}>¿Repetir la evaluación?</h3>
              <p className="text-sm" style={{ color: 'var(--kids-text-muted)' }}>
                Tus respuestas anteriores se borrarán y se reemplazarán por las nuevas. Esta acción no se puede deshacer.
              </p>
              <button
                onClick={() => { setConfirmRetake(false); setStage('playing') }}
                className="mt-1 w-full text-white font-extrabold px-6 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={{ background: moduleConfig.accent }}
              >
                Sí, empezar de nuevo
              </button>
              <button
                onClick={() => setConfirmRetake(false)}
                className="w-full font-bold px-6 py-2.5 rounded-2xl transition-opacity hover:opacity-70"
                style={{ color: 'var(--kids-text-muted)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Review: replay de las respuestas guardadas, solo lectura ──
  if (stage === 'review' && previousAttempt) {
    return (
      <div className="min-h-screen px-4 py-6 sm:py-8" style={{ background: 'var(--kids-bg)' }}>
        <div className="w-full max-w-md mx-auto">
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setStage('intro')} className="text-xs font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
                ← Volver
              </button>
              <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--kids-text-muted)' }}>
                {previousAttempt.correct}/{previousAttempt.total}
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--kids-text-muted)' }}>Mis respuestas</p>
            <h2 className="text-xl font-extrabold leading-tight" style={{ color: 'var(--kids-text)' }}>{missionTitle}</h2>
          </div>

          <div className="space-y-3">
            {previousAttempt.detail.map((q, i) => {
              const meta = getEvalFormat(q.formatId)
              const FormatComp = getEvalFormatComponent(q.formatId)
              const v = vocab.find(x => x.id === q.vocabId)
              const border = q.correct ? '#22c55e' : '#ef4444'
              return (
                <div key={i} className="rounded-2xl transition-all" style={{ background: 'var(--kids-surface)', border: `2px solid ${border}` }}>
                  <div className="flex items-center gap-2.5 px-4 py-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 text-white" style={{ background: border }}>
                      {q.correct ? '✓' : '✗'}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--kids-text)' }}>
                      {meta?.label ?? 'Reto'}
                    </span>
                  </div>
                  <div className="px-4 pb-4 pt-1">
                    {FormatComp && v ? (
                      <FormatComp
                        item={{ vocab: v, formatId: q.formatId, skill: meta?.skill ?? 'receptive' }}
                        allVocab={vocab}
                        moduleConfig={moduleConfig}
                        onAnswer={() => {}}
                        review={(q.snapshot ?? undefined) as EvalSnapshot | undefined}
                      />
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => setStage('intro')}
            className="w-full mt-5 font-extrabold px-6 py-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
          >
            ← Volver
          </button>
        </div>
      </div>
    )
  }

  if (items === null) return null

  if (items.length === 0) {
    // En juego real ya se llamó finish() y este render no se ve; en preview avisamos.
    if (!previewMode) return null
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4" style={{ background: 'var(--kids-bg)' }}>
        <button onClick={onBack} className="absolute top-6 left-6 text-sm font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
          ← Salir
        </button>
        <span className="text-5xl">📝</span>
        <h2 className="text-lg font-extrabold" style={{ color: 'var(--kids-text)' }}>Esta evaluación no tiene preguntas</h2>
        <p className="text-sm max-w-xs" style={{ color: 'var(--kids-text-muted)' }}>
          En modo Aleatorio las palabras salen de los ejercicios de la lección. Agrega ejercicios con vocabulario, o elige palabras en la evaluación. En el juego real este paso se salta solo.
        </p>
      </div>
    )
  }

  const answered = results.filter(r => r !== null).length
  const pct = Math.round((answered / items.length) * 100)
  // Solo la 1ª pregunta sin responder reproduce su audio (las demás, al llegar su turno).
  const focusIdx = results.findIndex(r => r === null)

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

        {/* ── Tarjetas de la misión: todas activas, examen continuo ── */}
        <div className="space-y-3">
          {items.map((it, i) => {
            const answeredThis = results[i] !== null
            const meta = getEvalFormat(it.formatId)
            const FormatComp = getEvalFormatComponent(it.formatId)

            const border =
              !answeredThis      ? 'var(--kids-border-color)'
              : results[i]       ? '#22c55e'
              :                    '#ef4444'

            return (
              <div
                key={it.vocab.id + '-' + i}
                className="rounded-2xl transition-all"
                style={{ background: 'var(--kids-surface)', border: `2px solid ${border}` }}
              >
                {/* Header de tarjeta */}
                <div className="flex items-center gap-2.5 px-4 py-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                    style={{
                      background: answeredThis ? (results[i] ? '#22c55e' : '#ef4444') : moduleConfig.accentLight,
                      color: answeredThis ? '#fff' : moduleConfig.accent,
                    }}
                  >
                    {answeredThis ? (results[i] ? '✓' : '✗') : i + 1}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--kids-text)' }}>
                    {meta?.label ?? 'Reto'}
                  </span>
                </div>

                {/* Cuerpo: siempre interactivo (cada formato se bloquea solo al responder) */}
                <div className="px-4 pb-4 pt-1">
                  {FormatComp ? (
                    <FormatComp
                      item={it}
                      allVocab={vocab}
                      moduleConfig={moduleConfig}
                      onAnswer={(c, snap) => handleAnswer(i, c, snap)}
                      onSnapshot={snap => handleSnapshot(i, snap)}
                      autoPlay={i === focusIdx && ready}
                    />
                  ) : (
                    <button onClick={() => handleAnswer(i, false, { kind: 'speak', result: 'wrong' })} className="font-bold px-6 py-3 rounded-2xl" style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}>
                      Continuar →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Terminar: el niño cierra cuando quiera ── */}
        <button
          onClick={finish}
          className="w-full mt-5 text-white font-extrabold px-6 py-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: moduleConfig.accent }}
        >
          Terminar misión →
        </button>
      </div>
    </div>
  )
}

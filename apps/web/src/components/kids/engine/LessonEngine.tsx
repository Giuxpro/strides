'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ModuleConfig, ModifierConfig, WordResult, VocabItem, ExerciseData, EvaluationConfig } from '@strides/core/kids'
import { DEFAULT_EVAL_FORMATS } from '@strides/core/kids'
import { getGameById } from './gamePool'
import { EvaluationShell } from './evaluation/EvaluationShell'
import { ModifierStack } from './modifiers/ModifierStack'
import { VideoStep } from './steps/VideoStep'
import { SlideStep } from './steps/SlideStep'
import { completeLesson } from '@/app/kids/play/_actions'
import { SpeechConfigProvider } from './SpeechConfigContext'
import { PronunciationResultPanel } from './PronunciationResultPanel'
import { useMusicContext } from '@/components/kids/audio/MusicProvider'
import type { SpeechProvider } from '@strides/core/kids'

export type { VocabItem, ExerciseData }

type VideoStepData = {
  id: string
  position: number
  step_type: 'video'
  title: string | null
  config: { url: string; caption?: string }
}

type SlideStepData = {
  id: string
  position: number
  step_type: 'slide'
  title: string | null
  config: { image_url?: string; text_en: string; text_es: string }
}

type ExerciseStepData = {
  id: string
  position: number
  step_type: 'exercise'
  title: string | null
  config: { modifiers?: ModifierConfig[] }
  exercise: ExerciseData
}

type EvaluationStepData = {
  id: string
  position: number
  step_type: 'evaluation'
  title: string | null
  config: EvaluationConfig
  vocab: VocabItem[]
}

export type LessonStep = VideoStepData | SlideStepData | ExerciseStepData | EvaluationStepData

interface Props {
  lesson: { id: string; title_es: string; title_en: string }
  moduleSlug: string
  steps: LessonStep[]
  moduleConfig: ModuleConfig
  speechProvider?: SpeechProvider
  previewMode?: boolean
  backHref?: string
  childAge?: number
  evalFormatsEnabled?: Record<string, boolean>
}

// ── 3D kids-style arrow button ────────────────────────────────────────────────
function NavArrow({
  direction, onClick, show, enabled,
}: {
  direction: 'back' | 'forward'
  onClick: () => void
  show: boolean
  enabled: boolean
}) {
  return (
    <button
      onClick={enabled && show ? onClick : undefined}
      aria-label={direction === 'forward' ? 'Paso siguiente' : 'Paso anterior'}
      className="select-none transition-all hover:scale-110 active:scale-95"
      style={{
        transform: direction === 'back' ? 'scaleX(-1)' : undefined,
        opacity:   show ? (enabled ? 1 : 0.35) : 0,
        cursor:    enabled && show ? 'pointer' : 'default',
        filter:    enabled ? 'none' : 'grayscale(1) brightness(1.1)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ui/arrow-right.webp"
        alt=""
        width={72}
        height={56}
        draggable={false}
        style={{ display: 'block' }}
      />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export function LessonEngine({ lesson, moduleSlug, steps, moduleConfig, speechProvider = 'web-speech', previewMode = false, backHref, childAge = 6, evalFormatsEnabled = DEFAULT_EVAL_FORMATS }: Props) {
  const router = useRouter()
  const { setMusicContext } = useMusicContext()
  const [stage, setStage]               = useState<'playing' | 'results'>('playing')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set())
  const [evalScoreMap, setEvalScoreMap] = useState<Record<number, number>>({})
  const [evalTotalMap, setEvalTotalMap] = useState<Record<number, number>>({})
  const [allWordResults, setAllWordResults] = useState<WordResult[]>([])

  const currentDone = completedSet.has(currentIndex)

  const evalStepIndices = steps.reduce<number[]>((acc, s, i) => {
    if (s.step_type === 'exercise' && s.exercise.phase === 'evaluation') acc.push(i)
    else if (s.step_type === 'evaluation') acc.push(i)
    return acc
  }, [])
  const evalTotal   = evalStepIndices.reduce((acc, i) => {
    const s = steps[i]
    if (s?.step_type === 'exercise') return acc + s.exercise.items.length
    return acc + (evalTotalMap[i] ?? 0)
  }, 0)
  const evalCorrect = Object.values(evalScoreMap).reduce((a, b) => a + b, 0)

  function handleBack() {
    if (previewMode) {
      if (backHref) router.push(backHref)
      else router.back()
      return
    }
    router.push(`/kids/play/${moduleSlug}`)
  }

  function goForward() {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setStage('results')
    }
  }

  function goBack() {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
  }

  function markDone(correct: number, total?: number, wordResults?: WordResult[]) {
    const alreadyDone = completedSet.has(currentIndex)
    const step = steps[currentIndex]
    const isEval = (step?.step_type === 'exercise' && step.exercise.phase === 'evaluation') || step?.step_type === 'evaluation'

    if (!alreadyDone) {
      if (isEval) {
        setEvalScoreMap(prev => ({ ...prev, [currentIndex]: correct }))
        if (total !== undefined) setEvalTotalMap(prev => ({ ...prev, [currentIndex]: total }))
      }
      if (wordResults?.length) {
        setAllWordResults(prev => [...prev, ...wordResults])
      }
      setCompletedSet(prev => { const n = new Set(prev); n.add(currentIndex); return n })
      goForward()
    } else {
      setCompletedSet(prev => { const n = new Set(prev); n.add(currentIndex); return n })
    }
  }

  /* ── Results ── */
  if (stage === 'results') {
    const ratio        = evalTotal > 0 ? evalCorrect / evalTotal : 1
    const passed       = ratio >= 0.7
    const scorePercent = Math.round(ratio * 100)
    const starCount    = Math.round(ratio * 3)

    const vocabMap = steps.reduce<Record<string, VocabItem>>((acc, step) => {
      if (step.step_type === 'exercise') {
        step.exercise.items.forEach(item => { acc[item.id] = item })
      }
      return acc
    }, {})

    const speakingResults = allWordResults.filter(r => r.expected !== undefined)
    const wrongWords      = speakingResults.filter(r => !r.correct)
    const speakingPercent = speakingResults.length > 0
      ? Math.round((speakingResults.filter(r => r.correct).length / speakingResults.length) * 100)
      : null

    const actionBtn = previewMode ? (
      <button
        onClick={() => backHref ? router.push(backHref) : router.back()}
        className="w-full text-white font-extrabold text-lg px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
        style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
      >
        ← Volver al admin
      </button>
    ) : (
      <form action={completeLesson}>
        <input type="hidden" name="lessonId"    value={lesson.id} />
        <input type="hidden" name="moduleSlug"  value={moduleSlug} />
        <input type="hidden" name="score"       value={String(scorePercent)} />
        <input type="hidden" name="stars"       value={String(starCount)} />
        <input type="hidden" name="wordResults" value={JSON.stringify(allWordResults)} />
        <button
          type="submit"
          className="w-full text-white font-extrabold text-lg px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
          style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
        >
          Volver al módulo ✨
        </button>
      </form>
    )

    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6">
        <div
          className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full opacity-25 blur-[120px] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
        />

        <div className={`relative z-10 animate-slide-up w-full ${speakingPercent !== null ? 'max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center' : 'max-w-sm flex flex-col items-center text-center'}`}>

          {/* Score summary */}
          <div className="flex flex-col items-center text-center gap-3">
            <span className="text-7xl block animate-float leading-none">
              {passed ? '🏆' : '💪'}
            </span>
            <h2 className="text-3xl font-extrabold" style={{ color: 'var(--kids-text)' }}>
              {passed ? '¡Excelente!' : '¡Buen intento!'}
            </h2>
            {evalTotal > 0 && (
              <>
                <p style={{ color: 'var(--kids-text-muted)' }}>
                  {evalCorrect} de {evalTotal} correctas
                </p>
                <p className="text-2xl tracking-wider">
                  {'⭐'.repeat(starCount)}{'☆'.repeat(3 - starCount)}
                </p>
              </>
            )}
            {evalTotal === 0 && (
              <p style={{ color: 'var(--kids-text-muted)' }}>Práctica completada</p>
            )}
            <div className="w-full mt-2">{actionBtn}</div>
          </div>

          {/* Panel de pronunciación (solo si hubo ejercicio speaking) */}
          {speakingPercent !== null && (
            <PronunciationResultPanel
              wordResults={allWordResults}
              vocabMap={vocabMap}
              moduleConfig={moduleConfig}
            />
          )}

        </div>
      </div>
    )
  }

  /* ── Playing ── */
  const step = steps[currentIndex]
  if (!step) return null

  const progress = { current: currentIndex + 1, total: steps.length }

  const canGoBack    = currentIndex > 0
  const canGoForward = currentDone

  const navOverlay = (
    <div className="fixed bottom-6 left-0 right-0 z-[65] flex justify-center items-center gap-4 pointer-events-none">
      {canGoBack
        ? <div className="pointer-events-auto"><NavArrow direction="back" onClick={goBack} show enabled /></div>
        : <div style={{ width: 16 }} />
      }

      {/* Step dots */}
      <div className="flex gap-1.5 items-center">
        {steps.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width:      i === currentIndex ? 10 : 7,
              height:     i === currentIndex ? 10 : 7,
              background: completedSet.has(i)
                ? moduleConfig.accent
                : i === currentIndex
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(255,255,255,0.35)',
              boxShadow: i === currentIndex ? `0 0 0 2px ${moduleConfig.accent}` : 'none',
            }}
          />
        ))}
      </div>

      <div className="pointer-events-auto">
        <NavArrow
          direction="forward"
          onClick={goForward}
          show
          enabled={canGoForward}
        />
      </div>
    </div>
  )

  if (step.step_type === 'video') {
    return (
      <>
        <VideoStep
          title={step.title}
          config={step.config}
          onComplete={() => markDone(0)}
          onBack={handleBack}
          moduleConfig={moduleConfig}
          progress={progress}
        />
        {navOverlay}
      </>
    )
  }

  if (step.step_type === 'slide') {
    return (
      <>
        <SlideStep
          title={step.title}
          config={step.config}
          onComplete={() => markDone(0)}
          onBack={handleBack}
          moduleConfig={moduleConfig}
          progress={progress}
        />
        {navOverlay}
      </>
    )
  }

  if (step.step_type === 'evaluation') {
    return (
      <SpeechConfigProvider provider={speechProvider}>
        <EvaluationShell
          config={step.config}
          vocab={step.vocab}
          enabled={evalFormatsEnabled}
          childAge={childAge}
          previewMode={previewMode}
          moduleConfig={moduleConfig}
          missionTitle={`Recordando ${lesson.title_es}`}
          onComplete={({ correct, total, wordResults }) => markDone(correct, total, wordResults)}
          onBack={handleBack}
        />
      </SpeechConfigProvider>
    )
  }

  if (step.step_type === 'exercise') {
    const { exercise } = step
    const game = getGameById(exercise.type)
    if (game) {
      setMusicContext('game')
      return (
        <SpeechConfigProvider provider={speechProvider}>
          <>
            <ModifierStack
              key={step.id}
              game={game.component}
              items={exercise.items}
              modifiers={step.config.modifiers ?? []}
              onGameEnd={({ correct, wordResults }) => { setMusicContext('navigation'); markDone(correct, undefined, wordResults) }}
              onBack={() => { setMusicContext('navigation'); handleBack() }}
              moduleConfig={moduleConfig}
              progress={progress}
            />
            {navOverlay}
          </>
        </SpeechConfigProvider>
      )
    }
  }

  return null
}

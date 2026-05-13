'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ModuleConfig, ModifierConfig, WordResult, VocabItem, ExerciseData } from '@strides/core/kids'
import { getGameById } from './gamePool'
import { ModifierStack } from './modifiers/ModifierStack'
import { VideoStep } from './steps/VideoStep'
import { SlideStep } from './steps/SlideStep'
import { completeLesson } from '@/app/kids/play/_actions'
import { SpeechConfigProvider } from './SpeechConfigContext'
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

export type LessonStep = VideoStepData | SlideStepData | ExerciseStepData

interface Props {
  lesson: { id: string; title_es: string; title_en: string }
  moduleSlug: string
  steps: LessonStep[]
  moduleConfig: ModuleConfig
  speechProvider?: SpeechProvider
  previewMode?: boolean
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

export function LessonEngine({ lesson, moduleSlug, steps, moduleConfig, speechProvider = 'web-speech', previewMode = false }: Props) {
  const router = useRouter()
  const [stage, setStage]               = useState<'playing' | 'results'>('playing')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set())
  const [evalScoreMap, setEvalScoreMap] = useState<Record<number, number>>({})
  const [allWordResults, setAllWordResults] = useState<WordResult[]>([])

  const currentDone = completedSet.has(currentIndex)

  const evalStepIndices = steps.reduce<number[]>((acc, s, i) => {
    if (s.step_type === 'exercise' && s.exercise.phase === 'evaluation') acc.push(i)
    return acc
  }, [])
  const evalTotal   = evalStepIndices.reduce((acc, i) => acc + (steps[i] as ExerciseStepData).exercise.items.length, 0)
  const evalCorrect = Object.values(evalScoreMap).reduce((a, b) => a + b, 0)

  function handleBack() {
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

  function markDone(correct: number, wordResults?: WordResult[]) {
    const alreadyDone = completedSet.has(currentIndex)
    const step = steps[currentIndex]

    if (!alreadyDone) {
      if (step?.step_type === 'exercise' && step.exercise.phase === 'evaluation') {
        setEvalScoreMap(prev => ({ ...prev, [currentIndex]: correct }))
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

    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div
          className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full opacity-25 blur-[120px] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
        />

        <div className="relative z-10 text-center px-8 animate-slide-up max-w-sm w-full">
          <span className="text-7xl block mb-4 animate-float leading-none">
            {passed ? '🏆' : '💪'}
          </span>
          <h2 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--kids-text)' }}>
            {passed ? '¡Excelente!' : '¡Buen intento!'}
          </h2>
          {evalTotal > 0 && (
            <>
              <p className="mb-3" style={{ color: 'var(--kids-text-muted)' }}>
                {evalCorrect} de {evalTotal} correctas
              </p>
              <p className="text-2xl mb-8 tracking-wider">
                {'⭐'.repeat(starCount)}{'☆'.repeat(3 - starCount)}
              </p>
            </>
          )}
          {evalTotal === 0 && (
            <p className="mb-8" style={{ color: 'var(--kids-text-muted)' }}>
              Práctica completada
            </p>
          )}

          {previewMode ? (
            <button
              onClick={() => router.back()}
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
    <div className="fixed bottom-6 left-0 right-0 z-[65] flex justify-center items-center gap-6 pointer-events-none">
      <div className="pointer-events-auto">
        <NavArrow
          direction="back"
          onClick={goBack}
          show={canGoBack}
          enabled={canGoBack}
        />
      </div>

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

  if (step.step_type === 'exercise') {
    const { exercise } = step
    const game = getGameById(exercise.type)
    if (game) {
      return (
        <SpeechConfigProvider provider={speechProvider}>
          <>
            <ModifierStack
              key={step.id}
              game={game.component}
              items={exercise.items}
              modifiers={step.config.modifiers ?? []}
              onGameEnd={({ correct, wordResults }) => markDone(correct, wordResults)}
              onBack={handleBack}
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

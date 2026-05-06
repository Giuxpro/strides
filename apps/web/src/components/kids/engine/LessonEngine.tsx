'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ModuleConfig } from '@/components/kids/moduleConfig'
import { getGameById } from './gamePool'
import { ModifierStack } from './modifiers/ModifierStack'
import type { ModifierConfig } from './modifiers/types'
import { VideoStep } from './VideoStep'
import { SlideStep } from './SlideStep'
import { completeLesson } from '@/app/actions/lessons'

export type VocabItem = {
  id: string
  text_en: string
  text_es: string
  image_url: string | null
  audio_url: string | null
}

export type ExerciseData = {
  id: string
  type: 'memory' | 'recognition' | 'speaking'
  phase: 'practice' | 'evaluation'
  order: number
  items: VocabItem[]
}

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
}

export function LessonEngine({ lesson, moduleSlug, steps, moduleConfig }: Props) {
  const router = useRouter()
  const [stage, setStage] = useState<'playing' | 'results'>('playing')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [evalCorrect, setEvalCorrect] = useState(0)

  function handleBack() {
    router.push(`/kids/play/${moduleSlug}`)
  }

  const exerciseSteps = steps.filter((s): s is ExerciseStepData => s.step_type === 'exercise')

  const evalTotal = exerciseSteps
    .filter(s => s.exercise.phase === 'evaluation')
    .reduce((acc, s) => acc + s.exercise.items.length, 0)

  function advance(correct: number) {
    const step = steps[currentIndex]
    if (step?.step_type === 'exercise' && step.exercise.phase === 'evaluation') {
      setEvalCorrect(prev => prev + correct)
    }
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setStage('results')
    }
  }

  /* ── Results ── */
  if (stage === 'results') {
    const ratio = evalTotal > 0 ? evalCorrect / evalTotal : 1
    const passed = ratio >= 0.7
    const scorePercent = Math.round(ratio * 100)
    const starCount = Math.round(ratio * 3)

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
          <h2
            className="text-3xl font-extrabold mb-2"
            style={{ color: 'var(--kids-text)' }}
          >
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

          <form action={completeLesson}>
            <input type="hidden" name="lessonId"   value={lesson.id} />
            <input type="hidden" name="moduleSlug" value={moduleSlug} />
            <input type="hidden" name="score"      value={String(scorePercent)} />
            <input type="hidden" name="stars"      value={String(starCount)} />
            <button
              type="submit"
              className="w-full text-white font-extrabold text-lg px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
            >
              Volver al módulo ✨
            </button>
          </form>
        </div>
      </div>
    )
  }

  /* ── Playing ── */
  const step = steps[currentIndex]
  if (!step) return null

  const progress = { current: currentIndex + 1, total: steps.length }

  if (step.step_type === 'video') {
    return (
      <VideoStep
        title={step.title}
        config={step.config}
        onComplete={() => advance(0)}
        onBack={handleBack}
        moduleConfig={moduleConfig}
        progress={progress}
      />
    )
  }

  if (step.step_type === 'slide') {
    return (
      <SlideStep
        title={step.title}
        config={step.config}
        onComplete={() => advance(0)}
        onBack={handleBack}
        moduleConfig={moduleConfig}
        progress={progress}
      />
    )
  }

  if (step.step_type === 'exercise') {
    const { exercise } = step
    const game = getGameById(exercise.type)
    if (game) {
      return (
        <ModifierStack
          game={game.component}
          items={exercise.items}
          modifiers={step.config.modifiers ?? []}
          onGameEnd={({ correct }) => advance(correct)}
          onBack={handleBack}
          moduleConfig={moduleConfig}
          progress={progress}
        />
      )
    }
  }

  return null
}

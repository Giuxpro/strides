'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ModuleConfig } from '@/components/kids/moduleConfig'
import { MemoryGame } from './MemoryGame'
import { RecognitionExercise } from './RecognitionExercise'
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
  config: Record<string, never>
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
  const [stage, setStage] = useState<'intro' | 'playing' | 'results'>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [evalCorrect, setEvalCorrect] = useState(0)

  function handleBack() {
    router.push(`/kids/play/${moduleSlug}`)
  }

  const exerciseSteps = steps.filter((s): s is ExerciseStepData => s.step_type === 'exercise')

  const evalTotal = exerciseSteps
    .filter(s => s.exercise.phase === 'evaluation')
    .reduce((acc, s) => acc + s.exercise.items.length, 0)

  const uniqueVocab = [...new Map(
    exerciseSteps.flatMap(s => s.exercise.items).map(v => [v.id, v])
  ).values()]
  const wordCount = uniqueVocab.length

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

  /* ── Intro ── */
  if (stage === 'intro') {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div
          className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full opacity-25 blur-[120px] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
        />
        <div
          className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)` }}
        />

        <button
          onClick={handleBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-70"
          style={{ color: moduleConfig.accent }}
        >
          ← Volver
        </button>

        <div className="relative z-10 text-center px-8 animate-slide-up">
          <span className="text-8xl block mb-6 animate-float leading-none">
            {moduleConfig.emoji}
          </span>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: 'var(--kids-text-muted)' }}
          >
            {lesson.title_en}
          </p>
          <h1
            className="text-4xl font-extrabold mb-5 leading-tight"
            style={{ color: 'var(--kids-text)' }}
          >
            {lesson.title_es}
          </h1>
          {wordCount > 0 && (
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold mb-10"
              style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
            >
              ✨ {wordCount} palabras nuevas · {steps.length} pasos
            </div>
          )}
          <div>
            <button
              onClick={() => setStage('playing')}
              className="text-white font-extrabold text-xl px-10 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
            >
              ¡A jugar! 🚀
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Results ── */
  if (stage === 'results') {
    const passed = evalTotal > 0 ? evalCorrect / evalTotal >= 0.6 : true
    const starCount = evalTotal > 0 ? Math.round((evalCorrect / evalTotal) * 3) : 3

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
            <input type="hidden" name="passed"     value={passed ? 'true' : 'false'} />
            <input type="hidden" name="score"      value={String(evalCorrect)} />
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
    if (exercise.type === 'memory') {
      return (
        <MemoryGame
          items={exercise.items}
          onComplete={advance}
          onBack={handleBack}
          moduleConfig={moduleConfig}
          progress={progress}
        />
      )
    }
    if (exercise.type === 'recognition') {
      return (
        <RecognitionExercise
          items={exercise.items}
          onComplete={advance}
          onBack={handleBack}
          moduleConfig={moduleConfig}
          progress={progress}
        />
      )
    }
  }

  return null
}

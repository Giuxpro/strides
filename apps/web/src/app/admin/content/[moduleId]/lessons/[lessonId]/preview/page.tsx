import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getModuleConfig } from '@strides/core/kids'
import { LessonEngine, type LessonStep, type ExerciseData, type VocabItem } from '@/components/kids/engine/LessonEngine'
import { VoicePresetProvider } from '@/components/kids/audio/VoicePresetProvider'
import { LessonPreviewFrame } from '@/components/admin/content/LessonPreviewFrame'
import { LessonPreviewControls } from '@/components/admin/content/LessonPreviewControls'
import type { PreviewDevice, PreviewView } from '@/components/admin/content/LessonPreviewControls'

interface Props {
  params: { moduleId: string; lessonId: string }
  searchParams: { device?: string; view?: string; audio?: string; warnings?: string }
}

type RawStep = {
  id: string
  position: number
  step_type: 'video' | 'slide' | 'exercise'
  title: string | null
  config: Record<string, string>
  exercises: {
    id: string
    type: 'memory' | 'recognition' | 'speaking'
    phase: 'practice' | 'evaluation'
    exercise_items: { order: number; vocabulary_items: VocabItem | null }[]
  } | null
}

const INCOMPLETE_BADGE = (
  <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
    ⚠ Sin contenido
  </span>
)

export default async function LessonPreviewPage({ params, searchParams }: Props) {
  const device:   PreviewDevice = (searchParams.device === 'tablet' || searchParams.device === 'desktop') ? searchParams.device : 'mobile'
  const view:     PreviewView   = searchParams.view === 'parent' ? 'parent' : 'kid'
  const audio:    boolean       = searchParams.audio !== '0'
  const warnings: boolean       = searchParams.warnings === '1'

  const supabase = createClient()

  const [{ data: mod }, { data: lesson }] = await Promise.all([
    supabase.from('modules').select('id, title_es, slug').eq('id', params.moduleId).single(),
    supabase.from('lessons').select('id, title_es, title_en').eq('id', params.lessonId).single(),
  ])

  if (!mod || !lesson) notFound()

  const { data: rawSteps } = await supabase
    .from('lesson_steps')
    .select(`
      id, position, step_type, title, config,
      exercises!lesson_steps_exercise_id_fkey(
        id, type, phase,
        exercise_items(order, vocabulary_items(id, text_en, text_es, image_url, emoji_unicode, audio_url))
      )
    `)
    .eq('lesson_id', lesson.id)
    .order('position') as { data: RawStep[] | null }

  const steps = (rawSteps ?? []).flatMap((s): LessonStep[] => {
    if (s.step_type === 'exercise') {
      if (!s.exercises) return []
      const exercise: ExerciseData = {
        id: s.exercises.id,
        type: s.exercises.type,
        phase: s.exercises.phase,
        order: s.position,
        items: (s.exercises.exercise_items ?? [])
          .sort((a, b) => a.order - b.order)
          .map(ei => ei.vocabulary_items)
          .filter((v): v is VocabItem => v !== null),
      }
      return [{ id: s.id, position: s.position, step_type: 'exercise', title: s.title, config: {} as Record<string, never>, exercise }]
    }
    if (s.step_type === 'video') {
      return [{ id: s.id, position: s.position, step_type: 'video', title: s.title, config: s.config as { url: string; caption?: string } }]
    }
    if (s.step_type === 'slide') {
      return [{ id: s.id, position: s.position, step_type: 'slide', title: s.title, config: s.config as { image_url?: string; text_en: string; text_es: string } }]
    }
    return []
  })

  const moduleConfig = getModuleConfig(mod.slug)
  const backHref = `/admin/content/${params.moduleId}/lessons/${params.lessonId}/edit`

  /* ── Vista padre: resumen de pasos ── */
  if (view === 'parent') {
    const ICONS: Record<string, string> = { video: '🎬', slide: '🖼️', exercise: '🎮' }
    const LABELS: Record<string, string> = { video: 'Video', slide: 'Diapositiva', exercise: 'Ejercicio' }

    return (
      <div className="h-screen flex flex-col bg-gray-950">
        <LessonPreviewControls device={device} view={view} audio={audio} warnings={warnings} backHref={backHref} />
        <LessonPreviewFrame device={device}>
          <div className="bg-gray-950 min-h-full p-6 space-y-3 overflow-auto">
            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vista padre · {lesson.title_en}</p>
              <h1 className="text-xl font-bold text-white">{lesson.title_es}</h1>
              <p className="text-sm text-gray-500 mt-1">{steps.length} pasos</p>
            </div>

            {steps.map((step, i) => {
              const isIncomplete =
                (step.step_type === 'slide' && !step.config.text_en) ||
                (step.step_type === 'video' && !step.config.url) ||
                (step.step_type === 'exercise' && step.exercise.items.length === 0)

              return (
                <div key={step.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-2xl shrink-0">{ICONS[step.step_type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase">{LABELS[step.step_type]}</span>
                      <span className="text-xs text-gray-600">· Paso {i + 1}</span>
                      {warnings && isIncomplete && INCOMPLETE_BADGE}
                    </div>
                    {step.title && <p className="text-sm font-medium text-white">{step.title}</p>}
                    {step.step_type === 'slide' && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{step.config.text_en || '—'}</p>
                    )}
                    {step.step_type === 'video' && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{step.config.url || '—'}</p>
                    )}
                    {step.step_type === 'exercise' && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {step.exercise.type} · {step.exercise.phase === 'evaluation' ? 'Evaluación' : 'Práctica'} · {step.exercise.items.length} palabras
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            {steps.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-12">Esta lección no tiene pasos aún.</p>
            )}
          </div>
        </LessonPreviewFrame>
      </div>
    )
  }

  /* ── Vista niño: LessonEngine real ── */
  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <LessonPreviewControls device={device} view={view} audio={audio} warnings={warnings} backHref={backHref} />
      <LessonPreviewFrame device={device}>
        <VoicePresetProvider audioEnabled={audio}>
          <LessonEngine
            lesson={lesson}
            moduleSlug={mod.slug}
            steps={steps}
            moduleConfig={moduleConfig}
            previewMode
          />
        </VoicePresetProvider>
      </LessonPreviewFrame>
    </div>
  )
}

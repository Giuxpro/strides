import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { LessonEngine, type LessonStep, type ExerciseData, type VocabItem } from '@/components/kids/engine/LessonEngine'
import { getModuleConfig, isSpeechProvider, DEFAULT_SPEECH_PROVIDER } from '@strides/core/kids'

interface Props {
  params: Promise<{ moduleSlug: string; lessonSlug: string }>
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
    exercise_items: {
      order: number
      vocabulary_items: VocabItem | null
    }[]
  } | null
}

export default async function LessonPage({ params }: Props) {
  const { moduleSlug, lessonSlug } = await params
  const supabase = createClient()

  const [{ data: lesson }, { data: speechRow }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title_es, title_en')
      .eq('slug', lessonSlug)
      .eq('is_published', true)
      .single(),
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'speech_provider')
      .maybeSingle(),
  ])

  if (!lesson) notFound()

  const speechProvider = isSpeechProvider(speechRow?.value) ? speechRow.value : DEFAULT_SPEECH_PROVIDER

  const { data: rawSteps } = await supabase
    .from('lesson_steps')
    .select(`
      id, position, step_type, title, config,
      exercises!lesson_steps_exercise_id_fkey(
        id, type, phase,
        exercise_items(
          order,
          vocabulary_items(id, text_en, text_es, image_url, audio_url)
        )
      )
    `)
    .eq('lesson_id', lesson.id)
    .order('position') as { data: RawStep[] | null }

  const steps = (rawSteps ?? [])
    .flatMap((s): LessonStep[] => {
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

  return (
    <LessonEngine
      lesson={lesson}
      moduleSlug={moduleSlug}
      steps={steps}
      moduleConfig={getModuleConfig(moduleSlug)}
      speechProvider={speechProvider}
    />
  )
}

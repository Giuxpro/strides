import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { LessonEngine, type LessonStep, type ExerciseData, type VocabItem } from '@/components/kids/engine/LessonEngine'
import { getModuleConfig, isSpeechProvider, DEFAULT_SPEECH_PROVIDER, DEFAULT_EVAL_FORMATS, type EvaluationConfig } from '@strides/core/kids'

interface Props {
  params: Promise<{ moduleSlug: string; lessonSlug: string }>
}

type RawStep = {
  id: string
  position: number
  step_type: string
  title: string | null
  config: Record<string, unknown>
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
  const childId = cookies().get('selected_child_id')?.value

  const [{ data: lesson }, { data: speechRow }, { data: evalRow }, { data: child }] = await Promise.all([
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
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'eval_formats')
      .maybeSingle(),
    childId
      ? supabase.from('children').select('age').eq('id', childId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (!lesson) notFound()

  const speechProvider = isSpeechProvider(speechRow?.value) ? speechRow.value : DEFAULT_SPEECH_PROVIDER
  const childAge = child?.age ?? 6
  const evalFormatsEnabled = (evalRow?.value as Record<string, boolean> | undefined) ?? DEFAULT_EVAL_FORMATS

  const { data: rawSteps } = await supabase
    .from('lesson_steps')
    .select(`
      id, position, step_type, title, config,
      exercises!lesson_steps_exercise_id_fkey(
        id, type, phase,
        exercise_items(
          order,
          vocabulary_items(id, text_en, text_es, image_url, emoji_unicode, audio_url)
        )
      )
    `)
    .eq('lesson_id', lesson.id)
    .order('position') as { data: RawStep[] | null }

  // Vocab de los bloques de evaluación (sus vocabIds viven en el config JSON)
  const evalVocabIds = Array.from(new Set(
    (rawSteps ?? [])
      .filter(s => s.step_type === 'evaluation')
      .flatMap(s => (s.config as unknown as EvaluationConfig).vocabIds ?? [])
  ))
  const { data: evalVocabRows } = evalVocabIds.length
    ? await supabase
        .from('vocabulary_items')
        .select('id, text_en, text_es, image_url, emoji_unicode, audio_url')
        .in('id', evalVocabIds)
    : { data: [] as VocabItem[] }
  const evalVocabMap = new Map((evalVocabRows ?? []).map(v => [v.id, v]))

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
        return [{ id: s.id, position: s.position, step_type: 'video', title: s.title, config: s.config as unknown as { url: string; caption?: string } }]
      }
      if (s.step_type === 'slide') {
        return [{ id: s.id, position: s.position, step_type: 'slide', title: s.title, config: s.config as unknown as { image_url?: string; text_en: string; text_es: string } }]
      }
      if (s.step_type === 'evaluation') {
        const config = s.config as unknown as EvaluationConfig
        const vocab = (config.vocabIds ?? [])
          .map(id => evalVocabMap.get(id))
          .filter((v): v is VocabItem => !!v)
        return [{ id: s.id, position: s.position, step_type: 'evaluation', title: s.title, config, vocab }]
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
      childAge={childAge}
      evalFormatsEnabled={evalFormatsEnabled}
    />
  )
}

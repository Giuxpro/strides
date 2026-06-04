import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateLesson } from '@/app/admin/_actions'
import { LessonStepBuilder } from '@/components/admin/content/LessonStepBuilder'
import { ImageUploadField } from '@/components/admin/shared/ImageUploadField'
import { SubmitButton } from '@/components/admin/shared/SubmitButton'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

interface Props { params: { moduleId: string; lessonId: string } }

type ExerciseUsageRow = {
  lesson_id: string | null
  exercise_items: { vocabulary_item_id: string }[] | null
}

type RawStep = {
  id: string
  position: number
  step_type: 'video' | 'slide' | 'exercise'
  title: string | null
  config: Record<string, string>
  exercises: {
    id: string
    type: string
    phase: 'practice' | 'evaluation'
    exercise_items: { vocabulary_item_id: string }[] | null
  } | null
}

export default async function EditLessonPage({ params }: Props) {
  const supabase = createClient()

  const [{ data: mod }, { data: lesson }, { data: vocab }, { data: exercisesRaw }] = await Promise.all([
    supabase.from('modules').select('id, title_es').eq('id', params.moduleId).single(),
    supabase.from('lessons').select('id, title_es, title_en, slug, order, min_age, cover_url, audio_url').eq('id', params.lessonId).single(),
    supabase.from('vocabulary_items').select('id, text_es, text_en, image_url, emoji_unicode').eq('module_id', params.moduleId).order('order'),
    supabase.from('exercises').select('lesson_id, exercise_items(vocabulary_item_id)').eq('module_id', params.moduleId) as unknown as Promise<{ data: ExerciseUsageRow[] | null }>,
  ])

  if (!mod || !lesson) notFound()

  // Count distinct lessons per vocab item across the whole module
  const lessonCountMap: Record<string, Set<string>> = {}
  for (const ex of exercisesRaw ?? []) {
    if (!ex.lesson_id) continue
    for (const item of ex.exercise_items ?? []) {
      const vid = item.vocabulary_item_id
      if (!lessonCountMap[vid]) lessonCountMap[vid] = new Set()
      lessonCountMap[vid].add(ex.lesson_id)
    }
  }

  const { data: rawSteps } = await supabase
    .from('lesson_steps')
    .select(`
      id, position, step_type, title, config,
      exercises!lesson_steps_exercise_id_fkey(
        id, type, phase,
        exercise_items(vocabulary_item_id)
      )
    `)
    .eq('lesson_id', params.lessonId)
    .order('position') as { data: RawStep[] | null }

  const steps = (rawSteps ?? []).map(s => ({
    id: s.id,
    position: s.position,
    step_type: s.step_type,
    title: s.title,
    config: s.config,
    exercise: s.exercises
      ? {
        id: s.exercises.id,
        type: s.exercises.type,
        phase: s.exercises.phase,
        vocabIds: (s.exercises.exercise_items ?? []).map(ei => ei.vocabulary_item_id),
      }
      : null,
  }))

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <Link
          href={`/admin/content/${params.moduleId}`}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← {mod.title_es}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-xl font-bold text-white">Editar lección</h1>
          <Link
            href={`/admin/content/${params.moduleId}/lessons/${params.lessonId}/preview`}
            className="text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            target="_blank"
          >
            👁 Vista previa
          </Link>
        </div>
      </div>

      {/* Basic info */}
      <form action={updateLesson} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <input type="hidden" name="id" value={lesson.id} />
        <input type="hidden" name="module_id" value={params.moduleId} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={L}>Título en español <span className="text-red-500">*</span></label>
            <input name="title_es" required defaultValue={lesson.title_es} className={I} />
          </div>
          <div>
            <label className={L}>Título en inglés <span className="text-red-500">*</span></label>
            <input name="title_en" required defaultValue={lesson.title_en} className={I} />
          </div>
        </div>

        <div>
          <label className={L}>Slug</label>
          <input
            disabled
            defaultValue={lesson.slug}
            className={`${I} opacity-40 cursor-not-allowed`}
          />
          <p className="text-xs text-gray-700 mt-1">El slug no se puede cambiar para no romper rutas existentes.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={L}>Orden</label>
            <input name="order" type="number" min={1} defaultValue={lesson.order} className={I} />
          </div>
          <div>
            <label className={L}>Edad mínima</label>
            <input name="min_age" type="number" min={4} max={12} defaultValue={lesson.min_age} className={I} />
          </div>
        </div>

        <ImageUploadField
          name="cover_url"
          bucket="lesson-cards"
          defaultValue={lesson.cover_url ?? ''}
          label="Imagen de portada"
        />

        <ImageUploadField
          name="audio_url"
          bucket="lesson-audio"
          defaultValue={lesson.audio_url ?? ''}
          label="Audio de la tarjeta"
          accept="audio/*"
        />

        <div className="flex items-center gap-4 pt-2">
          <SubmitButton label="Guardar cambios" />
          <Link href={`/admin/content/${params.moduleId}`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>

      {/* Step builder */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-300">Estructura de la lección</h2>
          <p className="text-xs text-gray-600 mt-1">
            Define el orden y tipos de pasos que verá el estudiante, o arrastra las tarjetas para reordenarlos.
          </p>
        </div>
        <LessonStepBuilder
          lessonId={params.lessonId}
          moduleId={params.moduleId}
          steps={steps}
          vocabItems={(vocab ?? []).map(v => ({
            ...v,
            lessonCount: lessonCountMap[v.id]?.size ?? 0,
          }))}
        />
      </section>
    </div>
  )
}

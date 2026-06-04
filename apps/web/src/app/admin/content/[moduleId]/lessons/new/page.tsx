import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createLesson } from '@/app/admin/_actions'
import { VocabPicker, type VocabItemWithUsage } from '@/components/admin/content/VocabPicker'
import { ImageUploadField } from '@/components/admin/shared/ImageUploadField'
import { SubmitButton } from '@/components/admin/shared/SubmitButton'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

interface Props { params: { moduleId: string } }

type ExerciseRow = {
  lesson_id: string | null
  exercise_items: { vocabulary_item_id: string }[] | null
}

export default async function NewLessonPage({ params }: Props) {
  const supabase = createClient()

  const [{ data: mod }, { data: lessons }, { data: vocab }, { data: exercisesRaw }] = await Promise.all([
    supabase.from('modules').select('id, title_es').eq('id', params.moduleId).single(),
    supabase.from('lessons').select('order').eq('module_id', params.moduleId).order('order', { ascending: false }).limit(1),
    supabase.from('vocabulary_items').select('id, text_es, text_en, image_url, emoji_unicode').eq('module_id', params.moduleId).order('order'),
    supabase.from('exercises').select('lesson_id, exercise_items(vocabulary_item_id)').eq('module_id', params.moduleId) as unknown as Promise<{ data: ExerciseRow[] | null }>,
  ])

  if (!mod) notFound()

  const nextOrder = (lessons?.[0]?.order ?? 0) + 1

  // Count distinct lessons per vocab item
  const lessonCountMap: Record<string, Set<string>> = {}
  for (const ex of exercisesRaw ?? []) {
    if (!ex.lesson_id) continue
    for (const item of ex.exercise_items ?? []) {
      const vid = item.vocabulary_item_id
      if (!lessonCountMap[vid]) lessonCountMap[vid] = new Set()
      lessonCountMap[vid].add(ex.lesson_id)
    }
  }

  const vocabWithUsage: VocabItemWithUsage[] = (vocab ?? []).map(item => ({
    id: item.id,
    text_es: item.text_es,
    text_en: item.text_en,
    image_url: item.image_url,
    emoji_unicode: item.emoji_unicode,
    lessonCount: lessonCountMap[item.id]?.size ?? 0,
  }))

  return (
    <div className="p-8 max-w-xl">
      <Link href={`/admin/content/${params.moduleId}`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← {mod.title_es}
      </Link>
      <h1 className="text-xl font-bold text-white mt-2 mb-6">Nueva lección</h1>

      <form action={createLesson} className="space-y-5">
        <input type="hidden" name="module_id" value={params.moduleId} />

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={L}>Título en español <span className="text-red-500">*</span></label>
              <input name="title_es" required className={I} placeholder="Animales de granja" />
            </div>
            <div>
              <label className={L}>Título en inglés <span className="text-red-500">*</span></label>
              <input name="title_en" required className={I} placeholder="Farm animals" />
            </div>
          </div>

          <div>
            <label className={L}>Slug <span className="text-red-500">*</span></label>
            <input
              name="slug"
              required
              className={I}
              placeholder="animales-de-granja"
              pattern="[a-z0-9-]+"
              title="Solo letras minúsculas, números y guiones"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={L}>Orden</label>
              <input name="order" type="number" min={1} defaultValue={nextOrder} className={I} />
            </div>
            <div>
              <label className={L}>Edad mínima</label>
              <input name="min_age" type="number" min={4} max={12} defaultValue={4} className={I} />
            </div>
          </div>

          <ImageUploadField
            name="cover_url"
            bucket="lesson-cards"
            defaultValue=""
            label="Imagen de portada"
          />

          <ImageUploadField
            name="audio_url"
            bucket="lesson-audio"
            defaultValue=""
            label="Audio de la tarjeta"
            accept="audio/*"
          />
        </div>

        {/* Vocab selector */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm font-semibold text-gray-300 mb-1">
            Vocabulario de esta lección
          </p>
          <p className="text-xs text-gray-600 mb-4">
            Se crearán automáticamente 1 ejercicio de práctica (memorama) y 1 de evaluación (reconocimiento) con las palabras seleccionadas.
          </p>

          {vocabWithUsage.length > 0 ? (
            <VocabPicker items={vocabWithUsage} />
          ) : (
            <p className="text-sm text-gray-600">
              Este módulo no tiene vocabulario aún.{' '}
              <Link href={`/admin/content/${params.moduleId}/vocab/new`} className="text-violet-400 hover:text-violet-300">
                Añadir vocabulario primero →
              </Link>
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <SubmitButton label="Crear lección" pendingLabel="Creando…" />
          <Link href={`/admin/content/${params.moduleId}`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}

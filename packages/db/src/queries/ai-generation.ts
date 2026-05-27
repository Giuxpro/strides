import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

// Types are defined locally to avoid circular dependency (core → db → core)
interface VocabItemInput {
  text_en: string
  text_es: string
  type: 'word' | 'phrase'
  min_age: 4 | 6
  emoji_unicode?: string
}


interface LessonInput {
  title_en: string
  title_es: string
  vocab: VocabItemInput[]
}

export interface GeneratedModuleInput {
  title_en: string
  title_es: string
  description_es: string
  lessons: LessonInput[]
}

function slugify(text: string, suffix?: string): string {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return suffix ? `${base}-${suffix}` : base
}

export async function insertGeneratedModule(db: DB, data: GeneratedModuleInput): Promise<string> {
  const { count } = await db.from('modules').select('*', { count: 'exact', head: true })

  const { data: mod, error: modErr } = await db
    .from('modules')
    .insert({
      title_en: data.title_en,
      title_es: data.title_es,
      description_es: data.description_es,
      slug: slugify(data.title_en, 'ai'),
      order: (count ?? 0) + 1,
    })
    .select('id')
    .single()

  if (modErr || !mod) throw new Error(`Error creando módulo IA: ${modErr?.message}`)

  for (let i = 0; i < data.lessons.length; i++) {
    const lessonData = data.lessons[i]!
    const lessonOrder = i + 1
    const minAge: 4 | 6 = lessonData.vocab.some(v => v.min_age === 6) ? 6 : 4

    const { data: vocabItems, error: vocabErr } = await db
      .from('vocabulary_items')
      .insert(
        lessonData.vocab.map((v, vi) => ({
          module_id: mod.id,
          text_en: v.text_en,
          text_es: v.text_es,
          type: v.type,
          min_age: v.min_age,
          order: vi + 1,
          emoji_unicode: v.emoji_unicode ?? null,
        })),
      )
      .select('id')

    if (vocabErr || !vocabItems) throw new Error(`Error insertando vocab IA: ${vocabErr?.message}`)

    const { data: lesson, error: lessonErr } = await db
      .from('lessons')
      .insert({
        module_id: mod.id,
        title_en: lessonData.title_en,
        title_es: lessonData.title_es,
        slug: slugify(lessonData.title_en, String(lessonOrder)),
        order: lessonOrder,
        min_age: minAge,
      })
      .select('id')
      .single()

    if (lessonErr || !lesson) throw new Error(`Error insertando lección IA: ${lessonErr?.message}`)

    const { data: exercises, error: exErr } = await db
      .from('exercises')
      .insert([
        { module_id: mod.id, lesson_id: lesson.id, type: 'memory',      phase: 'practice',   order: 1, min_age: minAge },
        { module_id: mod.id, lesson_id: lesson.id, type: 'recognition', phase: 'evaluation', order: 2, min_age: minAge },
      ])
      .select('id')

    if (exErr || !exercises) throw new Error(`Error insertando ejercicios IA: ${exErr?.message}`)

    await db.from('exercise_items').insert(
      exercises.flatMap(ex =>
        vocabItems.map((vi, idx) => ({ exercise_id: ex.id, vocabulary_item_id: vi.id, order: idx + 1 })),
      ),
    )

    await db.from('lesson_steps').insert(
      exercises.map((ex, idx) => ({
        lesson_id: lesson.id,
        position: idx + 1,
        step_type: 'exercise' as const,
        exercise_id: ex.id,
        config: {},
      })),
    )
  }

  return mod.id
}

export async function insertGeneratedVocab(
  db: DB,
  moduleId: string,
  items: VocabItemInput[],
): Promise<void> {
  if (items.length === 0) throw new Error('La IA no devolvió vocabulario. Intenta de nuevo.')

  const { data: maxRow } = await db
    .from('vocabulary_items')
    .select('order')
    .eq('module_id', moduleId)
    .order('order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const startOrder = (maxRow?.order ?? 0) + 1

  const { error } = await db.from('vocabulary_items').insert(
    items.map((v, i) => ({
      module_id: moduleId,
      text_en: v.text_en,
      text_es: v.text_es,
      type: v.type,
      min_age: v.min_age,
      order: startOrder + i,
      emoji_unicode: v.emoji_unicode ?? null,
    })),
  )

  if (error) throw new Error(`Error insertando vocabulario IA: ${error.message}`)
}

export async function insertGeneratedLessons(
  db: DB,
  moduleId: string,
  lessons: LessonInput[],
): Promise<void> {
  if (lessons.length === 0) throw new Error('La IA no devolvió lecciones. Intenta de nuevo.')

  const [{ data: maxLesson }, { data: maxVocab }] = await Promise.all([
    db.from('lessons').select('order').eq('module_id', moduleId)
      .order('order', { ascending: false }).limit(1).maybeSingle(),
    db.from('vocabulary_items').select('order').eq('module_id', moduleId)
      .order('order', { ascending: false }).limit(1).maybeSingle(),
  ])

  let lessonOrder = (maxLesson?.order ?? 0) + 1
  let vocabOrder  = (maxVocab?.order ?? 0) + 1

  for (const lessonData of lessons) {
    const minAge: 4 | 6 = lessonData.vocab.some(v => v.min_age === 6) ? 6 : 4

    const { data: vocabItems, error: vocabErr } = await db
      .from('vocabulary_items')
      .insert(
        lessonData.vocab.map((v, vi) => ({
          module_id: moduleId,
          text_en: v.text_en,
          text_es: v.text_es,
          type: v.type,
          min_age: v.min_age,
          order: vocabOrder + vi,
          emoji_unicode: v.emoji_unicode ?? null,
        })),
      )
      .select('id')

    if (vocabErr || !vocabItems) throw new Error(`Error insertando vocab IA: ${vocabErr?.message}`)

    vocabOrder += lessonData.vocab.length

    const { data: lesson, error: lessonErr } = await db
      .from('lessons')
      .insert({
        module_id: moduleId,
        title_en: lessonData.title_en,
        title_es: lessonData.title_es,
        slug: slugify(lessonData.title_en, String(lessonOrder)),
        order: lessonOrder,
        min_age: minAge,
      })
      .select('id')
      .single()

    if (lessonErr || !lesson) throw new Error(`Error insertando lección IA: ${lessonErr?.message}`)

    lessonOrder++

    const { data: exercises, error: exErr } = await db
      .from('exercises')
      .insert([
        { module_id: moduleId, lesson_id: lesson.id, type: 'memory',      phase: 'practice',   order: 1, min_age: minAge },
        { module_id: moduleId, lesson_id: lesson.id, type: 'recognition', phase: 'evaluation', order: 2, min_age: minAge },
      ])
      .select('id')

    if (exErr || !exercises) throw new Error(`Error insertando ejercicios IA: ${exErr?.message}`)

    await db.from('exercise_items').insert(
      exercises.flatMap(ex =>
        vocabItems.map((vi, idx) => ({ exercise_id: ex.id, vocabulary_item_id: vi.id, order: idx + 1 })),
      ),
    )

    await db.from('lesson_steps').insert(
      exercises.map((ex, idx) => ({
        lesson_id: lesson.id,
        position: idx + 1,
        step_type: 'exercise' as const,
        exercise_id: ex.id,
        config: {},
      })),
    )
  }
}

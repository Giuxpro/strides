import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export function getPublishedLessonsByModule(db: DB, moduleId: string) {
  return db
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .eq('is_published', true)
    .order('order')
}

export function getLessonBySlug(db: DB, slug: string) {
  return db
    .from('lessons')
    .select('id, title_es, title_en')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
}

export function getLessonCountsByModule(db: DB) {
  return db.from('lessons').select('module_id')
}

export function getLessonsAdmin(
  db: DB,
  { moduleId, q, offset, limit }: { moduleId: string; q?: string; offset: number; limit: number },
) {
  let query = db
    .from('lessons')
    .select('id, title_es, title_en, order, is_published, cover_url', { count: 'exact' })
    .eq('module_id', moduleId)
    .order('order')
    .range(offset, offset + limit - 1)

  if (q) query = query.or(`title_es.ilike.%${q}%,title_en.ilike.%${q}%`)
  return query
}

export function getLessonsAdminCount(db: DB, moduleId: string) {
  return db
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('module_id', moduleId)
}

export function getLessonCountsForModules(db: DB, moduleIds: string[]) {
  return db.from('lessons').select('module_id').in('module_id', moduleIds)
}

export function getExercisesForVocabUsage(db: DB, moduleId: string) {
  return db
    .from('exercises')
    .select('lesson_id, lessons(id, title_es), exercise_items(vocabulary_item_id)')
    .eq('module_id', moduleId)
}

export function getLessonStepsWithExercises(db: DB, lessonId: string) {
  return db
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
    .eq('lesson_id', lessonId)
    .order('position')
}

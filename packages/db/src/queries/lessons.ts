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

export function getLessonStepsWithExercises(db: DB, lessonId: string) {
  return db
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
    .eq('lesson_id', lessonId)
    .order('position')
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export function getLessonCompletions(db: DB, childId: string) {
  return db
    .from('child_lesson_completions')
    .select('lesson_id, stars')
    .eq('child_id', childId)
}

export function getEvaluationAttempt(db: DB, childId: string, lessonId: string) {
  return db
    .from('child_evaluation_attempts')
    .select('detail, correct, total, stars, attempts')
    .eq('child_id', childId)
    .eq('lesson_id', lessonId)
    .maybeSingle()
}

export function getVocabMastery(db: DB, childId: string) {
  return db
    .from('child_vocab_mastery')
    .select('vocab_id, correct_count, attempt_count')
    .eq('child_id', childId)
}

// Pool de repaso espaciado: toda palabra que el niño ya practicó (tiene fila en
// mastery) con los datos de la palabra para poder jugarla. El ranking SRS se
// calcula al vuelo en @strides/core/kids (rankReviewWords); aquí solo se trae.
export function getReviewMasteryPool(db: DB, childId: string) {
  return db
    .from('child_vocab_mastery')
    .select(
      'vocab_id, correct_count, attempt_count, updated_at, vocabulary_items!inner(id, text_en, text_es, image_url, emoji_unicode, audio_url, module_id)',
    )
    .eq('child_id', childId)
}

export function getChildStreak(db: DB, childId: string) {
  return db
    .from('child_streaks_status')
    .select('effective_streak')
    .eq('child_id', childId)
    .single()
}

export function getDailyChallenge(db: DB, childId: string, moduleId: string, date: string) {
  return db
    .from('child_daily_challenges')
    .select('id')
    .eq('child_id', childId)
    .eq('module_id', moduleId)
    .eq('date', date)
    .maybeSingle()
}

export function getCountdownAttemptsThisWeek(db: DB, childId: string, moduleId: string, weekStart: string) {
  return db
    .from('child_countdown_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('child_id', childId)
    .eq('module_id', moduleId)
    .gte('attempted_at', weekStart)
}

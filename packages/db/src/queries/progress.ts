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

export function getChildStreak(db: DB, childId: string) {
  return db
    .from('child_streaks')
    .select('current_streak')
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

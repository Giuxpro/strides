'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { WordResult } from '@strides/core/kids'

async function saveVocabMastery(childId: string, wordResults: WordResult[]) {
  if (wordResults.length === 0) return
  const supabase = createClient()
  await Promise.all(
    wordResults.map(({ vocabId, correct }) =>
      supabase.rpc('increment_vocab_mastery', {
        p_child_id: childId,
        p_vocab_id: vocabId,
        p_correct: correct ? 1 : 0,
        p_attempt: 1,
      })
    )
  )
}

export async function recordVocabMastery(childId: string, wordResults: WordResult[]) {
  await saveVocabMastery(childId, wordResults)
}

export async function completeLesson(formData: FormData) {
  const lessonId    = formData.get('lessonId') as string
  const moduleSlug  = formData.get('moduleSlug') as string
  const score       = Number(formData.get('score'))
  const stars       = Math.min(3, Math.max(0, Number(formData.get('stars'))))
  const wordResultsRaw = formData.get('wordResults') as string | null

  const supabase = createClient()
  const selectedChildId = cookies().get('selected_child_id')?.value
  if (!selectedChildId) redirect('/select-profile')

  const { data: existing } = await supabase
    .from('child_lesson_completions')
    .select('stars')
    .eq('child_id', selectedChildId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const [{ error }] = await Promise.all([
    supabase.from('child_lesson_completions').upsert({
      child_id: selectedChildId,
      lesson_id: lessonId,
      score,
      stars: Math.max(stars, existing?.stars ?? 0),
    }, { onConflict: 'child_id,lesson_id' }),
    wordResultsRaw
      ? saveVocabMastery(selectedChildId, JSON.parse(wordResultsRaw) as WordResult[])
      : Promise.resolve(),
  ])

  if (error) throw new Error(`completeLesson: ${error.message}`)

  const prev = existing?.stars ?? 0
  redirect(`/kids/play/${moduleSlug}?anim=${lessonId}:${prev}`)
}

export async function recordCountdownAttempt(childId: string, moduleId: string) {
  const supabase = createClient()
  await supabase
    .from('child_countdown_attempts')
    .insert({ child_id: childId, module_id: moduleId })
}

export async function completeDailyChallenge(
  childId: string,
  moduleId: string,
  date: string,
  stars: number,
) {
  const supabase = createClient()
  await supabase
    .from('child_daily_challenges')
    .upsert(
      { child_id: childId, module_id: moduleId, date, stars },
      { onConflict: 'child_id,module_id,date' },
    )
}

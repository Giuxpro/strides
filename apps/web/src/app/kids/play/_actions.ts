'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { WordResult } from '@strides/core/kids'

async function saveVocabMastery(childId: string, wordResults: WordResult[]) {
  if (wordResults.length === 0) return
  const supabase = createClient()
  await Promise.all(
    wordResults.map(({ vocabId, correct, skillType }) =>
      supabase.rpc('increment_vocab_mastery', {
        p_child_id:   childId,
        p_vocab_id:   vocabId,
        p_correct:    correct ? 1 : 0,
        p_attempt:    1,
        p_skill_type: skillType ?? 'recognition',
      })
    )
  )
}

export async function recordVocabMastery(wordResults: WordResult[]) {
  const childId = cookies().get('selected_child_id')?.value
  if (!childId) return
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
    supabase.rpc('update_child_streak', { p_child_id: selectedChildId }),
    wordResultsRaw
      ? saveVocabMastery(selectedChildId, JSON.parse(wordResultsRaw) as WordResult[])
      : Promise.resolve(),
  ])

  if (error) throw new Error(`completeLesson: ${error.message}`)

  revalidatePath('/kids/play')

  // NPS check for lesson / module triggers
  let showNps = false
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const [{ data: cfgRow }, { data: profile }, { count: ratingsDone }] = await Promise.all([
      supabase.from('settings').select('value').eq('key', 'feedback_prompt_config').maybeSingle(),
      supabase.from('profiles').select('nps_prompted_at').eq('id', user.id).single(),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'rating'),
    ])
    const cfg = cfgRow?.value as { enabled: boolean; trigger: string; games_threshold: number; cooldown_days?: number } | null

    if (cfg?.enabled && (cfg.trigger === 'lesson' || cfg.trigger === 'module') && (ratingsDone ?? 0) === 0) {
      let triggerFired = cfg.trigger === 'lesson'

      if (cfg.trigger === 'module') {
        const { data: mod } = await supabase
          .from('modules')
          .select('id, lessons(id)')
          .eq('slug', moduleSlug)
          .single()
        const lessonIds = ((mod?.lessons as { id: string }[] | null) ?? []).map(l => l.id)
        const { count: done } = await supabase
          .from('child_lesson_completions')
          .select('*', { count: 'exact', head: true })
          .eq('child_id', selectedChildId)
          .in('lesson_id', lessonIds)
        triggerFired = lessonIds.length > 0 && done === lessonIds.length
      }

      if (triggerFired) {
        const cooldownOk = !profile?.nps_prompted_at ||
          (Date.now() - new Date(profile.nps_prompted_at as string).getTime()) / 86400000 >= (cfg.cooldown_days ?? 30)
        if (cooldownOk) {
          await supabase.from('profiles').update({ nps_prompted_at: new Date().toISOString() }).eq('id', user.id)
          showNps = true
        }
      }
    }
  }

  const prev = existing?.stars ?? 0
  redirect(`/kids/play/${moduleSlug}?anim=${lessonId}:${prev}${showNps ? '&nps=1' : ''}`)
}

export async function recordCountdownAttempt(moduleId: string) {
  const childId = cookies().get('selected_child_id')?.value
  if (!childId) return
  const supabase = createClient()
  await supabase
    .from('child_countdown_attempts')
    .insert({ child_id: childId, module_id: moduleId })
}

export async function recordGamePlay(gameId: string, correct: number, total: number): Promise<boolean> {
  const childId = cookies().get('selected_child_id')?.value
  if (!childId) return false
  const supabase = createClient()

  await supabase.from('child_game_plays').insert({ child_id: childId, game_id: gameId, correct, total })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const [{ data: configRow }, { data: profile }, { count }, { count: ratingsDone }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'feedback_prompt_config').maybeSingle(),
    supabase.from('profiles').select('nps_prompted_at').eq('id', user.id).single(),
    supabase.from('child_game_plays').select('*', { count: 'exact', head: true }).eq('child_id', childId),
    supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'rating'),
  ])

  const cfg = configRow?.value as { enabled: boolean; trigger: string; games_threshold: number; cooldown_days?: number } | null
  if (!cfg?.enabled || cfg.trigger !== 'games') return false
  if ((ratingsDone ?? 0) > 0) return false

  const plays = count ?? 0
  const threshold = cfg.games_threshold ?? 10
  if (plays === 0 || plays % threshold !== 0) return false

  if (profile?.nps_prompted_at) {
    const daysSince = (Date.now() - new Date(profile.nps_prompted_at as string).getTime()) / 86400000
    if (daysSince < (cfg.cooldown_days ?? 30)) return false
  }

  await supabase.from('profiles').update({ nps_prompted_at: new Date().toISOString() }).eq('id', user.id)
  return true
}

export async function completeDailyChallenge(
  moduleId: string,
  date: string,
  stars: number,
) {
  const childId = cookies().get('selected_child_id')?.value
  if (!childId) return
  const supabase = createClient()
  await supabase
    .from('child_daily_challenges')
    .upsert(
      { child_id: childId, module_id: moduleId, date, stars },
      { onConflict: 'child_id,module_id,date' },
    )
}

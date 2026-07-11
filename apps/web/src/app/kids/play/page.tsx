import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getChildStreak, getReviewMasteryPool } from '@strides/db'
import { KidsMapScene } from '@/components/kids/map/KidsMapScene'
import { rankReviewWords, type ReviewMasteryRow } from '@strides/core/kids'
import {
  computeProgressiveUnlock,
  type LockConfig,
  type PreviewConfig,
  type ModuleLockState,
} from '@strides/core'

export default async function KidsPlayPage() {
  const supabase = createClient()
  const selectedChildId = cookies().get('selected_child_id')?.value
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: modules },
    { data: child },
    { data: streak },
    { data: profile },
    { data: subscription },
    { data: allLessons },
    { data: childCompletions },
    { data: lockConfigRow },
    { data: previewConfigRow },
    { data: reviewPool },
  ] = await Promise.all([
    supabase.from('modules').select('*').eq('is_published', true).order('order'),
    selectedChildId
      ? supabase.from('children').select('name, avatar_url').eq('id', selectedChildId).single()
      : Promise.resolve({ data: null }),
    selectedChildId
      ? getChildStreak(supabase, selectedChildId)
      : Promise.resolve({ data: null }),
    user
      ? supabase.from('profiles').select('role').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from('subscriptions').select('acquisition_type').eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('lessons').select('id, module_id, order').eq('is_published', true),
    selectedChildId
      ? supabase.from('child_lesson_completions').select('lesson_id').eq('child_id', selectedChildId)
      : Promise.resolve({ data: [] }),
    supabase.from('settings').select('value').eq('key', 'lock_config').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'preview_config').maybeSingle(),
    selectedChildId
      ? getReviewMasteryPool(supabase, selectedChildId)
      : Promise.resolve({ data: [] }),
  ])

  const isAdmin        = profile?.role === 'admin'
  const acquisitionType = subscription?.acquisition_type ?? 'trial'
  const lockConfig     = (lockConfigRow?.value as unknown as LockConfig) ?? { enabled: false, applies_to: [] }
  const previewConfig  = (previewConfigRow?.value as unknown as PreviewConfig) ?? { scope: 'module' as const, lessons_count: 3 }
  const completedIds   = new Set((childCompletions ?? []).map(c => c.lesson_id))
  const shouldLock     = !isAdmin && lockConfig.enabled
  const isPreviewUser  = !isAdmin && acquisitionType === 'preview'
  const sortedModules  = modules ?? []

  const reviewRows: ReviewMasteryRow[] = (reviewPool ?? []).map((r) => ({
    vocabId: r.vocab_id,
    correctCount: r.correct_count,
    attemptCount: r.attempt_count,
    practicedAt: r.updated_at,
    item: {
      id: r.vocabulary_items.id,
      text_en: r.vocabulary_items.text_en,
      text_es: r.vocabulary_items.text_es,
      image_url: r.vocabulary_items.image_url,
      emoji_unicode: r.vocabulary_items.emoji_unicode,
      audio_url: r.vocabulary_items.audio_url,
    },
  }))
  const reviewCount = rankReviewWords(reviewRows, Date.now()).length

  const { unlockedModuleIds } = shouldLock
    ? computeProgressiveUnlock(sortedModules, allLessons ?? [], completedIds)
    : { unlockedModuleIds: new Set(sortedModules.map(m => m.id)) }

  const moduleLockStates: Record<string, ModuleLockState> = {}
  for (let i = 0; i < sortedModules.length; i++) {
    const mod = sortedModules[i]!
    if (!unlockedModuleIds.has(mod.id)) {
      moduleLockStates[mod.id] = 'progress-locked'
    } else if (isPreviewUser && i > 0) {
      moduleLockStates[mod.id] = 'preview-locked'
    }
  }

  return (
    <>
      <KidsMapScene
        modules={sortedModules}
        childName={child?.name ?? null}
        childAvatar={child?.avatar_url ?? '🧒'}
        currentStreak={streak?.effective_streak ?? 0}
        moduleLockStates={moduleLockStates}
        reviewCount={reviewCount}
      />
    </>
  )
}

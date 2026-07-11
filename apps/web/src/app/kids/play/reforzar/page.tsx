import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getReviewMasteryPool } from '@strides/db'
import {
  rankReviewWords,
  buildReviewSession,
  REVIEW_MODULE_CONFIG,
  GAME_REGISTRY,
  isSpeechProvider,
  DEFAULT_SPEECH_PROVIDER,
  type ReviewMasteryRow,
} from '@strides/core/kids'
import { RepasoEngine } from '@/components/kids/engine/RepasoEngine'

export default async function ReforzarPage() {
  const supabase = createClient()
  const selectedChildId = cookies().get('selected_child_id')?.value
  if (!selectedChildId) redirect('/kids/play')

  const [{ data: reviewPool }, { data: speechRow }, { data: adminOnlyRow }, { data: modules }] = await Promise.all([
    getReviewMasteryPool(supabase, selectedChildId),
    supabase.from('settings').select('value').eq('key', 'speech_provider').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'admin_only_games').maybeSingle(),
    supabase.from('modules').select('active_game_ids').eq('is_published', true),
  ])

  const rows: ReviewMasteryRow[] = (reviewPool ?? []).map((r) => ({
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

  const ranked = rankReviewWords(rows, Date.now())

  // Opción B: un juego entra al refuerzo si está activo en al menos un módulo
  // (active_game_ids null = todos activos). buildReviewSession luego descarta los
  // de rol 'literacy' —que no miden vocabulario— y los incompatibles por tamaño.
  const adminOnly = new Set((adminOnlyRow?.value as string[] | null) ?? [])
  let allGamesActive = false
  const activeUnion = new Set<string>()
  for (const m of modules ?? []) {
    const ids = m.active_game_ids as string[] | null
    if (ids === null) { allGamesActive = true; break }
    ids.forEach((id) => activeUnion.add(id))
  }
  const base = allGamesActive ? GAME_REGISTRY.map((g) => g.id) : [...activeUnion]
  const activeGameIds = base.filter((id) => !adminOnly.has(id))
  const steps = buildReviewSession(ranked.map((r) => r.item), activeGameIds, Date.now())

  // Sin sesión posible (nada elegible o ningún juego compatible) → volver al home.
  if (steps.length === 0) redirect('/kids/play')

  const speechProvider = isSpeechProvider(speechRow?.value) ? speechRow.value : DEFAULT_SPEECH_PROVIDER

  return (
    <RepasoEngine steps={steps} moduleConfig={REVIEW_MODULE_CONFIG} speechProvider={speechProvider} />
  )
}

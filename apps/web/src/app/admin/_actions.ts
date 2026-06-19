'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Json } from '@strides/db'
import { getAllSettings, insertGeneratedModule, insertGeneratedVocab, insertGeneratedLessons, logAIUsage } from '@strides/db'
import { GAME_REGISTRY } from '@strides/core/kids'
import { PAYMENT_METHOD_REGISTRY } from '@strides/core/payments'
import { createAIProvider } from '@strides/core/ai'
import { toStoragePath } from '@strides/core'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/kids/play')
  return { supabase, userId: user.id }
}

// ─── Modules ────────────────────────────────────────────────────────────────

export async function toggleModulePublished(moduleId: string, published: boolean) {
  const { supabase } = await requireAdmin()
  await supabase.from('modules').update({ is_published: published }).eq('id', moduleId)
  revalidatePath('/admin/content')
  revalidatePath('/kids/play')
}

export async function reorderModules(orders: { id: string; order: number }[]) {
  const { supabase } = await requireAdmin()
  await Promise.all(
    orders.map(({ id, order }) => supabase.from('modules').update({ order }).eq('id', id))
  )
  revalidatePath('/admin/content')
  revalidatePath('/kids/play')
}

export async function reorderLessons(moduleId: string, orders: { id: string; order: number }[]) {
  const { supabase } = await requireAdmin()
  await Promise.all(
    orders.map(({ id, order }) => supabase.from('lessons').update({ order }).eq('id', id))
  )
  revalidatePath(`/admin/content/${moduleId}`)
}

export async function createModule(formData: FormData) {
  const { supabase } = await requireAdmin()
  const title_es        = formData.get('title_es') as string
  const title_en        = formData.get('title_en') as string
  const slug            = formData.get('slug') as string
  const description_es  = (formData.get('description_es') as string) || null
  const cover_image_url = toStoragePath((formData.get('cover_image_url') as string) || null)
  const audio_url       = toStoragePath((formData.get('audio_url') as string) || null)

  const { count } = await supabase.from('modules').select('*', { count: 'exact', head: true })

  const { data: mod } = await supabase
    .from('modules')
    .insert({ title_es, title_en, slug, description_es, cover_image_url, audio_url, order: (count ?? 0) + 1 })
    .select('id')
    .single()

  revalidatePath('/admin/content')
  redirect(`/admin/content/${mod?.id}`)
}

export async function updateModule(formData: FormData) {
  const { supabase } = await requireAdmin()
  const moduleId      = formData.get('id') as string
  const from          = (formData.get('from') as string) || ''
  const title_es        = formData.get('title_es') as string
  const title_en        = formData.get('title_en') as string
  const description_es  = (formData.get('description_es') as string) || null
  const order           = Number(formData.get('order'))
  const cover_image_url = toStoragePath((formData.get('cover_image_url') as string) || null)
  const audio_url       = toStoragePath((formData.get('audio_url') as string) || null)

  await supabase.from('modules').update({ title_es, title_en, description_es, order, cover_image_url, audio_url }).eq('id', moduleId)

  revalidatePath('/admin/content')
  revalidatePath(`/admin/content/${moduleId}`)
  redirect(from === 'list' ? '/admin/content' : `/admin/content/${moduleId}`)
}

// ─── Lessons ────────────────────────────────────────────────────────────────

export async function toggleLessonPublished(lessonId: string, published: boolean) {
  const { supabase } = await requireAdmin()
  await supabase.from('lessons').update({ is_published: published }).eq('id', lessonId)
  revalidatePath('/admin/content')
}

export async function createLesson(formData: FormData) {
  const { supabase } = await requireAdmin()
  const moduleId  = formData.get('module_id') as string
  const title_es  = formData.get('title_es') as string
  const title_en  = formData.get('title_en') as string
  const slug      = formData.get('slug') as string
  const order     = Number(formData.get('order'))
  const min_age   = Number(formData.get('min_age'))
  const cover_url = toStoragePath((formData.get('cover_url') as string) || null)
  const audio_url = toStoragePath((formData.get('audio_url') as string) || null)
  const vocabIds  = formData.getAll('vocab_ids') as string[]

  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .insert({ module_id: moduleId, title_es, title_en, slug, order, min_age, cover_url, audio_url })
    .select('id')
    .single()

  if (lessonErr || !lesson) throw new Error('Error creando lección')

  const { data: exercises, error: exErr } = await supabase
    .from('exercises')
    .insert([
      { module_id: moduleId, lesson_id: lesson.id, type: 'memory',      phase: 'practice',   order: 1, min_age },
      { module_id: moduleId, lesson_id: lesson.id, type: 'recognition', phase: 'evaluation', order: 2, min_age },
    ])
    .select('id')

  if (exErr || !exercises) throw new Error('Error creando ejercicios')

  if (vocabIds.length > 0) {
    const items = exercises.flatMap(ex =>
      vocabIds.map((vid, i) => ({ exercise_id: ex.id, vocabulary_item_id: vid, order: i + 1 }))
    )
    await supabase.from('exercise_items').insert(items)
  }

  // Create lesson_steps for the auto-generated exercises
  await supabase.from('lesson_steps').insert(
    exercises.map((ex, i) => ({
      lesson_id: lesson.id,
      position: i + 1,
      step_type: 'exercise' as const,
      exercise_id: ex.id,
      config: {},
    }))
  )

  revalidatePath(`/admin/content/${moduleId}`)
  redirect(`/admin/content/${moduleId}`)
}

export async function updateLesson(formData: FormData) {
  const { supabase } = await requireAdmin()
  const lessonId  = formData.get('id') as string
  const moduleId  = formData.get('module_id') as string
  const title_es  = formData.get('title_es') as string
  const title_en  = formData.get('title_en') as string
  const order     = Number(formData.get('order'))
  const min_age   = Number(formData.get('min_age'))
  const cover_url = toStoragePath((formData.get('cover_url') as string) || null)
  const audio_url = toStoragePath((formData.get('audio_url') as string) || null)

  await supabase.from('lessons').update({ title_es, title_en, order, min_age, cover_url, audio_url }).eq('id', lessonId)

  revalidatePath(`/admin/content/${moduleId}`)
  redirect(`/admin/content/${moduleId}`)
}

export async function deleteLesson(formData: FormData) {
  const { supabase } = await requireAdmin()
  const lessonId  = formData.get('lesson_id') as string
  const moduleId  = formData.get('module_id') as string

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id')
    .eq('lesson_id', lessonId)

  if (exercises && exercises.length > 0) {
    const exIds = exercises.map(e => e.id)
    await supabase.from('exercise_items').delete().in('exercise_id', exIds)
    await supabase.from('exercises').delete().in('id', exIds)
  }

  await supabase.from('lessons').delete().eq('id', lessonId)

  revalidatePath(`/admin/content/${moduleId}`)
}

// ─── Lesson Steps ───────────────────────────────────────────────────────────

export async function addLessonStep(formData: FormData) {
  const { supabase } = await requireAdmin()
  const lessonId  = formData.get('lesson_id') as string
  const moduleId  = formData.get('module_id') as string
  const stepType  = formData.get('step_type') as 'video' | 'slide' | 'exercise'
  const title     = (formData.get('title') as string) || null
  const position  = Number(formData.get('position'))

  let config: Record<string, string> = {}
  let exerciseId: string | null = null

  if (stepType === 'video') {
    config = {
      url:     formData.get('url') as string,
      caption: (formData.get('caption') as string) || '',
    }
  } else if (stepType === 'slide') {
    config = {
      text_en:   formData.get('text_en') as string,
      text_es:   formData.get('text_es') as string,
      image_url: toStoragePath((formData.get('image_url') as string) || null) ?? '',
    }
  } else if (stepType === 'exercise') {
    const exType  = formData.get('exercise_type') as 'memory' | 'recognition' | 'speaking'
    const exPhase = formData.get('exercise_phase') as 'practice' | 'evaluation'
    const vocabIds = formData.getAll('vocab_ids') as string[]

    const { data: exercise } = await supabase
      .from('exercises')
      .insert({ module_id: moduleId, lesson_id: lessonId, type: exType, phase: exPhase, order: position, min_age: 4 })
      .select('id')
      .single()

    if (!exercise) throw new Error('Error creando ejercicio')
    exerciseId = exercise.id

    if (vocabIds.length > 0) {
      await supabase.from('exercise_items').insert(
        vocabIds.map((vid, i) => ({ exercise_id: exercise.id, vocabulary_item_id: vid, order: i + 1 }))
      )
    }
  }

  await supabase.from('lesson_steps').insert({
    lesson_id: lessonId, position, step_type: stepType, title, config, exercise_id: exerciseId,
  })

  revalidatePath(`/admin/content/${moduleId}/lessons/${lessonId}/edit`)
  revalidatePath(`/admin/content/${moduleId}`)
}

export async function updateLessonStep(formData: FormData) {
  const { supabase } = await requireAdmin()
  const stepId   = formData.get('step_id') as string
  const lessonId = formData.get('lesson_id') as string
  const moduleId = formData.get('module_id') as string
  const stepType = formData.get('step_type') as 'video' | 'slide' | 'exercise'
  const title    = (formData.get('title') as string) || null

  if (stepType === 'video') {
    await supabase.from('lesson_steps').update({
      title,
      config: {
        url:     formData.get('url') as string,
        caption: (formData.get('caption') as string) || '',
      },
    }).eq('id', stepId)
  } else if (stepType === 'slide') {
    await supabase.from('lesson_steps').update({
      title,
      config: {
        text_en:   formData.get('text_en') as string,
        text_es:   formData.get('text_es') as string,
        image_url: toStoragePath((formData.get('image_url') as string) || null) ?? '',
      },
    }).eq('id', stepId)
  } else if (stepType === 'exercise') {
    const exerciseId = formData.get('exercise_id') as string
    const exType     = formData.get('exercise_type') as 'memory' | 'recognition' | 'speaking'
    const exPhase    = formData.get('exercise_phase') as 'practice' | 'evaluation'
    const vocabIds   = formData.getAll('vocab_ids') as string[]

    await Promise.all([
      supabase.from('lesson_steps').update({ title }).eq('id', stepId),
      supabase.from('exercises').update({ type: exType, phase: exPhase }).eq('id', exerciseId),
    ])
    await supabase.from('exercise_items').delete().eq('exercise_id', exerciseId)
    if (vocabIds.length > 0) {
      await supabase.from('exercise_items').insert(
        vocabIds.map((vid, i) => ({ exercise_id: exerciseId, vocabulary_item_id: vid, order: i + 1 }))
      )
    }
  }

  revalidatePath(`/admin/content/${moduleId}/lessons/${lessonId}/edit`)
  revalidatePath(`/admin/content/${moduleId}`)
}

export async function deleteLessonStep(formData: FormData) {
  const { supabase } = await requireAdmin()
  const stepId   = formData.get('step_id') as string
  const lessonId = formData.get('lesson_id') as string
  const moduleId = formData.get('module_id') as string

  const { data: step } = await supabase
    .from('lesson_steps')
    .select('exercise_id, step_type')
    .eq('id', stepId)
    .single()

  await supabase.from('lesson_steps').delete().eq('id', stepId)

  if (step?.exercise_id && step.step_type === 'exercise') {
    await supabase.from('exercise_items').delete().eq('exercise_id', step.exercise_id)
    await supabase.from('exercises').delete().eq('id', step.exercise_id)
  }

  revalidatePath(`/admin/content/${moduleId}/lessons/${lessonId}/edit`)
  revalidatePath(`/admin/content/${moduleId}`)
}

export async function reorderLessonSteps(
  lessonId: string,
  moduleId: string,
  orders: { id: string; position: number }[]
) {
  const { supabase } = await requireAdmin()

  await Promise.all(
    orders.map(({ id, position }) =>
      supabase.from('lesson_steps').update({ position }).eq('id', id).eq('lesson_id', lessonId)
    )
  )

  revalidatePath(`/admin/content/${moduleId}/lessons/${lessonId}/edit`)
}

// ─── Vocabulary ──────────────────────────────────────────────────────────────

export async function createVocabItem(formData: FormData) {
  const { supabase } = await requireAdmin()
  const moduleId  = formData.get('module_id') as string
  const text_es   = formData.get('text_es') as string
  const text_en   = formData.get('text_en') as string
  const image_url = toStoragePath((formData.get('image_url') as string) || null)
  const audio_url = toStoragePath((formData.get('audio_url') as string) || null)
  const type      = formData.get('type') as 'word' | 'phrase'
  const min_age   = Number(formData.get('min_age'))

  const { count } = await supabase
    .from('vocabulary_items')
    .select('*', { count: 'exact', head: true })
    .eq('module_id', moduleId)

  await supabase.from('vocabulary_items').insert({
    module_id: moduleId, text_es, text_en, image_url, audio_url, type, min_age,
    order: (count ?? 0) + 1,
  })

  revalidatePath(`/admin/content/${moduleId}`)
  redirect(`/admin/content/${moduleId}`)
}

export async function updateVocabItem(formData: FormData) {
  await requireAdmin()
  const admin     = createAdminClient()
  const itemId    = formData.get('id') as string
  const moduleId  = formData.get('module_id') as string
  const text_es   = formData.get('text_es') as string
  const text_en   = formData.get('text_en') as string
  const image_url = toStoragePath((formData.get('image_url') as string) || null)
  const audio_url = toStoragePath((formData.get('audio_url') as string) || null)
  const type      = formData.get('type') as 'word' | 'phrase'
  const min_age   = Number(formData.get('min_age'))

  const { error } = await admin.from('vocabulary_items')
    .update({ text_es, text_en, image_url, audio_url, type, min_age })
    .eq('id', itemId)

  if (error) throw new Error(`Error actualizando vocabulario: ${error.message}`)

  revalidatePath(`/admin/content/${moduleId}`)
  redirect(`/admin/content/${moduleId}`)
}

export async function deleteVocabItem(formData: FormData) {
  await requireAdmin()
  const admin    = createAdminClient()
  const itemId   = formData.get('item_id') as string
  const moduleId = formData.get('module_id') as string

  await admin.from('child_vocab_mastery').delete().eq('vocab_id', itemId)
  await admin.from('child_word_status').delete().eq('vocabulary_item_id', itemId)
  await admin.from('exercise_items').delete().eq('vocabulary_item_id', itemId)

  const { error } = await admin.from('vocabulary_items').delete().eq('id', itemId)
  if (error) throw new Error(`Error eliminando vocabulario: ${error.message}`)

  revalidatePath(`/admin/content/${moduleId}`)
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function updateSettings(formData: FormData) {
  const { supabase, userId } = await requireAdmin()

  const entries: Array<{ key: string; value: Json }> = [
    { key: 'ai_provider',     value: formData.get('ai_provider') as string },
    { key: 'ai_model',        value: formData.get('ai_model') as string },
    { key: 'speech_provider', value: formData.get('speech_provider') as string },
    { key: 'onboarding_flow', value: formData.get('onboarding_flow') as string },
    { key: 'landing_variant',  value: formData.get('landing_variant') as string },
    { key: 'trial_days',       value: Number(formData.get('trial_days')) },
    { key: 'monthly_price',       value: Number(formData.get('monthly_price')) || null },
    { key: 'annual_discount_pct', value: Number(formData.get('annual_discount_pct')) || null },
    { key: 'price_currency',      value: formData.get('price_currency') === 'USD' ? 'USD' : 'PEN' },
    { key: 'payment_methods', value: Object.fromEntries(
        // Un método no implementado nunca puede quedar activo, aunque llegue el campo.
        PAYMENT_METHOD_REGISTRY.map(m => [m.id, m.implemented && formData.get(`pm_${m.id}`) === 'on'])
      ) as Json },
    { key: 'preview_config', value: {
        scope:         (formData.get('preview_scope') as string) || 'module',
        lessons_count: Number(formData.get('preview_lessons_count')) || 3,
      } as Json },
    { key: 'lock_config', value: {
        enabled: formData.get('lock_enabled') === 'true',
      } as Json },
    { key: 'global_discount',  value: {
        enabled:         formData.get('global_discount_enabled') === 'true',
        percent:         Number(formData.get('global_discount_percent')) || 0,
        label:           (formData.get('global_discount_label') as string) || '',
        duration_months: formData.get('global_discount_duration') ? Number(formData.get('global_discount_duration')) : null,
      } as Json },
    { key: 'voice_preset',    value: formData.get('voice_preset') as string },
    { key: 'available_modifiers', value: {
        timer: formData.get('modifier_timer') === 'on',
        lives: formData.get('modifier_lives') === 'on',
      } as Json },
    { key: 'feedback_prompt_config', value: {
        enabled:         formData.get('nps_enabled') === 'true',
        trigger:         (formData.get('nps_trigger') as string) || 'lesson',
        games_threshold: Number(formData.get('nps_games_threshold')) || 10,
        cooldown_days:   Number(formData.get('nps_cooldown_days')) || 30,
      } as Json },
    { key: 'game_configs', value: Object.fromEntries(
        GAME_REGISTRY.map(g => [g.id, {
          minItems: Number(formData.get(`min_${g.id}`)),
          maxItems: Number(formData.get(`max_${g.id}`)),
        }])
      ) as Json },
    { key: 'admin_only_games', value: GAME_REGISTRY
        .filter(g => formData.get(`admin_only_${g.id}`) === 'on')
        .map(g => g.id) as Json },
  ]

  // Actualizar volúmenes sin pisar tracks ni click_sound_url existentes
  const { data: audioRow } = await supabase.from('settings').select('value').eq('key', 'audio_config').maybeSingle()
  const currentAudio = (audioRow?.value ?? { navigation_tracks: [], game_tracks: [], volume: 0.3 }) as Record<string, unknown>
  entries.push({
    key: 'audio_config',
    value: {
      ...currentAudio,
      volume:        Math.min(1, Math.max(0, Number(formData.get('audio_volume') ?? 0.3))),
      click_volume:  Math.min(1, Math.max(0, Number(formData.get('click_volume') ?? currentAudio['click_volume'] ?? currentAudio['volume'] ?? 0.3))),
    } as Json,
  })

  await Promise.all(
    entries.map(({ key, value }) =>
      supabase.from('settings').upsert({ key, value, updated_by: userId })
    )
  )

  revalidatePath('/admin/settings')
}

// ─── Audio Config ─────────────────────────────────────────────────────────────

async function rebuildAudioConfigFromBucket(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  currentConfig: Record<string, unknown>,
) {
  const [{ data: navFiles }, { data: gameFiles }] = await Promise.all([
    supabase.storage.from('background-music').list('navigation'),
    supabase.storage.from('background-music').list('game'),
  ])
  const navPaths  = (navFiles  ?? []).map(f => `background-music/navigation/${f.name}`)
  const gamePaths = (gameFiles ?? []).map(f => `background-music/game/${f.name}`)
  await supabase.from('settings').upsert({
    key: 'audio_config',
    value: { ...currentConfig, navigation_tracks: navPaths, game_tracks: gamePaths } as Json,
    updated_by: userId,
  })
}

export async function uploadMusicTrack(formData: FormData) {
  const { supabase, userId } = await requireAdmin()
  const file    = formData.get('file') as File
  const context = formData.get('context') as 'navigation' | 'game'

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${context}/${safeName}`

  const { error: upErr } = await supabase.storage
    .from('background-music')
    .upload(filename, file, { contentType: file.type, upsert: true })

  if (upErr) throw new Error(upErr.message)

  const { data: row } = await supabase.from('settings').select('value').eq('key', 'audio_config').maybeSingle()
  const current = (row?.value as Record<string, unknown> | null) ?? { volume: 0.3 }

  await rebuildAudioConfigFromBucket(supabase, userId, current)
  revalidatePath('/admin/settings')
}

export async function removeMusicTrack(storagePath: string) {
  const { supabase, userId } = await requireAdmin()

  // storagePath is relative like "background-music/navigation/file.mp3"
  const bucketPath = storagePath.replace(/^background-music\//, '')
  await supabase.storage.from('background-music').remove([bucketPath])

  const { data: row } = await supabase.from('settings').select('value').eq('key', 'audio_config').maybeSingle()
  const current = (row?.value as Record<string, unknown> | null) ?? { volume: 0.3 }

  await rebuildAudioConfigFromBucket(supabase, userId, current)
  revalidatePath('/admin/settings')
}

export async function uploadClickSound(formData: FormData) {
  const { supabase, userId } = await requireAdmin()
  const adminClient = createAdminClient()
  const file = formData.get('file') as File

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  // Service role bypasses storage RLS — necesario porque ui/ no tiene política configurada
  const { error } = await adminClient.storage
    .from('background-music')
    .upload(`ui/${safeName}`, file, { contentType: file.type, upsert: true })

  if (error) throw new Error(error.message)

  const { data: row } = await supabase.from('settings').select('value').eq('key', 'audio_config').maybeSingle()
  const current = (row?.value as Record<string, unknown> | null) ?? { volume: 0.3 }

  await supabase.from('settings').upsert({
    key: 'audio_config',
    value: { ...current, click_sound_url: `background-music/ui/${safeName}` } as Json,
    updated_by: userId,
  })
  revalidatePath('/admin/settings')
}

export async function removeClickSound() {
  const { supabase, userId } = await requireAdmin()
  const adminClient = createAdminClient()
  const { data: row } = await supabase.from('settings').select('value').eq('key', 'audio_config').maybeSingle()
  const current = (row?.value as Record<string, unknown> | null) ?? { volume: 0.3 }

  if (current['click_sound_url']) {
    const bucketPath = (current['click_sound_url'] as string).replace(/^background-music\//, '')
    await adminClient.storage.from('background-music').remove([bucketPath])
  }

  await supabase.from('settings').upsert({
    key: 'audio_config',
    value: { ...current, click_sound_url: null } as Json,
    updated_by: userId,
  })
  revalidatePath('/admin/settings')
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export async function updateFeedbackStatus(id: string, status: string) {
  const { supabase } = await requireAdmin()
  await supabase.from('feedback').update({ status }).eq('id', id)
  revalidatePath('/admin/feedback')
}

// ─── Module Reto Config ──────────────────────────────────────────────────────

export async function updateModuleRetoConfig(formData: FormData) {
  const { supabase } = await requireAdmin()
  const moduleId = formData.get('module_id') as string

  const gameId = formData.get('reto_game_id') as string
  const reto_game_id = gameId === 'auto' ? null : gameId

  const modifiers: Json[] = []
  if (formData.get('timer_enabled') === 'on') {
    modifiers.push({ type: 'timer', seconds: Number(formData.get('timer_seconds')) })
  }
  if (formData.get('lives_enabled') === 'on') {
    modifiers.push({ type: 'lives', count: Number(formData.get('lives_count')) })
  }
  const diarioRaw = formData.get('diario_game_id') as string
  const diario_game_id = diarioRaw === 'auto' ? null : diarioRaw

  const retoPayload = {
    reto_game_id,
    reto_modifiers: modifiers.length > 0 ? modifiers : null,
    diario_game_id,
  }
  await supabase.from('modules').update(retoPayload).eq('id', moduleId)

  revalidatePath(`/admin/content/${moduleId}`)
}

// ─── AI Content Generation ───────────────────────────────────────────────────

export async function generateAIContent(formData: FormData) {
  const { supabase } = await requireAdmin()

  const mode     = formData.get('mode') as 'full-module' | 'lessons-vocab' | 'vocab-only'
  const topic    = formData.get('topic') as string
  const ageRange = formData.get('age_range') as '4-5' | '6-7'
  const style    = (formData.get('style') as string) || undefined

  const { data: settingsRows } = await getAllSettings(supabase)
  const settings = Object.fromEntries(
    (settingsRows ?? []).map(r => [r.key, r.value != null ? String(r.value) : '']),
  )

  const provider = settings['ai_provider'] ?? 'openai'
  const model    = settings['ai_model']    ?? 'gpt-4o-mini'

  const aiProvider = createAIProvider(provider, model, {
    openai:    process.env.OPENAI_API_KEY,
    google:    process.env.GEMINI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    groq:      process.env.GROQ_API_KEY,
  })

  if (mode === 'full-module') {
    const lessonCount    = Math.max(1, Math.min(5,  Number(formData.get('lesson_count'))    || 3))
    const vocabPerLesson = Math.max(4, Math.min(15, Number(formData.get('vocab_per_lesson')) || 8))

    const result = await aiProvider.generateModule({ topic, ageRange, lessonCount, vocabPerLesson, style })

    const moduleId = await insertGeneratedModule(supabase, {
      ...result.module,
      lessons: result.lessons,
    })

    await logAIUsage(createAdminClient(), {
      provider,
      model,
      inputTokens:  result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    })

    revalidatePath('/admin/content')
    redirect(`/admin/content/${moduleId}`)
  }

  if (mode === 'lessons-vocab') {
    const lessonCount    = Math.max(1, Math.min(5,  Number(formData.get('lesson_count'))    || 3))
    const vocabPerLesson = Math.max(4, Math.min(15, Number(formData.get('vocab_per_lesson')) || 8))
    const moduleId       = formData.get('module_id') as string

    const { data: existing } = await supabase
      .from('vocabulary_items').select('text_en').eq('module_id', moduleId)
    const existingVocab = (existing ?? []).map(v => v.text_en)

    const result = await aiProvider.generateModule({ topic, ageRange, lessonCount, vocabPerLesson, style, existingVocab })

    await insertGeneratedLessons(supabase, moduleId, result.lessons)

    await logAIUsage(createAdminClient(), {
      provider,
      model,
      inputTokens:  result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    })

    revalidatePath(`/admin/content/${moduleId}`)
    redirect(`/admin/content/${moduleId}?tab=lessons`)
  }

  const moduleId  = formData.get('module_id') as string
  const wordCount = Math.max(1, Math.min(30, Number(formData.get('word_count')) || 10))

  const { data: existing } = await supabase
    .from('vocabulary_items').select('text_en').eq('module_id', moduleId)
  const existingVocab = (existing ?? []).map(v => v.text_en)

  const result = await aiProvider.generateContent({ topic, ageRange, wordCount, style, existingVocab })

  await insertGeneratedVocab(supabase, moduleId, result.vocabularyItems)

  await logAIUsage(createAdminClient(), {
    provider,
    model,
    inputTokens:  result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  })

  revalidatePath(`/admin/content/${moduleId}`)
  redirect(`/admin/content/${moduleId}`)
}

// ─── Module Jugar Config ──────────────────────────────────────────────────────

export async function updateModuleJugarConfig(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin()
  const moduleId = formData.get('module_id') as string
  const checked = formData.getAll('active_game_id') as string[]
  const active_game_ids: Json = checked.length > 0 ? checked : null
  await supabase.from('modules').update({ active_game_ids }).eq('id', moduleId)
  revalidatePath(`/admin/content/${moduleId}`)
}

'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Json } from '@strides/db'

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

export async function createModule(formData: FormData) {
  const { supabase } = await requireAdmin()
  const title_es      = formData.get('title_es') as string
  const title_en      = formData.get('title_en') as string
  const slug          = formData.get('slug') as string
  const description_es = (formData.get('description_es') as string) || null

  const { count } = await supabase.from('modules').select('*', { count: 'exact', head: true })

  const { data: mod } = await supabase
    .from('modules')
    .insert({ title_es, title_en, slug, description_es, order: (count ?? 0) + 1 })
    .select('id')
    .single()

  revalidatePath('/admin/content')
  redirect(`/admin/content/${mod?.id}`)
}

export async function updateModule(formData: FormData) {
  const { supabase } = await requireAdmin()
  const moduleId      = formData.get('id') as string
  const title_es      = formData.get('title_es') as string
  const title_en      = formData.get('title_en') as string
  const description_es = (formData.get('description_es') as string) || null
  const order         = Number(formData.get('order'))

  await supabase.from('modules').update({ title_es, title_en, description_es, order }).eq('id', moduleId)

  revalidatePath('/admin/content')
  revalidatePath(`/admin/content/${moduleId}`)
  redirect(`/admin/content/${moduleId}`)
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
  const vocabIds  = formData.getAll('vocab_ids') as string[]

  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .insert({ module_id: moduleId, title_es, title_en, slug, order, min_age })
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
  const cover_url = (formData.get('cover_url') as string) || null
  const audio_url = (formData.get('audio_url') as string) || null

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
  redirect(`/admin/content/${moduleId}`)
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
      image_url: (formData.get('image_url') as string) || '',
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
        image_url: (formData.get('image_url') as string) || '',
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
  const image_url = (formData.get('image_url') as string) || null
  const audio_url = (formData.get('audio_url') as string) || null
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
  const { supabase } = await requireAdmin()
  const itemId    = formData.get('id') as string
  const moduleId  = formData.get('module_id') as string
  const text_es   = formData.get('text_es') as string
  const text_en   = formData.get('text_en') as string
  const image_url = (formData.get('image_url') as string) || null
  const audio_url = (formData.get('audio_url') as string) || null
  const type      = formData.get('type') as 'word' | 'phrase'
  const min_age   = Number(formData.get('min_age'))

  await supabase.from('vocabulary_items')
    .update({ text_es, text_en, image_url, audio_url, type, min_age })
    .eq('id', itemId)

  revalidatePath(`/admin/content/${moduleId}`)
  redirect(`/admin/content/${moduleId}`)
}

export async function deleteVocabItem(formData: FormData) {
  const { supabase } = await requireAdmin()
  const itemId    = formData.get('item_id') as string
  const moduleId  = formData.get('module_id') as string

  await supabase.from('exercise_items').delete().eq('vocabulary_item_id', itemId)
  await supabase.from('vocabulary_items').delete().eq('id', itemId)

  revalidatePath(`/admin/content/${moduleId}`)
  redirect(`/admin/content/${moduleId}`)
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function updateSettings(formData: FormData) {
  const { supabase, userId } = await requireAdmin()

  const entries: Array<{ key: string; value: Json }> = [
    { key: 'ai_provider',     value: formData.get('ai_provider') as string },
    { key: 'ai_model',        value: formData.get('ai_model') as string },
    { key: 'onboarding_flow', value: formData.get('onboarding_flow') as string },
    { key: 'trial_days',      value: Number(formData.get('trial_days')) },
  ]

  await Promise.all(
    entries.map(({ key, value }) =>
      supabase.from('settings').upsert({ key, value, updated_by: userId })
    )
  )

  revalidatePath('/admin/settings')
}

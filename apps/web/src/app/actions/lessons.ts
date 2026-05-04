'use server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function completeLesson(formData: FormData) {
  const lessonId = formData.get('lessonId') as string
  const moduleSlug = formData.get('moduleSlug') as string
  const score = Number(formData.get('score'))
  const stars = Math.min(3, Math.max(0, Number(formData.get('stars'))))

  const supabase = createClient()
  const selectedChildId = cookies().get('selected_child_id')?.value
  if (!selectedChildId) redirect('/select-profile')

  const { data: existing } = await supabase
    .from('child_lesson_completions')
    .select('stars')
    .eq('child_id', selectedChildId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const { error } = await supabase
    .from('child_lesson_completions')
    .upsert({
      child_id: selectedChildId,
      lesson_id: lessonId,
      score,
      stars: Math.max(stars, existing?.stars ?? 0),
    }, { onConflict: 'child_id,lesson_id' })

  if (error) throw new Error(`completeLesson: ${error.message}`)

  // Pasamos las estrellas anteriores para que el módulo sepa cuáles animar
  const prev = existing?.stars ?? 0
  redirect(`/kids/play/${moduleSlug}?anim=${lessonId}:${prev}`)
}

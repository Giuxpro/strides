'use server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function completeLesson(formData: FormData) {
  const lessonId = formData.get('lessonId') as string
  const moduleSlug = formData.get('moduleSlug') as string
  const passed = formData.get('passed') === 'true'
  const score = Number(formData.get('score'))

  const supabase = createClient()
  const selectedChildId = cookies().get('selected_child_id')?.value
  if (!selectedChildId) redirect('/select-profile')

  await supabase.from('child_lesson_completions').insert({
    child_id: selectedChildId,
    lesson_id: lessonId,
    passed,
    score,
  })

  redirect(`/kids/play/${moduleSlug}`)
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Data } from '@measured/puck'
import type { Json } from '@strides/db'

export async function createOnboardingScreen(formData: FormData) {
  const supabase = createClient()
  const slug  = formData.get('slug')  as string
  const title = formData.get('title') as string
  const flow  = formData.get('flow')  as string

  const { data, error } = await supabase
    .from('onboarding_screens')
    .insert({ slug, title, flow, content: { content: [], root: { props: {} } } })
    .select('id')
    .single()

  if (error) throw error
  redirect(`/admin/onboarding/${data.id}/edit`)
}

export async function saveOnboardingScreen(id: string, puckData: Data) {
  const supabase = createClient()
  await supabase
    .from('onboarding_screens')
    .update({ content: puckData as unknown as Json, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/onboarding')
}

export async function toggleOnboardingPublished(id: string, published: boolean) {
  const supabase = createClient()
  await supabase
    .from('onboarding_screens')
    .update({ is_published: published })
    .eq('id', id)
  revalidatePath('/admin/onboarding')
}

export async function deleteOnboardingScreen(formData: FormData) {
  const supabase = createClient()
  const id = formData.get('id') as string
  await supabase.from('onboarding_screens').delete().eq('id', id)
  revalidatePath('/admin/onboarding')
}

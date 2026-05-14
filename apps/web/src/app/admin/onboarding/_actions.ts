'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Data } from '@measured/puck'
import type { Json } from '@strides/db'

// ── Flujos ─────────────────────────────────────────────────────────────────

export async function createOnboardingFlow(formData: FormData) {
  const supabase = createClient()
  const name        = formData.get('name')        as string
  const description = formData.get('description') as string

  const { data, error } = await supabase
    .from('onboarding_flows')
    .insert({ name, description: description || null })
    .select('id')
    .single()

  if (error) throw error
  revalidatePath('/admin/onboarding')
  redirect(`/admin/onboarding/${data.id}`)
}

export async function updateOnboardingFlow(id: string, formData: FormData) {
  const supabase = createClient()
  await supabase
    .from('onboarding_flows')
    .update({
      name:        formData.get('name')        as string,
      description: (formData.get('description') as string) || null,
    })
    .eq('id', id)
  revalidatePath('/admin/onboarding')
  revalidatePath(`/admin/onboarding/${id}`)
}

export async function deleteOnboardingFlow(formData: FormData) {
  const supabase = createClient()
  const id = formData.get('id') as string
  await supabase.from('onboarding_flows').delete().eq('id', id)
  revalidatePath('/admin/onboarding')
  redirect('/admin/onboarding')
}

// ── Pantallas ──────────────────────────────────────────────────────────────

export async function createOnboardingScreen(formData: FormData) {
  const supabase  = createClient()
  const slug      = formData.get('slug')    as string
  const title     = formData.get('title')   as string
  const flowId    = formData.get('flow_id') as string
  const order     = parseInt(formData.get('order') as string) || 0

  const { data, error } = await supabase
    .from('onboarding_screens')
    .insert({
      slug,
      title,
      flow_id: flowId || null,
      order,
      content: { content: [], root: { props: {} } },
    })
    .select('id')
    .single()

  if (error) throw error
  revalidatePath(`/admin/onboarding/${flowId}`)
  redirect(`/admin/onboarding/${flowId}/screens/${data.id}/edit`)
}

export async function updateOnboardingMeta(id: string, formData: FormData) {
  const supabase = createClient()
  await supabase
    .from('onboarding_screens')
    .update({
      title: formData.get('title') as string,
      order: parseInt(formData.get('order') as string) || 0,
    })
    .eq('id', id)
  revalidatePath('/admin/onboarding')
}

export async function saveOnboardingScreen(id: string, puckData: Data) {
  const supabase = createClient()
  await supabase
    .from('onboarding_screens')
    .update({ content: puckData as unknown as Json, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function toggleOnboardingPublished(id: string, published: boolean) {
  const supabase = createClient()
  const { data: screen } = await supabase
    .from('onboarding_screens')
    .select('flow_id')
    .eq('id', id)
    .single()

  await supabase
    .from('onboarding_screens')
    .update({ is_published: published })
    .eq('id', id)

  revalidatePath('/admin/onboarding')
  if (screen?.flow_id) revalidatePath(`/admin/onboarding/${screen.flow_id}`)
}

export async function deleteOnboardingScreen(formData: FormData) {
  const supabase = createClient()
  const id = formData.get('id') as string

  const { data: screen } = await supabase
    .from('onboarding_screens')
    .select('flow_id')
    .eq('id', id)
    .single()

  await supabase.from('onboarding_screens').delete().eq('id', id)

  revalidatePath('/admin/onboarding')
  if (screen?.flow_id) revalidatePath(`/admin/onboarding/${screen.flow_id}`)
}

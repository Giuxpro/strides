'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { toStoragePath } from '@strides/core'

export async function selectChild(childId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .maybeSingle()

  if (!child) redirect('/select-profile')

  cookies().set('selected_child_id', childId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })
  redirect('/kids/play')
}

export async function selectSelf() {
  cookies().delete('selected_child_id')
  redirect('/adult')
}

export async function createChildSetup(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('children')
    .insert({
      parent_id: user.id,
      name: formData.get('name') as string,
      age: parseInt(formData.get('age') as string),
      avatar_url: toStoragePath((formData.get('avatar_url') as string) || null),
    })

  if (error) throw new Error(error.message)
  redirect('/setup/plan')
}

export async function createChild(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('children')
    .insert({
      parent_id: user.id,
      name: formData.get('name') as string,
      age: parseInt(formData.get('age') as string),
      avatar_url: toStoragePath((formData.get('avatar_url') as string) || null),
    })

  if (error) throw new Error(error.message)
  redirect('/select-profile')
}

export async function updateChild(childId: string, formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('children')
    .update({
      name: formData.get('name') as string,
      age: parseInt(formData.get('age') as string),
      avatar_url: toStoragePath((formData.get('avatar_url') as string) || null),
    })
    .eq('id', childId)
    .eq('parent_id', user.id)

  if (error) throw new Error(error.message)
  redirect('/select-profile')
}

export async function deleteChild(childId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('children')
    .delete()
    .eq('id', childId)
    .eq('parent_id', user.id)

  redirect('/select-profile')
}

export async function redeemAccessCode(
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const code = (formData.get('code') as string).trim().toUpperCase()
  if (!code) return { error: 'Ingresa un código' }

  const { data: accessCode } = await supabase
    .from('access_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (!accessCode)                                                          return { error: 'Código no válido' }
  if (!accessCode.is_active)                                                return { error: 'Este código no está activo' }
  if (accessCode.valid_until && new Date(accessCode.valid_until) < new Date()) return { error: 'Este código ha expirado' }
  if (accessCode.max_uses !== null && accessCode.used_count >= accessCode.max_uses) return { error: 'Este código ya no tiene usos disponibles' }

  const { data: existing } = await supabase
    .from('code_redemptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('code_id', accessCode.id)
    .maybeSingle()
  if (existing) return { error: 'Ya canjeaste este código' }

  // Construir efecto
  const effect: Record<string, unknown> = {}
  if (accessCode.access_type === 'trial' || accessCode.access_type === 'trial_plus_discount') {
    effect.access_type = 'trial'
    effect.trial_days  = accessCode.trial_days
  }
  if (accessCode.access_type === 'complimentary') {
    effect.access_type = 'complimentary'
  }
  if (accessCode.access_type === 'discount' || accessCode.access_type === 'trial_plus_discount') {
    effect.discount_percent = accessCode.discount_percent
    effect.discount_months  = accessCode.discount_duration_months ?? null
  }

  // Aplicar a subscription
  const subUpdate: Record<string, unknown> = { redeemed_code_id: accessCode.id }
  if (effect.access_type === 'trial') {
    const endsAt = new Date()
    endsAt.setDate(endsAt.getDate() + (accessCode.trial_days ?? 7))
    subUpdate.acquisition_type = 'trial'
    subUpdate.status           = 'active'
    subUpdate.trial_ends_at    = endsAt.toISOString()
  } else if (effect.access_type === 'complimentary') {
    subUpdate.acquisition_type = 'complimentary'
    subUpdate.status           = 'active'
    subUpdate.trial_ends_at    = null
  }
  if (effect.discount_percent) {
    subUpdate.pending_discount_percent = effect.discount_percent
    subUpdate.pending_discount_months  = effect.discount_months ?? null
  }

  const { data: existingSub } = await supabase
    .from('subscriptions').select('id').eq('user_id', user.id).maybeSingle()

  // UPDATE y INSERT en access_codes requieren admin client (RLS no permite a usuarios normales)
  const adminClient = createAdminClient()

  type SubRow = import('@strides/db').Database['public']['Tables']['subscriptions']['Update']
  type SubIns = import('@strides/db').Database['public']['Tables']['subscriptions']['Insert']

  if (existingSub) {
    await adminClient.from('subscriptions').update(subUpdate as unknown as SubRow).eq('user_id', user.id)
  } else {
    await adminClient.from('subscriptions').insert({
      user_id:          user.id,
      acquisition_type: (subUpdate.acquisition_type as string) ?? 'prepaid',
      status:           (subUpdate.status as string) ?? 'pending_payment',
      ...subUpdate,
    } as unknown as SubIns)
  }

  // Registrar canje
  const context = ((formData.get('context') as string) === 'signup' ? 'signup' : 'account') as 'signup' | 'account'
  await supabase.from('code_redemptions').insert({
    code_id:        accessCode.id,
    user_id:        user.id,
    context,
    snapshot:       accessCode as unknown as import('@strides/db').Json,
    effect_applied: effect as unknown as import('@strides/db').Json,
  })

  await adminClient.from('access_codes')
    .update({ used_count: accessCode.used_count + 1 })
    .eq('id', accessCode.id)

  revalidatePath('/account/billing')
  revalidatePath('/account/profile')
  revalidatePath('/kids/play')
  revalidatePath('/admin/codes', 'layout')
  return { success: '¡Código canjeado! Tu acceso ha sido actualizado.' }
}

export async function submitFeedback(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('feedback').insert({
    user_id:     user.id,
    type:        formData.get('type') as string,
    message:     (formData.get('message') as string) || null,
    stars:       formData.get('stars') ? Number(formData.get('stars')) : null,
    context_url: (formData.get('context_url') as string) || null,
  })
}

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const displayName = (formData.get('display_name') as string).trim()
  const avatar = (formData.get('avatar') as string) || null

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName || null, avatar })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  redirect('/select-profile')
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/kids/play')
  return { supabase, userId: user.id }
}

export async function createAccessCode(formData: FormData) {
  const { supabase, userId } = await requireAdmin()

  const accessType = formData.get('access_type') as string
  const code = (formData.get('code') as string).trim().toUpperCase()
  const label = formData.get('label') as string
  const maxUsesRaw = formData.get('max_uses') as string
  const validUntilRaw = formData.get('valid_until') as string

  const payload: Record<string, unknown> = {
    code,
    label,
    access_type: accessType,
    max_uses: maxUsesRaw ? Number(maxUsesRaw) : null,
    valid_until: validUntilRaw ? `${validUntilRaw}T23:59:59Z` : null,
    created_by: userId,
  }

  if (accessType === 'trial' || accessType === 'trial_plus_discount') {
    payload.trial_days = Number(formData.get('trial_days'))
  }
  if (accessType === 'discount' || accessType === 'trial_plus_discount') {
    payload.discount_percent = Number(formData.get('discount_percent'))
    const durationRaw = formData.get('discount_duration_months') as string
    payload.discount_duration_months = durationRaw ? Number(durationRaw) : null
  }

  // payload always contains required fields (code, label, access_type, created_by) — cast is safe
  const { data, error } = await supabase.from('access_codes').insert(payload as { access_type: string; code: string; created_by: string; label: string }).select('id').single()
  if (error) throw new Error(error.message)

  revalidatePath('/admin/codes')
  redirect(`/admin/codes/${data.id}`)
}

export async function toggleCodeActive(id: string, is_active: boolean) {
  const { supabase } = await requireAdmin()
  await supabase.from('access_codes').update({ is_active }).eq('id', id)
  revalidatePath('/admin/codes')
  revalidatePath(`/admin/codes/${id}`)
}

export async function deleteAccessCode(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = formData.get('id') as string
  const { error } = await supabase.from('access_codes').delete().eq('id', id).eq('used_count', 0)
  if (error) throw new Error('No se puede eliminar un código que ya fue canjeado')
  revalidatePath('/admin/codes')
  redirect('/admin/codes')
}

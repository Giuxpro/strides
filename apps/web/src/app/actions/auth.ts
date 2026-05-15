'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getSetting } from '@strides/db'

export async function login(formData: FormData) {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  redirect('/select-profile')
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const { data: authData, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  if (authData.user) {
    const [{ data: variantRow }, { data: trialRow }] = await Promise.all([
      getSetting(supabase, 'landing_variant'),
      getSetting(supabase, 'trial_days'),
    ])
    const isTrial = (variantRow?.value as string) === 'b'

    if (isTrial) {
      const trialDays = (trialRow?.value as number) ?? 7
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)
      await supabase.from('subscriptions').insert({
        user_id: authData.user.id,
        acquisition_type: 'trial',
        status: 'active',
        trial_ends_at: trialEndsAt.toISOString(),
      })
    } else {
      await supabase.from('subscriptions').insert({
        user_id: authData.user.id,
        acquisition_type: 'prepaid',
        status: 'pending_payment',
        trial_ends_at: null,
      })
    }
  }

  redirect('/setup/child')
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = createClient()
  const email  = formData.get('email') as string
  const origin = headers().get('origin') ?? 'http://localhost:3000'

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/account/set-password`,
  })

  // Always redirect (don't reveal if the email exists)
  redirect('/forgot-password?sent=true')
}

export async function setNewPassword(formData: FormData) {
  const supabase  = createClient()
  const password  = formData.get('password') as string
  const confirm   = formData.get('confirm') as string

  if (password !== confirm)  return { error: 'Las contraseñas no coinciden' }
  if (password.length < 8)   return { error: 'Mínimo 8 caracteres' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  redirect('/select-profile')
}

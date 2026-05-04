'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function selectChild(childId: string) {
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

export async function createChild(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('children')
    .insert({
      parent_id: user.id,
      name: formData.get('name') as string,
      age: parseInt(formData.get('age') as string),
      avatar_url: (formData.get('avatar_url') as string) || null,
    })

  if (error) return { error: error.message }
  redirect('/select-profile')
}

export async function updateChild(childId: string, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('children')
    .update({
      name: formData.get('name') as string,
      age: parseInt(formData.get('age') as string),
      avatar_url: (formData.get('avatar_url') as string) || null,
    })
    .eq('id', childId)
    .eq('parent_id', user.id)

  if (error) return { error: error.message }
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

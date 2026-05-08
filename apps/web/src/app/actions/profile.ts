'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

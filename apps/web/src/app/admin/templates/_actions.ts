'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TemplatePageType } from '@strides/core'

export async function setPageTemplate(page: TemplatePageType, templateId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const keyMap: Record<string, string> = { landing: 'landing_template', login: 'login_template', signup: 'signup_template' }
  const key = keyMap[page] ?? 'landing_template'
  await supabase
    .from('settings')
    .upsert({ key, value: templateId }, { onConflict: 'key' })

  revalidatePath('/')
  revalidatePath('/login')
  revalidatePath('/admin/templates')
}

import { createClient } from '@/lib/supabase/server'
import { getSetting } from '@strides/db'
import { getLoginTemplate } from '@/lib/templates/login'

export default async function LoginPage() {
  const supabase = createClient()
  const { data } = await getSetting(supabase, 'login_template')
  const templateId = (data?.value as string) ?? 'default'

  const Template = getLoginTemplate(templateId)
  return <Template />
}

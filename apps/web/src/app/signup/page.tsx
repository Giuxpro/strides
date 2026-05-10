import { createClient } from '@/lib/supabase/server'
import { getSetting } from '@strides/db'
import { getSignupTemplate } from '@/lib/templates/signup'

export default async function SignupPage() {
  const supabase = createClient()
  const { data } = await getSetting(supabase, 'signup_template')
  const templateId = (data?.value as string) ?? 'default'

  const Template = getSignupTemplate(templateId)
  return <Template />
}

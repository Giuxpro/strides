import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSetting, getPublishedScreensForFlow } from '@strides/db'

export default async function OnboardingEntryPage() {
  const supabase = createClient()
  const { data: flowRow } = await getSetting(supabase, 'onboarding_flow')
  const flowId = flowRow?.value as string | undefined

  if (!flowId) redirect('/signup')

  const { data: screens } = await getPublishedScreensForFlow(supabase, flowId)
  const first = screens?.[0]

  if (!first) redirect('/signup')
  redirect(`/onboarding/${first.slug}`)
}

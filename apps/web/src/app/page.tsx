import { createClient } from '@/lib/supabase/server'
import { getSetting, getLandingStats } from '@strides/db'
import { getLandingTemplate } from '@/lib/templates/landing'
import type { LandingCopy } from '@/lib/templates/landing/types'

function buildCopy(flow: string, trialDays: number): LandingCopy {
  const isTrial = flow === 'b'
  return {
    badge:    isTrial ? `${trialDays} días de prueba · Sin tarjeta de crédito` : 'Acceso anticipado disponible',
    ctaLabel: isTrial ? `Empezar prueba de ${trialDays} días →` : 'Comenzar →',
    ctaSub:   isTrial ? 'Sin tarjeta de crédito · Cancela cuando quieras' : 'Acceso completo desde el primer día',
    navCta:   isTrial ? 'Empezar gratis' : 'Comenzar',
    finalCta: 'Crear cuenta',
    finalSub: isTrial
      ? 'Sin tarjeta · Sin compromisos · Cancela cuando quieras'
      : 'Accede a todos los módulos y contenidos disponibles',
  }
}

export default async function Home() {
  const supabase = createClient()
  const [flowRes, trialRes, templateRes, stats] = await Promise.all([
    getSetting(supabase, 'onboarding_flow'),
    getSetting(supabase, 'trial_days'),
    getSetting(supabase, 'landing_template'),
    getLandingStats(supabase),
  ])

  const flow       = (flowRes.data?.value     as string ?? 'a')
  const trialDays  = (trialRes.data?.value    as number ?? 7)
  const templateId = (templateRes.data?.value as string ?? 'default')

  const Template = getLandingTemplate(templateId)
  return <Template copy={buildCopy(flow, trialDays)} stats={stats} />
}

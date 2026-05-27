import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

// ── Flows ──────────────────────────────────────────────────────────────────

export function getAllFlows(db: DB) {
  return db.from('onboarding_flows').select('*').order('created_at')
}

export function getFlowsAdmin(
  db: DB,
  { q, offset, limit }: { q?: string; offset: number; limit: number },
) {
  let query = db
    .from('onboarding_flows')
    .select('*', { count: 'exact' })
    .order('created_at')
    .range(offset, offset + limit - 1)

  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  return query
}

export function getScreenCountsByFlowIds(db: DB, flowIds: string[]) {
  return db.from('onboarding_screens').select('flow_id').in('flow_id', flowIds)
}

export function getFlowById(db: DB, id: string) {
  return db.from('onboarding_flows').select('*').eq('id', id).single()
}

// ── Screens ────────────────────────────────────────────────────────────────

export function getScreensByFlowId(db: DB, flowId: string) {
  return db
    .from('onboarding_screens')
    .select('id, slug, title, order, is_published')
    .eq('flow_id', flowId)
    .order('order')
}

export function getOnboardingScreenById(db: DB, id: string) {
  return db.from('onboarding_screens').select('*').eq('id', id).single()
}

export function getOnboardingScreenBySlug(db: DB, slug: string) {
  return db
    .from('onboarding_screens')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
}

// Pantallas publicadas para el flujo activo:
// flow_id = activeFlowId  ← pantallas del flujo
// flow_id IS NULL         ← pantallas compartidas (aparecen en todos)
export function getPublishedScreensForFlow(db: DB, flowId: string) {
  return db
    .from('onboarding_screens')
    .select('id, slug, title, order, content')
    .eq('is_published', true)
    .or(`flow_id.eq.${flowId},flow_id.is.null`)
    .order('order')
}

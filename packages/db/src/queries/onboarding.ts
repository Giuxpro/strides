import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export function getAllOnboardingScreensForAdmin(db: DB) {
  return db
    .from('onboarding_screens')
    .select('id, slug, title, order, is_published, flow')
    .order('order')
}

export function getOnboardingScreenById(db: DB, id: string) {
  return db.from('onboarding_screens').select('*').eq('id', id).single()
}

export function getPublishedOnboardingScreens(db: DB) {
  return db
    .from('onboarding_screens')
    .select('*')
    .eq('is_published', true)
    .order('order')
}

export function getOnboardingScreenBySlug(db: DB, slug: string) {
  return db
    .from('onboarding_screens')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
}

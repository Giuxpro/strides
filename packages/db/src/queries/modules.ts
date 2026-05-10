import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export function getPublishedModules(db: DB) {
  return db.from('modules').select('*').eq('is_published', true).order('order')
}

export function getAllModulesForAdmin(db: DB) {
  return db
    .from('modules')
    .select('id, title_es, title_en, slug, is_published, order, cover_image_url')
    .order('order')
}

export function getModuleBySlug(db: DB, slug: string) {
  return db.from('modules').select('*').eq('slug', slug).eq('is_published', true).single()
}

export function getModuleById(db: DB, id: string) {
  return db.from('modules').select('*').eq('id', id).single()
}

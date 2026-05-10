import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export function getChildrenByParent(db: DB, parentId: string) {
  return db.from('children').select('*').eq('parent_id', parentId)
}

export function getChildById(db: DB, id: string, parentId: string) {
  return db.from('children').select('*').eq('id', id).eq('parent_id', parentId).single()
}

export function getChildProfile(db: DB, childId: string) {
  return db.from('children').select('name, avatar_url').eq('id', childId).single()
}

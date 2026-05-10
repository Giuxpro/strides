import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export function getAllSettings(db: DB) {
  return db.from('settings').select('key, value')
}

export function getSetting(db: DB, key: string) {
  return db.from('settings').select('value').eq('key', key).maybeSingle()
}

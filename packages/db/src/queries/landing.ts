import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export async function getLandingStats(db: DB) {
  const [modules, lessons] = await Promise.all([
    db.from('modules').select('id', { count: 'exact', head: true }).eq('is_published', true),
    db.from('lessons').select('id', { count: 'exact', head: true }),
  ])
  return {
    moduleCount: modules.count ?? 0,
    lessonCount: lessons.count ?? 0,
  }
}

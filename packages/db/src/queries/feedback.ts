import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export function getFeedbackUserIds(db: DB, q: string) {
  return db
    .from('profiles')
    .select('id')
    .or(`email.ilike.%${q}%,display_name.ilike.%${q}%`)
}

export function getFeedback(
  db: DB,
  { q, userIds, offset, limit }: { q?: string; userIds?: string[]; offset: number; limit: number },
) {
  let query = db
    .from('feedback')
    .select('*, profiles(display_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) {
    if (userIds && userIds.length > 0) {
      query = query.or(`message.ilike.%${q}%,user_id.in.(${userIds.join(',')})`)
    } else {
      query = query.ilike('message', `%${q}%`)
    }
  }

  return query
}

export function getFeedbackStats(db: DB) {
  return db.from('feedback').select('stars, status')
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export function getVocabByModule(db: DB, moduleId: string) {
  return db
    .from('vocabulary_items')
    .select('id, text_en, text_es, image_url, emoji_unicode, audio_url')
    .eq('module_id', moduleId)
}

export function getVocabAdmin(
  db: DB,
  { moduleId, q, offset, limit }: { moduleId: string; q?: string; offset: number; limit: number },
) {
  let query = db
    .from('vocabulary_items')
    .select('id, text_es, text_en, image_url, emoji_unicode, type, order', { count: 'exact' })
    .eq('module_id', moduleId)
    .order('order')
    .range(offset, offset + limit - 1)

  if (q) query = query.or(`text_es.ilike.%${q}%,text_en.ilike.%${q}%`)
  return query
}

export function getVocabAdminCount(db: DB, moduleId: string) {
  return db
    .from('vocabulary_items')
    .select('id', { count: 'exact', head: true })
    .eq('module_id', moduleId)
}

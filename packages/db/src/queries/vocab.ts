import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export function getVocabByModule(db: DB, moduleId: string) {
  return db
    .from('vocabulary_items')
    .select('id, text_en, text_es, image_url, audio_url')
    .eq('module_id', moduleId)
}

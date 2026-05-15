import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

// ── Admin queries ──────────────────────────────────────────────────────────────

export function getAllAccessCodes(db: DB) {
  return db
    .from('access_codes')
    .select('id, code, label, access_type, trial_days, discount_percent, discount_duration_months, max_uses, used_count, valid_from, valid_until, is_active, created_at')
    .order('created_at', { ascending: false })
}

export function getAccessCodeById(db: DB, id: string) {
  return db.from('access_codes').select('*').eq('id', id).single()
}

export function getRedemptionsByCodeId(db: DB, codeId: string) {
  return db
    .from('code_redemptions')
    .select('id, user_id, context, redeemed_at, effect_applied, profiles(email, display_name)')
    .eq('code_id', codeId)
    .order('redeemed_at', { ascending: false })
}

export function createAccessCode(
  db: DB,
  payload: {
    code: string
    label: string
    access_type: string
    trial_days?: number | null
    discount_percent?: number | null
    discount_duration_months?: number | null
    max_uses?: number | null
    valid_from?: string | null
    valid_until?: string | null
    created_by: string
  }
) {
  return db.from('access_codes').insert(payload).select('id').single()
}

export function toggleAccessCodeActive(db: DB, id: string, is_active: boolean) {
  return db.from('access_codes').update({ is_active }).eq('id', id)
}

export function deleteAccessCode(db: DB, id: string) {
  return db.from('access_codes').delete().eq('id', id).eq('used_count', 0)
}

// ── Redemption queries ─────────────────────────────────────────────────────────

export function getAccessCodeByCode(db: DB, code: string) {
  return db.from('access_codes').select('*').eq('code', code).maybeSingle()
}

export function getRedemptionByUserAndCode(db: DB, userId: string, codeId: string) {
  return db
    .from('code_redemptions')
    .select('id')
    .eq('user_id', userId)
    .eq('code_id', codeId)
    .maybeSingle()
}

export function createRedemption(
  db: DB,
  payload: {
    code_id: string
    user_id: string
    context: 'signup' | 'account'
    snapshot: Record<string, unknown>
    effect_applied: Record<string, unknown>
  }
) {
  return db.from('code_redemptions').insert(payload as unknown as { code_id: string; user_id: string; context: string; snapshot: import('../types.generated').Json; effect_applied: import('../types.generated').Json })
}

export function incrementCodeUsage(db: DB, id: string, currentCount: number) {
  return db.from('access_codes').update({ used_count: currentCount + 1 }).eq('id', id)
}

export function getUserRedemptions(db: DB, userId: string) {
  return db
    .from('code_redemptions')
    .select('id, redeemed_at, context, effect_applied, access_codes(code, label, access_type)')
    .eq('user_id', userId)
    .order('redeemed_at', { ascending: false })
}

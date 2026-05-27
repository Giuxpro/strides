import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export function getAdminUsers(
  db: DB,
  { search, limit, offset, plan, status }: {
    search?: string
    limit: number
    offset: number
    plan?: string
    status?: string
  },
) {
  return db.rpc('get_admin_users_overview', {
    p_search: search,
    p_limit: limit,
    p_offset: offset,
    p_plan: plan,
    p_status: status,
  })
}

export function getAdminUsersCount(
  db: DB,
  { search, plan, status }: { search?: string; plan?: string; status?: string },
) {
  return db.rpc('get_admin_users_count', {
    p_search: search,
    p_plan: plan,
    p_status: status,
  })
}

export function getAdminUserProfiles(db: DB, userIds: string[]) {
  return db.from('profiles').select('id, avatar').in('id', userIds)
}

export function getAdminUserSubs(db: DB, userIds: string[]) {
  return db.from('subscriptions').select('user_id, redeemed_code_id').in('user_id', userIds)
}

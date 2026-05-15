import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export function getSubscriptionByUserId(db: DB, userId: string) {
  return db
    .from('subscriptions')
    .select('id, user_id, acquisition_type, status, trial_ends_at, stripe_customer_id, stripe_subscription_id, created_at')
    .eq('user_id', userId)
    .maybeSingle()
}

export function createSubscription(
  db: DB,
  payload: {
    user_id: string
    acquisition_type: 'trial' | 'prepaid'
    status: 'active' | 'expired' | 'pending_payment' | 'cancelled'
    trial_ends_at?: string | null
  }
) {
  return db.from('subscriptions').insert(payload).select('id').single()
}

export function updateSubscriptionStatus(
  db: DB,
  userId: string,
  status: 'active' | 'expired' | 'pending_payment' | 'cancelled'
) {
  return db.from('subscriptions').update({ status }).eq('user_id', userId)
}

export function updateSubscriptionStripeIds(
  db: DB,
  userId: string,
  ids: { stripe_customer_id: string; stripe_subscription_id?: string }
) {
  return db.from('subscriptions').update(ids).eq('user_id', userId)
}

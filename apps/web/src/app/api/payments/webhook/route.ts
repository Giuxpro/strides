import { createAdminClient } from '@/lib/supabase/admin'
import { verifyWebhookSignature, type PaymentWebhookEvent } from '@strides/core/payments'

interface SubscriptionMetadata {
  userId?: string
  billingCycle?: 'monthly' | 'annual'
}

function periodEnd(cycle: 'monthly' | 'annual'): string {
  const end = new Date()
  if (cycle === 'annual') end.setFullYear(end.getFullYear() + 1)
  else end.setMonth(end.getMonth() + 1)
  return end.toISOString()
}

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text()
  const signature = req.headers.get('x-payment-signature') ?? ''

  if (!verifyWebhookSignature(raw, signature, process.env.PAYMENTS_WEBHOOK_SECRET!)) {
    return new Response('Firma inválida', { status: 401 })
  }

  const event = JSON.parse(raw) as PaymentWebhookEvent
  const admin = createAdminClient()

  // Idempotencia: si el event_id ya existe, es un reintento del servicio → ignorar.
  const { error: dupError } = await admin
    .from('payment_webhook_events')
    .insert({ event_id: event.id })
  if (dupError) {
    if (dupError.code === '23505') return new Response('ok', { status: 200 })
    throw dupError
  }

  const meta = (event.payment.metadata ?? {}) as SubscriptionMetadata
  if (!meta.userId || !meta.billingCycle) return new Response('ok', { status: 200 })

  if (event.type === 'payment.succeeded') {
    await admin.from('subscriptions').upsert(
      {
        user_id: meta.userId,
        acquisition_type: 'prepaid',
        status: 'active',
        billing_cycle: meta.billingCycle,
        current_period_end: periodEnd(meta.billingCycle),
        trial_ends_at: null,
      },
      { onConflict: 'user_id' },
    )
  } else if (event.type === 'payment.refunded') {
    await admin
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', meta.userId)
  }

  return new Response('ok', { status: 200 })
}

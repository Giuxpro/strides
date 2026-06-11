import { createHmac, timingSafeEqual } from 'crypto'
import type { PaymentStatus } from './client'

export type PaymentEventKind =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.expired'
  | 'payment.refunded'

export interface PaymentWebhookEvent {
  id: string // único por evento — se usa para deduplicar
  type: PaymentEventKind
  payment: {
    id: string
    externalRef: string
    amount: number
    currency: string
    status: PaymentStatus
    provider: string
    metadata: Record<string, unknown> | null
    createdAt: string
    updatedAt: string
  }
}

// Firma = HMAC-SHA256(secreto, rawBody) en hex. Comparación en tiempo constante.
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

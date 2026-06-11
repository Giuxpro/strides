// Cliente del Payment Service. Strides habla el contrato normalizado del servicio,
// nunca el de Culqi directamente. Solo se usa desde el servidor (lleva la API key).

export type PaymentStatus =
  | 'pending'
  | 'succeeded'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'refunded'

export interface CreatePaymentParams {
  baseUrl: string // ej: http://localhost:3005/v1
  apiKey: string
  idempotencyKey: string
  externalRef: string
  amount: number // en céntimos
  currency?: string
  token: string // token de tarjeta generado en el cliente por el SDK del proveedor
  metadata?: Record<string, unknown>
}

export interface PaymentResult {
  paymentId: string
  status: PaymentStatus
  externalRef: string
  amount: number
  currency: string
  createdAt: string
}

export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const { baseUrl, apiKey, idempotencyKey, externalRef, amount, currency, token, metadata } = params

  const res = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ externalRef, amount, currency, token, metadata }),
  })

  if (!res.ok) {
    throw new Error(`Payment service respondió ${res.status}: ${await res.text()}`)
  }

  return res.json() as Promise<PaymentResult>
}

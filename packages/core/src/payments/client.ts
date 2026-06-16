// Cliente del Payment Service. Strides habla el contrato normalizado del servicio,
// nunca el de Culqi / Mercado Pago directamente. Solo se usa desde el servidor (lleva la API key).

export type PaymentStatus =
  | 'pending'
  | 'succeeded'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'refunded'

// 'card' enruta a Culqi; 'mercadopago' enruta a Mercado Pago (tarjeta o billetera).
export type PaymentMethod = 'card' | 'mercadopago'

// Datos de la tarjeta tokenizada en el cliente. Ausente en flujos de billetera/redirección.
// Mercado Pago exige token + paymentMethodId + installments; Culqi solo token.
export interface CardInput {
  token: string
  paymentMethodId?: string
  installments?: number
  issuerId?: string
}

export interface CreatePaymentParams {
  baseUrl: string // ej: http://localhost:3005/v1
  apiKey: string
  idempotencyKey: string
  externalRef: string
  amount: number // en céntimos
  currency?: string
  paymentMethod: PaymentMethod
  card?: CardInput // presente en cobros con tarjeta; ausente en billetera (redirección)
  payer?: { email: string }
  metadata?: Record<string, unknown>
}

// Acción que el usuario debe completar para que el pago avance (billetera/QR).
// Ausente en cobros síncronos como tarjeta.
export interface PaymentAction {
  type: 'redirect' | 'qr'
  url: string
}

export interface PaymentResult {
  paymentId: string
  status: PaymentStatus
  externalRef: string
  amount: number
  currency: string
  createdAt: string
  action?: PaymentAction
}

export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const { baseUrl, apiKey, idempotencyKey, externalRef, amount, currency, paymentMethod, card, payer, metadata } =
    params

  const res = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ externalRef, amount, currency, paymentMethod, card, payer, metadata }),
  })

  if (!res.ok) {
    throw new Error(`Payment service respondió ${res.status}: ${await res.text()}`)
  }

  return res.json() as Promise<PaymentResult>
}

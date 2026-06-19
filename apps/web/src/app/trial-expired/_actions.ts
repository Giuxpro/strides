'use server'

import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createPayment, type CardInput, type PaymentMethod, type PaymentResult } from '@strides/core/payments'

type BillingCycle = 'monthly' | 'annual'

// Tarjeta: el Brick de Mercado Pago tokeniza en el cliente y entrega estos datos.
// Billetera: sin tarjeta — el servicio crea una preferencia y devuelve action.redirect.
// Yape: token generado por Culqi.js en el cliente (código de aprobación de la app).
// PagoEfectivo: sin tarjeta — Culqi genera un CIP y devuelve action.voucher.
type CheckoutInput =
  | { billingCycle: BillingCycle; method: 'card'; card: CardInput }
  | { billingCycle: BillingCycle; method: 'wallet' }
  | { billingCycle: BillingCycle; method: 'yape'; card: CardInput }
  | { billingCycle: BillingCycle; method: 'pagoefectivo' }

// 'card'/'wallet' van por Mercado Pago; 'yape'/'pagoefectivo' por Culqi.
const PAYMENT_METHOD: Record<CheckoutInput['method'], PaymentMethod> = {
  card: 'mercadopago',
  wallet: 'mercadopago',
  yape: 'yape',
  pagoefectivo: 'pagoefectivo',
}

// El monto SIEMPRE se calcula en el servidor desde settings — nunca se confía en el cliente.
export async function startSubscriptionCheckout(input: CheckoutInput): Promise<PaymentResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  if (!user.email) throw new Error('La cuenta no tiene email')

  const [{ data: priceRow }, { data: discountRow }, { data: currencyRow }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'monthly_price').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'annual_discount_pct').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'price_currency').maybeSingle(),
  ])

  const monthlyPrice = priceRow?.value as number | undefined
  if (!monthlyPrice || monthlyPrice <= 0) throw new Error('Precio no configurado')
  const annualDiscountPct = (discountRow?.value as number) ?? 0
  const currency = currencyRow?.value === 'USD' ? 'USD' : 'PEN'

  const units =
    input.billingCycle === 'annual'
      ? monthlyPrice * (1 - annualDiscountPct / 100) * 12
      : monthlyPrice
  const amount = Math.round(units * 100) // céntimos

  const card = input.method === 'card' || input.method === 'yape' ? input.card : undefined

  return createPayment({
    baseUrl: process.env.PAYMENTS_API_BASE_URL!,
    apiKey: process.env.PAYMENTS_API_KEY!,
    idempotencyKey: randomUUID(),
    externalRef: `sub:${input.billingCycle}:${user.id}`,
    amount,
    currency,
    paymentMethod: PAYMENT_METHOD[input.method],
    card,
    payer: { email: user.email },
    metadata: { kind: 'subscription', userId: user.id, billingCycle: input.billingCycle },
  })
}

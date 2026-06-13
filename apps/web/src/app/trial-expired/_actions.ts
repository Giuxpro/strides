'use server'

import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createPayment, type PaymentResult } from '@strides/core/payments'

type BillingCycle = 'monthly' | 'annual'

interface CheckoutInput {
  token: string // token de tarjeta del widget de Culqi
  billingCycle: BillingCycle
}

// El monto SIEMPRE se calcula en el servidor desde settings — nunca se confía en el cliente.
export async function startSubscriptionCheckout(input: CheckoutInput): Promise<PaymentResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

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

  return createPayment({
    baseUrl: process.env.PAYMENTS_API_BASE_URL!,
    apiKey: process.env.PAYMENTS_API_KEY!,
    idempotencyKey: randomUUID(),
    externalRef: `sub:${input.billingCycle}:${user.id}`,
    amount,
    currency,
    token: input.token,
    metadata: { kind: 'subscription', userId: user.id, billingCycle: input.billingCycle },
  })
}

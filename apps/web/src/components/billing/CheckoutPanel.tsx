'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { PlanSelector } from './PlanSelector'
import { PaymentSuccess } from './PaymentSuccess'
import { startSubscriptionCheckout } from '@/app/trial-expired/_actions'
import type { CardInput } from '@strides/core/payments'

// El SDK de Mercado Pago toca `window`: solo en cliente, nunca en SSR.
const CardPaymentBrick = dynamic(
  () => import('./CardPaymentBrick').then((m) => m.CardPaymentBrick),
  { ssr: false, loading: () => <p className="text-xs text-gray-400 text-center py-4">Cargando formulario…</p> },
)

type Cycle = 'monthly' | 'annual'
type Method = 'card' | 'wallet'
type Currency = 'PEN' | 'USD'

const SYMBOL: Record<Currency, string> = { PEN: 'S/', USD: '$' }
// Locale del Brick de Mercado Pago: idioma y formato según el mercado de cobro.
const LOCALE = { PEN: 'es-PE', USD: 'en-US' } as const

interface Props {
  monthlyPrice: number
  annualDiscountPct: number
  currency: Currency
  publicKey: string
}

export function CheckoutPanel({ monthlyPrice, annualDiscountPct, currency, publicKey }: Props) {
  const symbol = SYMBOL[currency]
  const locale = LOCALE[currency]
  const [cycle, setCycle] = useState<Cycle>('annual')
  const [method, setMethod] = useState<Method | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [paid, setPaid] = useState(false)

  const amountUnits =
    cycle === 'annual' ? monthlyPrice * (1 - annualDiscountPct / 100) * 12 : monthlyPrice

  async function payWithCard(card: CardInput) {
    setError(null)
    const result = await startSubscriptionCheckout({ billingCycle: cycle, method: 'card', card })
    if (result.status === 'succeeded') {
      setPaid(true)
    } else if (result.status === 'pending') {
      setError('Estamos confirmando tu pago. En cuanto se acredite tendrás acceso.')
    } else {
      setError('El pago fue rechazado. Revisa los datos de tu tarjeta o prueba con Mercado Pago.')
    }
  }

  async function payWithWallet() {
    setError(null)
    setWalletLoading(true)
    try {
      const result = await startSubscriptionCheckout({ billingCycle: cycle, method: 'wallet' })
      if (result.action?.type === 'redirect') {
        window.location.href = result.action.url
        return
      }
      setError('No se pudo iniciar el pago con Mercado Pago.')
    } catch {
      setError('No se pudo iniciar el pago. Inténtalo de nuevo.')
    } finally {
      setWalletLoading(false)
    }
  }

  if (paid) return <PaymentSuccess />

  return (
    <div className="text-left space-y-4">
      <PlanSelector
        monthlyPrice={monthlyPrice}
        annualDiscountPct={annualDiscountPct}
        symbol={symbol}
        value={cycle}
        onChange={(c) => {
          setCycle(c)
          setError(null)
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setMethod('card'); setError(null) }}
          className={`rounded-2xl border p-3 text-sm font-semibold transition-all ${
            method === 'card'
              ? 'border-violet-500 bg-violet-50 text-violet-700 ring-1 ring-violet-400'
              : 'border-gray-200 bg-white text-gray-600 hover:border-violet-200'
          }`}
        >
          💳 Tarjeta
        </button>
        <button
          type="button"
          onClick={() => { setMethod('wallet'); setError(null) }}
          className={`rounded-2xl border p-3 text-sm font-semibold transition-all ${
            method === 'wallet'
              ? 'border-violet-500 bg-violet-50 text-violet-700 ring-1 ring-violet-400'
              : 'border-gray-200 bg-white text-gray-600 hover:border-violet-200'
          }`}
        >
          Billetera Mercado Pago
        </button>
      </div>

      {method === 'card' && (
        <CardPaymentBrick
          key={cycle}
          publicKey={publicKey}
          locale={locale}
          amount={Number(amountUnits.toFixed(2))}
          onToken={payWithCard}
          onError={() => setError('No se pudo procesar la tarjeta. Revisa los datos e inténtalo de nuevo.')}
        />
      )}

      {method === 'wallet' && (
        <button
          type="button"
          onClick={payWithWallet}
          disabled={walletLoading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base text-center disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 0 #4338ca' }}
        >
          {walletLoading ? 'Redirigiendo…' : 'Continuar a Mercado Pago'}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}
    </div>
  )
}

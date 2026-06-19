'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { PlanSelector } from './PlanSelector'
import { PaymentSuccess } from './PaymentSuccess'
import { startSubscriptionCheckout } from '@/app/trial-expired/_actions'
import {
  PAYMENT_METHOD_REGISTRY,
  resolvePaymentMethodStatus,
  type CardInput,
  type PaymentAction,
  type PaymentMethodId,
} from '@strides/core/payments'

// El SDK de Mercado Pago toca `window`: solo en cliente, nunca en SSR.
const CardPaymentBrick = dynamic(
  () => import('./CardPaymentBrick').then((m) => m.CardPaymentBrick),
  { ssr: false, loading: () => <p className="text-xs text-gray-400 text-center py-4">Cargando formulario…</p> },
)

type Cycle = 'monthly' | 'annual'
type Currency = 'PEN' | 'USD'
type Voucher = Extract<PaymentAction, { type: 'voucher' }>

const SYMBOL: Record<Currency, string> = { PEN: 'S/', USD: '$' }
// Locale del Brick de Mercado Pago: idioma y formato según el mercado de cobro.
const LOCALE = { PEN: 'es-PE', USD: 'en-US' } as const

// Etiqueta bajo el método cuando no es seleccionable.
const STATUS_LABEL = {
  disabled: 'No disponible por el momento',
  coming_soon: 'Próximamente',
} as const

const METHOD_BUTTON = 'rounded-2xl border p-3 text-sm font-semibold transition-all text-center'
const METHOD_ACTIVE = 'border-violet-500 bg-violet-50 text-violet-700 ring-1 ring-violet-400'
const METHOD_IDLE = 'border-gray-200 bg-white text-gray-600 hover:border-violet-200'
const METHOD_OFF = 'border-gray-200 bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed'

interface Props {
  monthlyPrice: number
  annualDiscountPct: number
  currency: Currency
  publicKey: string
  // Estado on/off por método (setting `payment_methods` de BD).
  enabledMethods?: Partial<Record<PaymentMethodId, boolean>>
}

export function CheckoutPanel({ monthlyPrice, annualDiscountPct, currency, publicKey, enabledMethods }: Props) {
  const symbol = SYMBOL[currency]
  const locale = LOCALE[currency]
  const [cycle, setCycle] = useState<Cycle>('annual')
  const [method, setMethod] = useState<PaymentMethodId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [yapePhone, setYapePhone] = useState('')
  const [yapeCode, setYapeCode] = useState('')

  const amountUnits =
    cycle === 'annual' ? monthlyPrice * (1 - annualDiscountPct / 100) * 12 : monthlyPrice

  function selectMethod(m: PaymentMethodId) {
    setMethod(m)
    setError(null)
    setVoucher(null)
  }

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
    setLoading(true)
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
      setLoading(false)
    }
  }

  async function payWithYape() {
    setError(null)
    setLoading(true)
    try {
      // TODO (al activar Culqi): tokenizar con Culqi.js (Culqi.createYape) usando celular +
      // código de aprobación. MOCK: token simulado; el back deriva el estado del string.
      const token = `yape_${yapePhone}_${yapeCode}`
      const result = await startSubscriptionCheckout({ billingCycle: cycle, method: 'yape', card: { token } })
      if (result.status === 'succeeded') {
        setPaid(true)
      } else if (result.status === 'pending') {
        setError('Estamos confirmando tu pago. En cuanto se acredite tendrás acceso.')
      } else {
        setError('El pago con Yape fue rechazado. Revisa el código e inténtalo de nuevo.')
      }
    } catch {
      setError('No se pudo procesar el pago con Yape. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function payWithPagoEfectivo() {
    setError(null)
    setLoading(true)
    try {
      const result = await startSubscriptionCheckout({ billingCycle: cycle, method: 'pagoefectivo' })
      if (result.action?.type === 'voucher') {
        setVoucher(result.action)
        return
      }
      setError('No se pudo generar el código de PagoEfectivo. Inténtalo de nuevo.')
    } catch {
      setError('No se pudo generar el código de PagoEfectivo. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
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
          setVoucher(null)
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        {PAYMENT_METHOD_REGISTRY.map((m) => {
          const status = resolvePaymentMethodStatus(m, enabledMethods)
          const isActive = status === 'active'
          const selected = method === m.id
          return (
            <button
              key={m.id}
              type="button"
              disabled={!isActive}
              onClick={() => selectMethod(m.id)}
              className={`${METHOD_BUTTON} ${selected ? METHOD_ACTIVE : isActive ? METHOD_IDLE : METHOD_OFF}`}
            >
              <span className="block">{m.label}</span>
              {!isActive && (
                <span className="block text-[10px] font-normal mt-0.5">{STATUS_LABEL[status]}</span>
              )}
            </button>
          )
        })}
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
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base text-center disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 0 #4338ca' }}
        >
          {loading ? 'Redirigiendo…' : 'Continuar a Mercado Pago'}
        </button>
      )}

      {method === 'yape' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Abre tu app Yape, genera el código de aprobación y complétalo aquí.
          </p>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={9}
            placeholder="Celular (9 dígitos)"
            value={yapePhone}
            onChange={(e) => setYapePhone(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
          />
          <input
            type="tel"
            inputMode="numeric"
            maxLength={6}
            placeholder="Código de aprobación (6 dígitos)"
            value={yapeCode}
            onChange={(e) => setYapeCode(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
          />
          <button
            type="button"
            onClick={payWithYape}
            disabled={loading || yapePhone.length !== 9 || yapeCode.length !== 6}
            className="w-full py-4 rounded-2xl font-bold text-white text-base text-center disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 0 #4338ca' }}
          >
            {loading ? 'Procesando…' : 'Pagar con Yape'}
          </button>
        </div>
      )}

      {method === 'pagoefectivo' && !voucher && (
        <button
          type="button"
          onClick={payWithPagoEfectivo}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base text-center disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 0 #4338ca' }}
        >
          {loading ? 'Generando código…' : 'Generar código de pago'}
        </button>
      )}

      {voucher && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4 text-center">
          <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-1">Código PagoEfectivo (CIP)</p>
          <p className="text-2xl font-extrabold tracking-widest text-gray-900">{voucher.code}</p>
          <p className="text-xs text-gray-500 mt-2">
            Págalo en banca o agente antes del{' '}
            {new Date(voucher.expiresAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}.
            Tu acceso se activa al confirmarse el pago.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}
    </div>
  )
}

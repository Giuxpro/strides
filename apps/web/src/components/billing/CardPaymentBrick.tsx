'use client'

import { useEffect } from 'react'
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'
import type { CardInput } from '@strides/core/payments'

interface Props {
  publicKey: string
  locale: 'es-PE' | 'en-US'
  amount: number // unidades (no céntimos) — solo para mostrar cuotas en el Brick
  onToken: (card: CardInput) => Promise<void>
  onError: () => void
}

let initialized = false

export function CardPaymentBrick({ publicKey, locale, amount, onToken, onError }: Props) {
  useEffect(() => {
    if (!initialized) {
      initMercadoPago(publicKey, { locale })
      initialized = true
    }
  }, [publicKey, locale])

  return (
    <CardPayment
      initialization={{ amount }}
      onSubmit={async (formData) => {
        await onToken({
          token: formData.token,
          paymentMethodId: formData.payment_method_id,
          installments: formData.installments,
          issuerId: formData.issuer_id,
        })
      }}
      onError={onError}
    />
  )
}

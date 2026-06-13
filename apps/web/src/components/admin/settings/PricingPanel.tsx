'use client'

import { useState } from 'react'

type Currency = 'PEN' | 'USD'

const SYMBOL: Record<Currency, string> = { PEN: 'S/', USD: '$' }

interface Props {
  initialMonthlyPrice: number | null
  initialAnnualDiscount: number | null
  initialCurrency: Currency
}

export function PricingPanel({ initialMonthlyPrice, initialAnnualDiscount, initialCurrency }: Props) {
  const [currency, setCurrency] = useState<Currency>(initialCurrency)
  const [monthlyPrice, setMonthlyPrice] = useState(initialMonthlyPrice ?? '')
  const [annualDiscount, setAnnualDiscount] = useState(initialAnnualDiscount ?? '')

  const price = Number(monthlyPrice)
  const discount = Number(annualDiscount)
  const symbol = SYMBOL[currency]

  return (
    <div className="space-y-3">
      <input type="hidden" name="price_currency" value={currency} />

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 shrink-0">Moneda de cobro</span>
        <div className="flex gap-2">
          {(['PEN', 'USD'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${currency === c
                ? 'border-violet-500 bg-violet-500/5 text-gray-200'
                : 'border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
            >
              {c === 'PEN' ? 'Soles (S/)' : 'Dólares ($)'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="monthly_price" className="block text-sm text-gray-400 mb-1.5">
            Precio mensual ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{symbol}</span>
            <input
              id="monthly_price"
              name="monthly_price"
              type="number"
              min={0}
              step={0.01}
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              placeholder="9.99"
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="annual_discount_pct" className="block text-sm text-gray-400 mb-1.5">
            Descuento anual (%)
          </label>
          <div className="relative">
            <input
              id="annual_discount_pct"
              name="annual_discount_pct"
              type="number"
              min={0}
              max={100}
              step={1}
              value={annualDiscount}
              onChange={(e) => setAnnualDiscount(e.target.value)}
              placeholder="20"
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 pr-8 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
          </div>
        </div>
      </div>

      {discount > 0 && price > 0 ? (
        <p className="text-xs text-gray-600 -mt-1">
          Plan anual: {symbol}{(price * (1 - discount / 100)).toFixed(2)}/mes · {symbol}{(price * 12 * (1 - discount / 100)).toFixed(2)}/año
        </p>
      ) : null}
    </div>
  )
}

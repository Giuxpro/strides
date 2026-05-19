'use client'

import { useState } from 'react'

interface Props {
  monthlyPrice: number
  annualDiscountPct: number
}

export function PlanSelector({ monthlyPrice, annualDiscountPct }: Props) {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('annual')

  const annualMonthly = monthlyPrice * (1 - annualDiscountPct / 100)
  const annualTotal   = annualMonthly * 12

  return (
    <div className="space-y-2">
      <input type="hidden" name="billing_cycle" value={cycle} />

      <div className="grid grid-cols-2 gap-2">
        {/* Mensual */}
        <button
          type="button"
          onClick={() => setCycle('monthly')}
          className={`rounded-2xl border p-3 text-left transition-all ${
            cycle === 'monthly'
              ? 'border-violet-500 bg-violet-50 shadow-sm ring-1 ring-violet-400'
              : 'border-gray-200 bg-white hover:border-violet-200'
          }`}
        >
          <p className="text-xs text-gray-400 mb-1">Mensual</p>
          <p className="text-lg font-extrabold text-gray-900 leading-none">
            ${monthlyPrice.toFixed(2)}
            <span className="text-xs font-normal text-gray-400">/mes</span>
          </p>
        </button>

        {/* Anual */}
        <button
          type="button"
          onClick={() => setCycle('annual')}
          className={`rounded-2xl border p-3 text-left transition-all relative ${
            cycle === 'annual'
              ? 'border-violet-500 bg-violet-50 shadow-sm ring-1 ring-violet-400'
              : 'border-gray-200 bg-white hover:border-violet-200'
          }`}
        >
          {annualDiscountPct > 0 && (
            <span className="absolute -top-2 -right-1 text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full leading-none">
              -{annualDiscountPct}%
            </span>
          )}
          <p className="text-xs text-gray-400 mb-1">Anual</p>
          <p className="text-lg font-extrabold text-gray-900 leading-none">
            ${annualMonthly.toFixed(2)}
            <span className="text-xs font-normal text-gray-400">/mes</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-1">${annualTotal.toFixed(2)}/año</p>
        </button>
      </div>
    </div>
  )
}

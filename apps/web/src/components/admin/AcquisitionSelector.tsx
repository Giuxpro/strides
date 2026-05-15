'use client'
import { useState } from 'react'

type Props = {
  initialVariant: string
  initialTrialDays: number
}

const OPTIONS = [
  {
    value: 'a',
    label: 'Pago anticipado',
    description: 'El usuario paga antes de acceder al producto.',
    badge: 'A',
  },
  {
    value: 'b',
    label: 'Trial gratuito',
    description: 'El usuario prueba gratis y paga al vencer el período.',
    badge: 'B',
  },
] as const

export function AcquisitionSelector({ initialVariant, initialTrialDays }: Props) {
  const [variant, setVariant] = useState(initialVariant === 'b' ? 'b' : 'a')

  return (
    <div className="space-y-3">
      {OPTIONS.map((opt) => {
        const selected = variant === opt.value
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-3 cursor-pointer p-3.5 rounded-lg border transition-all ${
              selected
                ? 'border-violet-500 bg-violet-500/5'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <input
              type="radio"
              name="landing_variant"
              value={opt.value}
              checked={selected}
              onChange={() => setVariant(opt.value)}
              className="accent-violet-500 mt-0.5 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${selected ? 'bg-violet-500/20 text-violet-300' : 'bg-gray-800 text-gray-500'}`}>
                  {opt.badge}
                </span>
                <span className="text-sm text-gray-200">{opt.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>

              {opt.value === 'b' && selected && (
                <div className="mt-3 pt-3 border-t border-gray-700/60 flex items-center gap-3">
                  <label htmlFor="trial_days" className="text-xs text-gray-400 shrink-0">
                    Días de trial
                  </label>
                  <input
                    id="trial_days"
                    name="trial_days"
                    type="number"
                    min={1}
                    max={90}
                    defaultValue={initialTrialDays}
                    onClick={(e) => e.stopPropagation()}
                    className="w-20 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  <span className="text-xs text-gray-600">días desde el registro</span>
                </div>
              )}
            </div>
          </label>
        )
      })}

      {variant === 'a' && (
        <input type="hidden" name="trial_days" value={initialTrialDays} />
      )}
    </div>
  )
}

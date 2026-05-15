'use client'
import { useState } from 'react'

interface Props {
  initial: { enabled: boolean; percent: number; label: string; duration_months: number | null }
}

export function GlobalDiscountPanel({ initial }: Props) {
  const [enabled, setEnabled] = useState(initial.enabled)

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          onClick={() => setEnabled(v => !v)}
          className={`relative w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-violet-600' : 'bg-gray-700'}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-5' : 'left-1'}`} />
        </div>
        <input type="hidden" name="global_discount_enabled" value={enabled ? 'true' : 'false'} />
        <span className="text-sm text-gray-300">
          {enabled ? 'Promoción activa — se muestra a todos los usuarios' : 'Sin promoción global activa'}
        </span>
      </label>

      {enabled && (
        <div className="space-y-4 pl-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="global_discount_percent" className="block text-xs text-gray-500 mb-1.5">
                Descuento (%)
              </label>
              <input
                id="global_discount_percent"
                name="global_discount_percent"
                type="number"
                min={1}
                max={99}
                required
                defaultValue={initial.percent || 10}
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label htmlFor="global_discount_duration" className="block text-xs text-gray-500 mb-1.5">
                Duración <span className="text-gray-600">(meses, vacío = siempre)</span>
              </label>
              <input
                id="global_discount_duration"
                name="global_discount_duration"
                type="number"
                min={1}
                defaultValue={initial.duration_months ?? ''}
                placeholder="siempre"
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="global_discount_label" className="block text-xs text-gray-500 mb-1.5">
              Etiqueta visible <span className="text-gray-600">(aparece en billing del usuario)</span>
            </label>
            <input
              id="global_discount_label"
              name="global_discount_label"
              type="text"
              defaultValue={initial.label || ''}
              placeholder="Promoción de lanzamiento"
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

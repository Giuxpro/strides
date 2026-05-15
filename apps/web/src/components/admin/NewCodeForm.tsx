'use client'
import { useState } from 'react'
import { createAccessCode } from '@/app/admin/codes/_actions'
import { SubmitButton } from './SubmitButton'

function Tip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1.5 cursor-help align-middle">
      <span className="text-gray-600 hover:text-gray-400 text-xs leading-none select-none">ⓘ</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-xs text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl">
        {text}
      </span>
    </span>
  )
}

const ACCESS_TYPES = [
  {
    value: 'trial',
    emoji: '🎁',
    label: 'Trial gratuito',
    description: 'N días de acceso completo sin pagar. Al vencer, se le pide al usuario que active su suscripción.',
  },
  {
    value: 'complimentary',
    emoji: '♾️',
    label: 'Cortesía permanente',
    description: 'Acceso indefinido sin ningún cobro. Para equipo interno, beta testers o usuarios VIP.',
  },
  {
    value: 'discount',
    emoji: '🏷️',
    label: 'Descuento',
    description: '% de rebaja sobre el precio mensual. Ideal para campañas de retención o códigos de referido.',
  },
  {
    value: 'trial_plus_discount',
    emoji: '🎁🏷️',
    label: 'Trial + Descuento',
    description: 'Primero prueba gratis; al terminar el trial, el descuento se activa automáticamente en su primer cobro.',
  },
] as const

type AccessType = typeof ACCESS_TYPES[number]['value']

export function NewCodeForm() {
  const [accessType, setAccessType] = useState<AccessType>('trial')

  const showTrial    = accessType === 'trial' || accessType === 'trial_plus_discount'
  const showDiscount = accessType === 'discount' || accessType === 'trial_plus_discount'

  return (
    <form action={createAccessCode} className="space-y-6 max-w-lg">

      {/* Tipo de acceso */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Tipo de acceso</label>
        <div className="grid grid-cols-2 gap-2">
          {ACCESS_TYPES.map(opt => (
            <label
              key={opt.value}
              className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all ${
                accessType === opt.value
                  ? 'border-violet-500 bg-violet-500/5'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="access_type"
                value={opt.value}
                checked={accessType === opt.value}
                onChange={() => setAccessType(opt.value)}
                className="sr-only"
              />
              <span className="text-base leading-none">{opt.emoji}</span>
              <span className="text-sm font-medium text-gray-200">{opt.label}</span>
              <span className="text-xs text-gray-500 leading-snug">{opt.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Código y etiqueta */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="code" className="block text-sm text-gray-400 mb-1.5">
            Código
            <Tip text="Lo que el usuario escribe para canjear. Se guarda en mayúsculas y sin espacios. Ej: AMIGO-20, STRIDES-VIP." />
          </label>
          <input
            id="code" name="code" required
            placeholder="AMIGO-20"
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2.5 uppercase placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <div>
          <label htmlFor="label" className="block text-sm text-gray-400 mb-1.5">
            Etiqueta interna
            <Tip text="Solo visible para ti en el panel. Úsala para identificar de dónde viene el código. Ej: Campaña Instagram mayo." />
          </label>
          <input
            id="label" name="label" required
            placeholder="Campaña Instagram mayo"
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2.5 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Campos condicionales — Trial */}
      {showTrial && (
        <div>
          <label htmlFor="trial_days" className="block text-sm text-gray-400 mb-1.5">
            Días de trial
            <Tip text="Cuántos días tendrá acceso completo a partir del momento en que canjea el código. Mínimo 1, máximo 365." />
          </label>
          <input
            id="trial_days" name="trial_days" type="number" min={1} max={365} required
            placeholder="7"
            className="w-32 bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      )}

      {/* Campos condicionales — Descuento */}
      {showDiscount && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="discount_percent" className="block text-sm text-gray-400 mb-1.5">
              Descuento (%)
              <Tip text="Porcentaje que se resta al precio mensual configurado. Un 20% sobre $9.99 deja la cuota en $7.99." />
            </label>
            <input
              id="discount_percent" name="discount_percent" type="number" min={1} max={100} required
              placeholder="20"
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label htmlFor="discount_duration_months" className="block text-sm text-gray-400 mb-1.5">
              Duración del descuento
              <Tip text="Meses que dura la rebaja. Déjalo vacío para que el descuento sea permanente mientras tenga suscripción activa." />
            </label>
            <input
              id="discount_duration_months" name="discount_duration_months" type="number" min={1}
              placeholder="meses (vacío = siempre)"
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2.5 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      )}

      {/* Usos y vencimiento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="max_uses" className="block text-sm text-gray-400 mb-1.5">
            Usos máximos
            <Tip text="Cuántas personas pueden canjear este código en total. Déjalo vacío para usos ilimitados. Útil para códigos de campaña masiva vs. códigos de uso único." />
          </label>
          <input
            id="max_uses" name="max_uses" type="number" min={1}
            placeholder="ilimitado"
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2.5 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <div>
          <label htmlFor="valid_until" className="block text-sm text-gray-400 mb-1.5">
            Código expira el
            <Tip text="Fecha límite para canjear el código. Después de esta fecha nadie puede usarlo, independientemente de los usos restantes. Déjalo vacío para que no expire nunca." />
          </label>
          <input
            id="valid_until" name="valid_until" type="date"
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      <SubmitButton label="Crear código" />
    </form>
  )
}

'use client'

import { useState } from 'react'

type Trigger = 'lesson' | 'module' | 'games' | 'admin_test'

interface Initial {
  enabled: boolean
  trigger: Trigger
  games_threshold: number
  cooldown_days: number
}

const TRIGGERS: { id: Trigger; label: string; desc: string }[] = [
  { id: 'lesson',     label: 'Al completar una lección', desc: 'Aparece después de que el niño termina cualquier lección.' },
  { id: 'module',     label: 'Al completar un módulo',   desc: 'Solo cuando se completan todas las lecciones del módulo.' },
  { id: 'games',      label: 'Al jugar N partidas',      desc: 'Aparece cada vez que se alcanza el múltiplo indicado.' },
  { id: 'admin_test', label: 'Solo admin (prueba)',       desc: 'Solo el admin ve el NPS al entrar a cualquier módulo.' },
]

export function FeedbackPromptPanel({ initial }: { initial: Initial }) {
  const [enabled, setEnabled] = useState(initial.enabled)
  const [trigger, setTrigger] = useState<Trigger>(initial.trigger)
  const [threshold, setThreshold] = useState(initial.games_threshold)
  const [cooldown, setCooldown] = useState(initial.cooldown_days)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-300">NPS automático</p>
          <p className="text-xs text-gray-600">Pregunta de satisfacción (1-5 estrellas)</p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(e => !e)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? 'bg-violet-600' : 'bg-gray-700'}`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Siempre incluidos — siguen el estado React */}
      <input type="hidden" name="nps_enabled" value={String(enabled)} />
      <input type="hidden" name="nps_trigger" value={trigger} />
      <input type="hidden" name="nps_games_threshold" value={String(threshold)} />
      <input type="hidden" name="nps_cooldown_days" value={String(cooldown)} />

      {enabled && (
        <div className="border-t border-gray-800 pt-4 space-y-3">
          <p className="text-xs text-gray-400 font-medium">Activar cuando</p>
          {TRIGGERS.map(t => (
            <label key={t.id} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="nps_trigger_ui"
                value={t.id}
                checked={trigger === t.id}
                onChange={() => setTrigger(t.id)}
                className="accent-violet-500 mt-0.5"
              />
              <span>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{t.label}</span>
                <span className="block text-xs text-gray-600">{t.desc}</span>
              </span>
            </label>
          ))}

          {trigger === 'games' && (
            <div className="ml-6 flex items-center gap-2">
              <label className="text-xs text-gray-400">Cada</label>
              <input
                type="number"
                min={1}
                max={9999}
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value) || 10)}
                className="w-20 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <label className="text-xs text-gray-400">partidas jugadas</label>
            </div>
          )}

          <div className="border-t border-gray-800 pt-4 flex items-center gap-2">
            <label className="text-xs text-gray-400 shrink-0">Días mínimos entre encuestas:</label>
            <input
              type="number"
              min={1}
              max={365}
              value={cooldown}
              onChange={e => setCooldown(Number(e.target.value) || 30)}
              className="w-20 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <label className="text-xs text-gray-400">días</label>
          </div>
        </div>
      )}
    </div>
  )
}

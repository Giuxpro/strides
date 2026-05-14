'use client'

import { useState } from 'react'
import { updateModuleRetoConfig } from '@/app/admin/_actions'
import type { ModifierConfig } from '@strides/core/kids'
import { GAME_REGISTRY as GAME_POOL } from '@strides/core/kids'
import { SubmitButton } from './SubmitButton'

interface Props {
  moduleId: string
  initialGameId: string | null
  initialModifiers: ModifierConfig[] | null
  initialDiarioGameId: string | null
}

const GAME_OPTIONS = [
  { value: 'auto', label: 'Auto (según el tipo de reto)' },
  ...GAME_POOL.map(g => ({ value: g.id, label: `${g.emoji} ${g.title}` })),
]

export function RetoConfigForm({ moduleId, initialGameId, initialModifiers, initialDiarioGameId }: Props) {
  const mods = initialModifiers ?? []
  const initTimer      = mods.find((m): m is Extract<ModifierConfig, { type: 'timer' }> => m.type === 'timer')
  const initLives      = mods.find((m): m is Extract<ModifierConfig, { type: 'lives' }> => m.type === 'lives')
  const initMultiplier = mods.some(m => m.type === 'multiplier')

  const [timerOn,      setTimerOn]      = useState(!!initTimer)
  const [livesOn,      setLivesOn]      = useState(!!initLives)
  const [multiplierOn, setMultiplierOn] = useState(initMultiplier)
  const hasTermination = timerOn || livesOn

  const inputCls = 'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500'
  const labelCls = 'text-sm text-gray-400'

  return (
    <form action={updateModuleRetoConfig} className="space-y-6 max-w-md">
      <input type="hidden" name="module_id" value={moduleId} />

      {/* Diario game */}
      <div>
        <label className={`block ${labelCls} mb-2`}>Juego del reto diario</label>
        <select name="diario_game_id" defaultValue={initialDiarioGameId ?? 'auto'} className={`${inputCls} w-full`}>
          {GAME_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Contrarreloj game */}
      <div>
        <label className={`block ${labelCls} mb-2`}>Juego del contrarreloj</label>
        <select name="reto_game_id" defaultValue={initialGameId ?? 'auto'} className={`${inputCls} w-full`}>
          {GAME_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Modificadores del contrarreloj</p>

        {/* Timer */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="timer_enabled"
              checked={timerOn}
              onChange={e => setTimerOn(e.target.checked)}
              className="accent-violet-500 w-4 h-4"
            />
            <span className="text-sm text-gray-300">⏱️ Temporizador</span>
          </label>
          {timerOn && (
            <div className="pl-6">
              <label className={`block ${labelCls} mb-1`}>Segundos</label>
              <select name="timer_seconds" defaultValue={initTimer?.seconds ?? 60} className={inputCls}>
                <option value={30}>30s</option>
                <option value={60}>1 min</option>
                <option value={120}>2 min</option>
              </select>
            </div>
          )}
        </div>

        {/* Lives */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="lives_enabled"
              checked={livesOn}
              onChange={e => setLivesOn(e.target.checked)}
              className="accent-violet-500 w-4 h-4"
            />
            <span className="text-sm text-gray-300">❤️ Vidas</span>
          </label>
          {livesOn && (
            <div className="pl-6">
              <label className={`block ${labelCls} mb-1`}>Cantidad</label>
              <select name="lives_count" defaultValue={initLives?.count ?? 3} className={inputCls}>
                <option value={1}>1</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
              </select>
            </div>
          )}
        </div>

        {/* Multiplier */}
        <div className="space-y-1">
          <label className={`flex items-center gap-2 ${hasTermination ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
            <input
              type="checkbox"
              name="multiplier_enabled"
              checked={multiplierOn && hasTermination}
              onChange={e => setMultiplierOn(e.target.checked)}
              disabled={!hasTermination}
              className="accent-violet-500 w-4 h-4"
            />
            <span className="text-sm text-gray-300">⚡ Multiplicador</span>
          </label>
          {!hasTermination && (
            <p className="text-xs text-gray-600 pl-6">Requiere temporizador o vidas activados</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
      </div>
    </form>
  )
}

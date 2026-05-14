'use client'

import { updateModuleJugarConfig } from '@/app/admin/_actions'
import { GAME_REGISTRY as GAME_POOL } from '@strides/core/kids'
import { SubmitButton } from './SubmitButton'

interface Props {
  moduleId: string
  initialActiveGameIds: string[] | null
}

export function ModuleJugarConfigForm({ moduleId, initialActiveGameIds }: Props) {
  const allActive = initialActiveGameIds === null
  const inputCls = 'accent-violet-500 w-4 h-4'

  return (
    <form action={updateModuleJugarConfig} className="space-y-5 max-w-md">
      <input type="hidden" name="module_id" value={moduleId} />

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Juegos visibles en el tab Jugar
        </p>
        <p className="text-xs text-gray-600">
          Desactiva los juegos que no aplican a este módulo. Si todos están activos, se muestran todos.
        </p>

        {GAME_POOL.map(game => {
          const checked = allActive || initialActiveGameIds.includes(game.id)
          return (
            <label key={game.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="active_game_id"
                value={game.id}
                defaultChecked={checked}
                className={inputCls}
              />
              <span>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {game.emoji} {game.title}
                </span>
                <span className="block text-xs text-gray-600">{game.description}</span>
              </span>
            </label>
          )
        })}
      </div>

      <div className="flex items-center gap-4 pt-2">
        <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
      </div>
    </form>
  )
}

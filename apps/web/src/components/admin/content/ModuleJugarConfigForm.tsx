'use client'

import { useState } from 'react'
import { updateModuleJugarConfig } from '@/app/admin/_actions'
import { GAME_REGISTRY as GAME_POOL } from '@strides/core/kids'
import { SubmitButton } from '@/components/admin/shared/SubmitButton'
import { AdminPagination } from '@/components/admin/layout/AdminPagination'

const PAGE_SIZE = 10

interface Props {
  moduleId: string
  initialActiveGameIds: string[] | null
}

export function ModuleJugarConfigForm({ moduleId, initialActiveGameIds }: Props) {
  const allActive = initialActiveGameIds === null
  const [q, setQ] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = q.trim()
    ? GAME_POOL.filter(g =>
        g.title.toLowerCase().includes(q.toLowerCase()) ||
        g.description.toLowerCase().includes(q.toLowerCase())
      )
    : GAME_POOL

  const offset = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(offset, offset + PAGE_SIZE)

  return (
    <form action={updateModuleJugarConfig} className="space-y-4">
      <input type="hidden" name="module_id" value={moduleId} />

      {/* Buscador */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={e => { setQ(e.target.value); setCurrentPage(1) }}
          placeholder="Buscar juego..."
          className="w-full bg-gray-900 border border-gray-800 text-gray-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-600"
        />
      </div>

      {/* Tabla */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <th className="w-10 px-5 py-3"></th>
              <th className="text-left px-5 py-3">Juego</th>
              <th className="hidden sm:table-cell text-left px-5 py-3">Descripción</th>
              <th className="hidden md:table-cell text-center px-5 py-3">Items</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(game => {
              const checked = allActive || initialActiveGameIds.includes(game.id)
              return (
                <tr key={game.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      name="active_game_id"
                      value={game.id}
                      defaultChecked={checked}
                      className="accent-violet-500 w-4 h-4"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-200">{game.emoji} {game.title}</span>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-3 text-gray-500 text-xs">{game.description}</td>
                  <td className="hidden md:table-cell px-5 py-3 text-center text-xs text-gray-500 tabular-nums">
                    {game.minItems}–{game.maxItems}
                  </td>
                </tr>
              )
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-600 text-sm">
                  Sin resultados para &quot;{q}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <AdminPagination
          total={filtered.length}
          pageSize={PAGE_SIZE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <p className="text-xs text-gray-600">
        Desactiva los juegos que no aplican a este módulo. Si todos están activos, se muestran todos.
      </p>

      <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
    </form>
  )
}

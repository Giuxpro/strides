'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { toggleModulePublished, reorderModules, deleteModule } from '@/app/admin/_actions'
import { getStorageUrl } from '@strides/core'

interface ModuleRow {
  id: string
  title_es: string
  title_en: string
  slug: string
  is_published: boolean
  order: number
  cover_image_url: string | null
}

interface Props {
  modules: ModuleRow[]
  lessonCounts: Record<string, number>
  searchActive?: boolean
  footer?: React.ReactNode
}

function DragHandle() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" className="text-gray-600">
      <circle cx="2" cy="4"  r="1.5" /><circle cx="8" cy="4"  r="1.5" />
      <circle cx="2" cy="8"  r="1.5" /><circle cx="8" cy="8"  r="1.5" />
      <circle cx="2" cy="12" r="1.5" /><circle cx="8" cy="12" r="1.5" />
    </svg>
  )
}

export function SortableModuleList({ modules: initial, lessonCounts, searchActive = false, footer }: Props) {
  const [rows, setRows]           = useState(initial)
  const [dragId, setDragId]       = useState<string | null>(null)
  const [dropId, setDropId]       = useState<string | null>(null)
  const [editId, setEditId]       = useState<string | null>(null)
  const [editVal, setEditVal]     = useState('')

  const dragRef  = useRef<string | null>(null)
  const dropRef  = useRef<string | null>(null)
  const rowsRef  = useRef(rows)

  useEffect(() => { setRows(initial) }, [initial])
  useEffect(() => { rowsRef.current = rows }, [rows])

  function onDragStart(e: React.DragEvent, id: string) {
    dragRef.current = id
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    dropRef.current = id
    if (dropId !== id) setDropId(id)
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const from = dragRef.current
    const to   = dropRef.current
    dragRef.current = null
    dropRef.current = null
    setDragId(null)
    setDropId(null)
    if (!from || !to || from === to) return

    const arr     = [...rowsRef.current]
    const fromIdx = arr.findIndex(r => r.id === from)
    const toIdx   = arr.findIndex(r => r.id === to)
    if (fromIdx === -1 || toIdx === -1) return

    const [removed] = arr.splice(fromIdx, 1)
    if (!removed) return
    arr.splice(toIdx, 0, removed)
    setRows(arr)
    await reorderModules(arr.map((r, i) => ({ id: r.id, order: i + 1 })))
  }

  function onDragEnd() {
    dragRef.current = null
    dropRef.current = null
    setDragId(null)
    setDropId(null)
  }

  function startEdit(row: ModuleRow, idx: number) {
    setEditId(row.id)
    setEditVal(String(idx + 1))
  }

  async function commitEdit(row: ModuleRow) {
    const newPos = parseInt(editVal)
    setEditId(null)
    if (isNaN(newPos)) return

    const arr     = [...rowsRef.current]
    const fromIdx = arr.findIndex(r => r.id === row.id)
    if (fromIdx === -1) return
    const toIdx   = Math.max(0, Math.min(newPos - 1, arr.length - 1))
    if (fromIdx === toIdx) return

    const [removed] = arr.splice(fromIdx, 1)
    if (!removed) return
    arr.splice(toIdx, 0, removed)
    setRows(arr)
    await reorderModules(arr.map((r, i) => ({ id: r.id, order: i + 1 })))
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            {!searchActive && <th className="hidden sm:table-cell text-left px-3 py-3 w-8"></th>}
            {!searchActive && <th className="hidden sm:table-cell text-left px-3 py-3 w-10">#</th>}
            <th className="text-left px-4 sm:px-5 py-3">Módulo</th>
            <th className="hidden sm:table-cell text-left px-5 py-3">Slug</th>
            <th className="hidden sm:table-cell text-center px-5 py-3">Lecciones</th>
            <th className="text-center px-5 py-3">Estado</th>
            <th className="px-4 sm:px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((mod, idx) => {
            const isDragging   = dragId === mod.id
            const isDropTarget = dropId === mod.id && dragId !== mod.id
            const isEditingPos = editId === mod.id
            const coverUrl     = getStorageUrl(mod.cover_image_url)

            return (
              <tr
                key={mod.id}
                draggable={!searchActive}
                onDragStart={!searchActive ? e => onDragStart(e, mod.id) : undefined}
                onDragOver={!searchActive  ? e => onDragOver(e, mod.id) : undefined}
                onDrop={!searchActive      ? onDrop : undefined}
                onDragEnd={!searchActive   ? onDragEnd : undefined}
                className={[
                  'border-b border-gray-800/50 transition-colors',
                  isDragging   ? 'opacity-40 bg-gray-800/20'             : '',
                  isDropTarget ? 'bg-violet-950/25 border-l-2 border-l-violet-500' : 'hover:bg-white/[0.02]',
                ].join(' ')}
              >
                {/* Drag handle */}
                {!searchActive && (
                  <td className="hidden sm:table-cell px-3 py-3">
                    <div
                      className="flex items-center justify-center hover:text-gray-400 transition-colors"
                      style={{ cursor: dragId ? 'grabbing' : 'grab' }}
                    >
                      <DragHandle />
                    </div>
                  </td>
                )}

                {/* Order number (clicable) */}
                {!searchActive && (
                  <td className="hidden sm:table-cell px-3 py-3">
                    {isEditingPos ? (
                      <input
                        type="number"
                        value={editVal}
                        min={1}
                        max={rows.length}
                        autoFocus
                        onChange={e => setEditVal(e.target.value)}
                        onBlur={() => commitEdit(mod)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  { e.preventDefault(); commitEdit(mod) }
                          if (e.key === 'Escape') setEditId(null)
                        }}
                        className="w-9 text-center bg-gray-700 border border-violet-500 text-white text-xs rounded px-1 py-0.5 focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(mod, idx)}
                        title="Clic para cambiar posición"
                        className="w-6 h-6 flex items-center justify-center text-xs font-mono text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors"
                      >
                        {idx + 1}
                      </button>
                    )}
                  </td>
                )}

                {/* Title + cover thumbnail */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl}
                        alt={mod.title_es}
                        className="w-8 h-8 object-contain rounded shrink-0"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-800 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-white">{mod.title_es}</p>
                      <p className="text-xs text-gray-500">{mod.title_en}</p>
                    </div>
                  </div>
                </td>

                <td className="hidden sm:table-cell px-5 py-3 text-gray-400 font-mono text-xs">{mod.slug}</td>
                <td className="hidden sm:table-cell px-5 py-3 text-center text-gray-300">{lessonCounts[mod.id] ?? 0}</td>

                {/* Published toggle */}
                <td className="px-5 py-3 text-center">
                  <form action={toggleModulePublished.bind(null, mod.id, !mod.is_published)}>
                    <button
                      type="submit"
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        mod.is_published
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {mod.is_published ? 'Publicado' : 'Borrador'}
                    </button>
                  </form>
                </td>

                <td className="px-4 sm:px-5 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/content/${mod.id}`}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Ver →
                    </Link>
                    <Link
                      href={`/admin/content/${mod.id}/edit?from=list`}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Editar
                    </Link>
                    <form
                      action={deleteModule}
                      onSubmit={e => {
                        if (!confirm(`¿Eliminar el módulo "${mod.title_es}"? Se borrarán sus lecciones, vocabulario, ejercicios y el progreso asociado. Esta acción no se puede deshacer.`)) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <input type="hidden" name="module_id" value={mod.id} />
                      <button type="submit" className="text-xs text-red-800 hover:text-red-500 transition-colors">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {footer}
    </div>
  )
}

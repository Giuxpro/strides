'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { toggleLessonPublished, deleteLesson, reorderLessons } from '@/app/admin/_actions'

interface LessonRow {
  id: string
  title_es: string
  title_en: string
  order: number
  is_published: boolean
  cover_url: string | null
}

interface Props {
  moduleId: string
  lessons: LessonRow[]
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

export function SortableLessonList({ moduleId, lessons: initial }: Props) {
  const [rows, setRows]       = useState(initial)
  const [dragId, setDragId]   = useState<string | null>(null)
  const [dropId, setDropId]   = useState<string | null>(null)
  const [editId, setEditId]   = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  const dragRef = useRef<string | null>(null)
  const dropRef = useRef<string | null>(null)
  const rowsRef = useRef(rows)

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
    await reorderLessons(moduleId, arr.map((r, i) => ({ id: r.id, order: i + 1 })))
  }

  function onDragEnd() {
    dragRef.current = null
    dropRef.current = null
    setDragId(null)
    setDropId(null)
  }

  function startEdit(row: LessonRow, idx: number) {
    setEditId(row.id)
    setEditVal(String(idx + 1))
  }

  async function commitEdit(row: LessonRow) {
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
    await reorderLessons(moduleId, arr.map((r, i) => ({ id: r.id, order: i + 1 })))
  }

  if (rows.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-8 text-center text-gray-600">
        Sin lecciones.{' '}
        <Link href={`/admin/content/${moduleId}/lessons/new`} className="text-violet-400 hover:text-violet-300">
          Crear la primera →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            <th className="text-left px-3 py-3 w-8"></th>
            <th className="text-left px-3 py-3 w-10">#</th>
            <th className="text-left px-5 py-3">Lección</th>
            <th className="text-center px-5 py-3">Estado</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lesson, idx) => {
            const isDragging   = dragId === lesson.id
            const isDropTarget = dropId === lesson.id && dragId !== lesson.id
            const isEditingPos = editId === lesson.id

            return (
              <tr
                key={lesson.id}
                draggable
                onDragStart={e => onDragStart(e, lesson.id)}
                onDragOver={e  => onDragOver(e, lesson.id)}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                className={[
                  'border-b border-gray-800/50 transition-colors',
                  isDragging   ? 'opacity-40 bg-gray-800/20'             : '',
                  isDropTarget ? 'bg-violet-950/25 border-l-2 border-l-violet-500' : 'hover:bg-white/[0.02]',
                ].join(' ')}
              >
                {/* Drag handle */}
                <td className="px-3 py-3">
                  <div
                    className="flex items-center justify-center hover:text-gray-400 transition-colors"
                    style={{ cursor: dragId ? 'grabbing' : 'grab' }}
                  >
                    <DragHandle />
                  </div>
                </td>

                {/* Order number (clicable) */}
                <td className="px-3 py-3">
                  {isEditingPos ? (
                    <input
                      type="number"
                      value={editVal}
                      min={1}
                      max={rows.length}
                      autoFocus
                      onChange={e => setEditVal(e.target.value)}
                      onBlur={() => commitEdit(lesson)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  { e.preventDefault(); commitEdit(lesson) }
                        if (e.key === 'Escape') setEditId(null)
                      }}
                      className="w-9 text-center bg-gray-700 border border-violet-500 text-white text-xs rounded px-1 py-0.5 focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(lesson, idx)}
                      title="Clic para cambiar posición"
                      className="w-6 h-6 flex items-center justify-center text-xs font-mono text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                      {idx + 1}
                    </button>
                  )}
                </td>

                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {lesson.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lesson.cover_url}
                        alt={lesson.title_es}
                        className="w-8 h-8 object-cover rounded shrink-0"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-800 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-white">{lesson.title_es}</p>
                      <p className="text-xs text-gray-500">{lesson.title_en}</p>
                    </div>
                  </div>
                </td>

                {/* Published toggle */}
                <td className="px-5 py-3 text-center">
                  <form action={toggleLessonPublished.bind(null, lesson.id, !lesson.is_published)}>
                    <button
                      type="submit"
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        lesson.is_published
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {lesson.is_published ? 'Publicada' : 'Borrador'}
                    </button>
                  </form>
                </td>

                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/content/${moduleId}/lessons/${lesson.id}/edit`}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Editar
                    </Link>
                    <form action={deleteLesson}>
                      <input type="hidden" name="lesson_id" value={lesson.id} />
                      <input type="hidden" name="module_id" value={moduleId} />
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
    </div>
  )
}

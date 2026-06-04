'use client'

import { useState, useEffect, useRef } from 'react'
import { addLessonStep, updateLessonStep, deleteLessonStep, reorderLessonSteps } from '@/app/admin/_actions'
import { VocabPicker, type VocabItemWithUsage } from './VocabPicker'
import { GAME_REGISTRY as GAME_POOL } from '@strides/core/kids'
import { SubmitButton } from '@/components/admin/shared/SubmitButton'

type StepType = 'video' | 'slide' | 'exercise'

interface AdminStep {
  id: string
  position: number
  step_type: StepType
  title: string | null
  config: Record<string, string>
  exercise: {
    id: string
    type: string
    phase: 'practice' | 'evaluation'
    vocabIds: string[]
  } | null
}

interface Props {
  lessonId: string
  moduleId: string
  steps: AdminStep[]
  vocabItems: VocabItemWithUsage[]
}

const ICONS:  Record<StepType, string> = { video: '🎬', slide: '🖼️', exercise: '🎮' }
const LABELS: Record<StepType, string> = { video: 'Video', slide: 'Diapositiva', exercise: 'Ejercicio' }

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

function stepSummary(step: AdminStep): string {
  if (step.step_type === 'video') return step.config.caption ?? step.config.url ?? '—'
  if (step.step_type === 'slide') return step.config.text_en ?? '—'
  if (step.step_type === 'exercise' && step.exercise) {
    const game = GAME_POOL.find(g => g.id === step.exercise!.type)
    const label = game ? game.title : step.exercise.type
    const words = step.exercise.vocabIds.length
    return `${label} · ${step.exercise.phase === 'evaluation' ? 'Evaluación' : 'Práctica'} · ${words} palabras`
  }
  return '—'
}

function DragHandle() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
      <circle cx="2" cy="4"  r="1.5" /><circle cx="8" cy="4"  r="1.5" />
      <circle cx="2" cy="8"  r="1.5" /><circle cx="8" cy="8"  r="1.5" />
      <circle cx="2" cy="12" r="1.5" /><circle cx="8" cy="12" r="1.5" />
    </svg>
  )
}

// ── Edit form shown below a step when expanded ─────────────────────────────

function StepEditForm({
  step, lessonId, moduleId, vocab, onClose,
}: {
  step: AdminStep
  lessonId: string
  moduleId: string
  vocab: VocabItemWithUsage[]
  onClose: () => void
}) {
  return (
    <div className="bg-gray-900 border border-violet-800/40 rounded-xl p-4 space-y-3 -mt-0.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">
          {ICONS[step.step_type]} Editar {LABELS[step.step_type]}
        </p>
        <button type="button" onClick={onClose} className="text-xs text-gray-500 hover:text-gray-300">
          Cancelar
        </button>
      </div>

      <form action={updateLessonStep} onSubmit={onClose} className="space-y-3">
        <input type="hidden" name="step_id"   value={step.id} />
        <input type="hidden" name="lesson_id" value={lessonId} />
        <input type="hidden" name="module_id" value={moduleId} />
        <input type="hidden" name="step_type" value={step.step_type} />

        <div>
          <label className={L}>Título del paso (opcional)</label>
          <input name="title" defaultValue={step.title ?? ''} placeholder="Ej: Introducción" className={I} />
        </div>

        {step.step_type === 'video' && (
          <>
            <div>
              <label className={L}>URL del video <span className="text-red-500">*</span></label>
              <input name="url" required defaultValue={step.config.url ?? ''} placeholder="https://youtube.com/watch?v=..." className={I} />
            </div>
            <div>
              <label className={L}>Descripción (opcional)</label>
              <input name="caption" defaultValue={step.config.caption ?? ''} placeholder="¿Qué aprenderá el niño?" className={I} />
            </div>
          </>
        )}

        {step.step_type === 'slide' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={L}>Texto en inglés <span className="text-red-500">*</span></label>
                <input name="text_en" required defaultValue={step.config.text_en ?? ''} placeholder="Hello!" className={I} />
              </div>
              <div>
                <label className={L}>Texto en español <span className="text-red-500">*</span></label>
                <input name="text_es" required defaultValue={step.config.text_es ?? ''} placeholder="¡Hola!" className={I} />
              </div>
            </div>
            <div>
              <label className={L}>URL de imagen (opcional)</label>
              <input name="image_url" defaultValue={step.config.image_url ?? ''} placeholder="https://..." className={I} />
            </div>
          </>
        )}

        {step.step_type === 'exercise' && step.exercise && (
          <>
            <input type="hidden" name="exercise_id" value={step.exercise.id} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={L}>Tipo <span className="text-red-500">*</span></label>
                <select name="exercise_type" defaultValue={step.exercise.type} className={I}>
                  {GAME_POOL.map(g => (
                    <option key={g.id} value={g.id}>{g.emoji} {g.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={L}>Fase <span className="text-red-500">*</span></label>
                <select name="exercise_phase" defaultValue={step.exercise.phase} className={I}>
                  <option value="practice">Práctica</option>
                  <option value="evaluation">Evaluación</option>
                </select>
              </div>
            </div>
            {vocab.length > 0 ? (
              <div>
                <label className={L}>Vocabulario <span className="text-red-500">*</span></label>
                <VocabPicker items={vocab} initialSelected={step.exercise.vocabIds} />
              </div>
            ) : (
              <p className="text-xs text-gray-600">Sin vocabulario en este módulo.</p>
            )}
          </>
        )}

        <div className="flex items-center gap-3 pt-1">
          <SubmitButton label="Guardar cambios" />
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Main builder ────────────────────────────────────────────────────────────

export function LessonStepBuilder({ lessonId, moduleId, steps, vocabItems }: Props) {
  const [localSteps, setLocalSteps] = useState<AdminStep[]>(steps)
  const [dragId,      setDragId]    = useState<string | null>(null)
  const [dropId,      setDropId]    = useState<string | null>(null)
  const [editPosId,   setEditPosId] = useState<string | null>(null)
  const [editPosVal,  setEditPosVal] = useState('')
  const [expandedId,  setExpandedId] = useState<string | null>(null)
  const [adding,      setAdding]    = useState<StepType | null>(null)

  const dragIdRef     = useRef<string | null>(null)
  const dropIdRef     = useRef<string | null>(null)
  const localStepsRef = useRef<AdminStep[]>(steps)

  useEffect(() => { setLocalSteps(steps) },          [steps])
  useEffect(() => { localStepsRef.current = localSteps }, [localSteps])

  // ── Drag ──────────────────────────────────────────────────────────────────

  function onDragStart(e: React.DragEvent, id: string) {
    dragIdRef.current = id
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dropIdRef.current = id
    if (dropId !== id) setDropId(id)
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const from = dragIdRef.current
    const to   = dropIdRef.current
    dragIdRef.current = null
    dropIdRef.current = null
    setDragId(null)
    setDropId(null)

    if (!from || !to || from === to) return

    const arr     = [...localStepsRef.current]
    const fromIdx = arr.findIndex(s => s.id === from)
    const toIdx   = arr.findIndex(s => s.id === to)
    if (fromIdx === -1 || toIdx === -1) return

    const removed = arr.splice(fromIdx, 1)[0]
    if (!removed) return
    arr.splice(toIdx, 0, removed)

    setLocalSteps(arr)
    await reorderLessonSteps(lessonId, moduleId, arr.map((s, i) => ({ id: s.id, position: i + 1 })))
  }

  function onDragEnd() {
    dragIdRef.current = null
    dropIdRef.current = null
    setDragId(null)
    setDropId(null)
  }

  // ── Position edit ─────────────────────────────────────────────────────────

  function startPosEdit(step: AdminStep, idx: number) {
    setEditPosId(step.id)
    setEditPosVal(String(idx + 1))
  }

  async function commitPosEdit(step: AdminStep) {
    const newPos = parseInt(editPosVal)
    setEditPosId(null)
    if (isNaN(newPos)) return

    const arr     = [...localStepsRef.current]
    const fromIdx = arr.findIndex(s => s.id === step.id)
    if (fromIdx === -1) return
    const toIdx   = Math.max(0, Math.min(newPos - 1, arr.length - 1))
    if (fromIdx === toIdx) return

    const removed = arr.splice(fromIdx, 1)[0]
    if (!removed) return
    arr.splice(toIdx, 0, removed)

    setLocalSteps(arr)
    await reorderLessonSteps(lessonId, moduleId, arr.map((s, i) => ({ id: s.id, position: i + 1 })))
  }

  // ─────────────────────────────────────────────────────────────────────────

  const nextPosition = localSteps.length + 1

  return (
    <div className="space-y-1.5">
      {localSteps.map((step, idx) => {
        const isDragging   = dragId === step.id
        const isDropTarget = dropId === step.id && dragId !== step.id
        const isEditingPos = editPosId === step.id
        const isExpanded   = expandedId === step.id

        return (
          <div key={step.id} className="space-y-1">
            {/* Step row */}
            <div
              draggable
              onDragStart={e => onDragStart(e, step.id)}
              onDragOver={e  => onDragOver(e, step.id)}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-3 border transition-colors',
                isDragging
                  ? 'opacity-40 border-dashed border-gray-600 bg-gray-800/20'
                  : isDropTarget
                    ? 'border-violet-500 bg-violet-950/25 shadow-[0_0_0_2px_rgba(124,58,237,0.2)]'
                    : isExpanded
                      ? 'border-violet-800/60 bg-gray-800/60'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600',
              ].join(' ')}
            >
              {/* Drag handle */}
              <div
                className="text-gray-600 hover:text-gray-400 transition-colors shrink-0 py-1"
                style={{ cursor: dragId ? 'grabbing' : 'grab' }}
              >
                <DragHandle />
              </div>

              {/* Position — click to edit */}
              {isEditingPos ? (
                <input
                  type="number"
                  value={editPosVal}
                  min={1}
                  max={localSteps.length}
                  autoFocus
                  onChange={e => setEditPosVal(e.target.value)}
                  onBlur={() => commitPosEdit(step)}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  { e.preventDefault(); commitPosEdit(step) }
                    if (e.key === 'Escape') setEditPosId(null)
                  }}
                  className="w-9 text-center bg-gray-700 border border-violet-500 text-white text-xs rounded px-1 py-0.5 focus:outline-none shrink-0"
                />
              ) : (
                <button
                  onClick={() => startPosEdit(step, idx)}
                  title="Clic para cambiar posición"
                  className="w-6 h-6 flex items-center justify-center text-xs font-mono text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors shrink-0"
                >
                  {idx + 1}
                </button>
              )}

              {/* Type icon */}
              <span className="text-lg shrink-0">{ICONS[step.step_type]}</span>

              {/* Summary */}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {LABELS[step.step_type]}
                </span>
                {step.title && (
                  <p className="text-sm text-white font-medium leading-tight">{step.title}</p>
                )}
                <p className="text-xs text-gray-500 truncate">{stepSummary(step)}</p>
              </div>

              {/* Edit toggle */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : step.id)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors shrink-0 ${
                  isExpanded
                    ? 'border-violet-600 text-violet-400 bg-violet-950/30'
                    : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500'
                }`}
              >
                {isExpanded ? 'Cerrar' : 'Editar'}
              </button>

              {/* Delete */}
              <form action={deleteLessonStep}>
                <input type="hidden" name="step_id"   value={step.id} />
                <input type="hidden" name="lesson_id" value={lessonId} />
                <input type="hidden" name="module_id" value={moduleId} />
                <button
                  type="submit"
                  className="w-7 h-7 flex items-center justify-center rounded text-red-800 hover:text-red-400 hover:bg-gray-700 transition-colors text-base shrink-0"
                  aria-label="Eliminar paso"
                >
                  ×
                </button>
              </form>
            </div>

            {/* Expanded edit panel */}
            {isExpanded && (
              <StepEditForm
                step={step}
                lessonId={lessonId}
                moduleId={moduleId}
                vocab={vocabItems}
                onClose={() => setExpandedId(null)}
              />
            )}
          </div>
        )
      })}

      {localSteps.length === 0 && (
        <p className="text-sm text-gray-600 py-6 text-center">
          Sin pasos. Añade el primero abajo.
        </p>
      )}

      {/* ── Add step ──────────────────────────────────────────────────────── */}
      {adding === null ? (
        <div className="flex flex-wrap gap-2 pt-2">
          {(['video', 'slide', 'exercise'] as StepType[]).map(type => (
            <button
              key={type}
              onClick={() => { setAdding(type); setExpandedId(null) }}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 border border-violet-800/50 hover:border-violet-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              {ICONS[type]} + {LABELS[type]}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-violet-800/40 rounded-xl p-4 space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              {ICONS[adding]} Añadir {LABELS[adding]}
            </p>
            <button onClick={() => setAdding(null)} className="text-xs text-gray-500 hover:text-gray-300">
              Cancelar
            </button>
          </div>

          <form action={addLessonStep} onSubmit={() => setAdding(null)} className="space-y-3">
            <input type="hidden" name="lesson_id" value={lessonId} />
            <input type="hidden" name="module_id" value={moduleId} />
            <input type="hidden" name="step_type" value={adding} />
            <input type="hidden" name="position"  value={String(nextPosition)} />

            <div>
              <label className={L}>Título del paso (opcional)</label>
              <input name="title" placeholder="Ej: Introducción" className={I} />
            </div>

            {adding === 'video' && (
              <>
                <div>
                  <label className={L}>URL del video <span className="text-red-500">*</span></label>
                  <input name="url" required placeholder="https://youtube.com/watch?v=..." className={I} />
                  <p className="text-xs text-gray-600 mt-1">YouTube, Vimeo o URL directa.</p>
                </div>
                <div>
                  <label className={L}>Descripción (opcional)</label>
                  <input name="caption" placeholder="¿Qué aprenderá el niño?" className={I} />
                </div>
              </>
            )}

            {adding === 'slide' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={L}>Texto en inglés <span className="text-red-500">*</span></label>
                    <input name="text_en" required placeholder="Hello!" className={I} />
                  </div>
                  <div>
                    <label className={L}>Texto en español <span className="text-red-500">*</span></label>
                    <input name="text_es" required placeholder="¡Hola!" className={I} />
                  </div>
                </div>
                <div>
                  <label className={L}>URL de imagen (opcional)</label>
                  <input name="image_url" placeholder="https://..." className={I} />
                </div>
              </div>
            )}

            {adding === 'exercise' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={L}>Tipo <span className="text-red-500">*</span></label>
                    <select name="exercise_type" className={I}>
                      {GAME_POOL.map(g => (
                        <option key={g.id} value={g.id}>{g.emoji} {g.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={L}>Fase <span className="text-red-500">*</span></label>
                    <select name="exercise_phase" className={I}>
                      <option value="practice">Práctica</option>
                      <option value="evaluation">Evaluación</option>
                    </select>
                  </div>
                </div>
                {vocabItems.length > 0 ? (
                  <div>
                    <label className={L}>Vocabulario <span className="text-red-500">*</span></label>
                    <VocabPicker items={vocabItems} />
                  </div>
                ) : (
                  <p className="text-xs text-gray-600">Sin vocabulario en este módulo. Añade vocab primero.</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <SubmitButton label="Añadir paso" pendingLabel="Añadiendo…" />
              <button
                type="button"
                onClick={() => setAdding(null)}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState } from 'react'

type Props = {
  initialVariant: string
  initialTrialDays: number
  initialPreviewConfig: { scope: 'module' | 'lessons'; lessons_count: number }
}

const OPTIONS = [
  {
    value: 'a',
    badge: 'A',
    label: 'Pago anticipado',
    description: 'El usuario paga antes de acceder al producto.',
  },
  {
    value: 'b',
    badge: 'B',
    label: 'Trial gratuito',
    description: 'El usuario prueba gratis y paga al vencer el período.',
  },
  {
    value: 'c',
    badge: 'C',
    label: 'Vista previa gratuita',
    description: 'El usuario accede a una sección gratuita y paga para continuar.',
  },
] as const

export function AcquisitionSelector({ initialVariant, initialTrialDays, initialPreviewConfig }: Props) {
  const [variant, setVariant] = useState<'a' | 'b' | 'c'>(
    initialVariant === 'b' ? 'b' : initialVariant === 'c' ? 'c' : 'a'
  )
  const [previewScope, setPreviewScope] = useState<'module' | 'lessons'>(initialPreviewConfig.scope)

  return (
    <div className="space-y-3">
      {OPTIONS.map((opt) => {
        const selected = variant === opt.value
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-3 cursor-pointer p-3.5 rounded-lg border transition-all ${
              selected ? 'border-violet-500 bg-violet-500/5' : 'border-gray-700 hover:border-gray-600'
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
                  <label htmlFor="trial_days" className="text-xs text-gray-400 shrink-0">Días de trial</label>
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

              {opt.value === 'c' && selected && (
                <div className="mt-3 pt-3 border-t border-gray-700/60 space-y-3">
                  <div className="flex gap-2">
                    <label className={`flex-1 flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border text-xs transition-all ${previewScope === 'module' ? 'border-violet-500 bg-violet-500/5 text-gray-200' : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}>
                      <input
                        type="radio"
                        name="preview_scope"
                        value="module"
                        checked={previewScope === 'module'}
                        onChange={() => setPreviewScope('module')}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-violet-500"
                      />
                      Primer módulo completo
                    </label>
                    <label className={`flex-1 flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border text-xs transition-all ${previewScope === 'lessons' ? 'border-violet-500 bg-violet-500/5 text-gray-200' : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}>
                      <input
                        type="radio"
                        name="preview_scope"
                        value="lessons"
                        checked={previewScope === 'lessons'}
                        onChange={() => setPreviewScope('lessons')}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-violet-500"
                      />
                      Primeras N lecciones
                    </label>
                  </div>

                  {previewScope === 'lessons' && (
                    <div className="flex items-center gap-3">
                      <label htmlFor="preview_lessons_count" className="text-xs text-gray-400 shrink-0">Lecciones gratuitas</label>
                      <input
                        id="preview_lessons_count"
                        name="preview_lessons_count"
                        type="number"
                        min={1}
                        max={20}
                        defaultValue={initialPreviewConfig.lessons_count}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </label>
        )
      })}

      {variant !== 'b' && <input type="hidden" name="trial_days" value={initialTrialDays} />}
      {variant !== 'c' && <input type="hidden" name="preview_scope" value={initialPreviewConfig.scope} />}
      {variant !== 'c' && <input type="hidden" name="preview_lessons_count" value={initialPreviewConfig.lessons_count} />}
    </div>
  )
}

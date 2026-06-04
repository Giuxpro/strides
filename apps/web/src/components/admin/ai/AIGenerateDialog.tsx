'use client'

import { useState, useTransition } from 'react'
import { generateAIContent } from '@/app/admin/_actions'

interface ModuleOption {
  id: string
  title_es: string
}

interface Props {
  modules: ModuleOption[]
}

function isNextInternalError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'digest' in err
}

export function AIGenerateDialog({ modules }: Props) {
  const [open, setOpen]   = useState(false)
  const [mode, setMode]   = useState<'full-module' | 'lessons-vocab' | 'vocab-only'>('full-module')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await generateAIContent(formData)
      } catch (err) {
        if (isNextInternalError(err)) throw err
        setError(err instanceof Error ? err.message : 'Error al generar contenido')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
      >
        Generar con IA
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => !isPending && setOpen(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h2 className="text-base font-semibold text-white">Generar contenido con IA</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="text-gray-500 hover:text-gray-300 disabled:opacity-40 text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <input type="hidden" name="mode" value={mode} />

                {/* Mode toggle */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Modo</label>
                  <div className="flex gap-2">
                    {(['full-module', 'lessons-vocab', 'vocab-only'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                          mode === m
                            ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                            : 'border-gray-700 text-gray-500 hover:border-gray-600'
                        }`}
                      >
                        {m === 'full-module' ? 'Módulo completo' : m === 'lessons-vocab' ? 'Lecciones' : 'Solo vocab'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">
                    {mode === 'full-module'
                      ? 'Crea módulo + lecciones + vocabulario de cero'
                      : mode === 'lessons-vocab'
                      ? 'Agrega lecciones + vocab a un módulo existente'
                      : 'Agrega palabras a un módulo existente'}
                  </p>
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tema</label>
                  <input
                    name="topic"
                    required
                    placeholder="Ej: Animals, Colors, Food..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Age range */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Edad objetivo</label>
                  <select
                    name="age_range"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
                  >
                    <option value="4-5">4–5 años</option>
                    <option value="6-7">6–7 años</option>
                  </select>
                </div>

                {mode !== 'full-module' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Módulo existente</label>
                    <select
                      name="module_id"
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
                    >
                      {modules.length === 0 ? (
                        <option value="" disabled>Sin módulos — creá uno primero</option>
                      ) : (
                        modules.map(m => (
                          <option key={m.id} value={m.id}>{m.title_es}</option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {mode === 'vocab-only' ? (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Cantidad de palabras</label>
                    <input
                      name="word_count"
                      type="number"
                      min={1}
                      max={30}
                      defaultValue={10}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">Lecciones</label>
                      <input
                        name="lesson_count"
                        type="number"
                        min={1}
                        max={5}
                        defaultValue={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">Vocab por lección</label>
                      <input
                        name="vocab_per_lesson"
                        type="number"
                        min={4}
                        max={15}
                        defaultValue={8}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                )}

                {/* Style (optional) */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Estilo <span className="text-gray-600">(opcional)</span>
                  </label>
                  <input
                    name="style"
                    placeholder="Ej: formal, lúdico, con ejemplos de oraciones..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending || (mode !== 'full-module' && modules.length === 0)}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
                >
                  {isPending ? 'Generando...' : 'Generar'}
                </button>

                {isPending && (
                  <p className="text-xs text-center text-gray-600">
                    Esto puede tardar unos segundos según el modelo y la cantidad de contenido...
                  </p>
                )}
              </form>
            </div>
          </div>
        </>
      )}
    </>
  )
}

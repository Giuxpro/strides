'use client'

import { useState } from 'react'
import { submitFeedback } from '@/app/account/_actions'

type FeedbackType = 'bug' | 'suggestion' | 'rating'

const TYPES: { id: FeedbackType; emoji: string; label: string; placeholder: string }[] = [
  { id: 'bug',        emoji: '🐛', label: 'Bug',       placeholder: '¿Qué falló? ¿Cómo se reproduce?' },
  { id: 'suggestion', emoji: '💡', label: 'Sugerencia', placeholder: '¿Qué mejorarías o agregarías?' },
  { id: 'rating',     emoji: '❤️', label: 'Me gusta',  placeholder: '¿Qué es lo que más te gusta? (opcional)' },
]

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>('suggestion')
  const [submitted, setSubmitted] = useState(false)
  const selected = TYPES.find(t => t.id === type)!

  async function handleSubmit(formData: FormData) {
    await submitFeedback(formData)
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {submitted ? (
          <div className="text-center py-8">
            <p className="text-5xl mb-3">🙏</p>
            <p className="text-lg font-bold text-white mb-1">¡Gracias!</p>
            <p className="text-sm text-gray-400">Tu feedback nos ayuda a mejorar Strides.</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Enviar feedback</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300 transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex gap-2 mb-5">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-xs font-semibold ${
                    type === t.id
                      ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                      : 'border-gray-700 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <form action={handleSubmit} className="space-y-4">
              <input type="hidden" name="type" value={type} />
              <input
                type="hidden"
                name="context_url"
                value={typeof window !== 'undefined' ? window.location.pathname : ''}
              />

              <textarea
                name="message"
                required={type !== 'rating'}
                rows={4}
                placeholder={selected.placeholder}
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder-gray-600"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors"
              >
                Enviar
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

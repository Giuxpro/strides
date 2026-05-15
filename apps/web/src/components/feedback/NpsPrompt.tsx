'use client'

import { useState } from 'react'
import { submitFeedback } from '@/app/account/_actions'

export function NpsPrompt({ onClose }: { onClose: () => void }) {
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(formData: FormData) {
    if (stars === 0) return
    await submitFeedback(formData)
    setSubmitted(true)
    setTimeout(onClose, 2000)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl text-center animate-slide-up">
        {submitted ? (
          <div className="py-4">
            <p className="text-5xl mb-2">🎉</p>
            <p className="font-bold text-gray-800 text-base">¡Gracias por tu opinión!</p>
            <p className="text-xs text-gray-500 mt-1">Nos ayuda a mejorar Strides cada día.</p>
          </div>
        ) : (
          <>
            <p className="text-3xl mb-2">🌟</p>
            <h2 className="text-base font-extrabold text-gray-800 mb-1">¿Cómo va tu experiencia?</h2>
            <p className="text-xs text-gray-500 mb-5">Toca una estrella para calificar Strides</p>

            <form action={handleSubmit} className="space-y-4">
              <input type="hidden" name="type" value="rating" />
              <input type="hidden" name="stars" value={String(stars)} />
              <input type="hidden" name="context_url" value={typeof window !== 'undefined' ? window.location.pathname : ''} />

              <div className="flex justify-center gap-3 mb-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    className="text-4xl w-10 h-10 flex items-center justify-center transition-transform hover:scale-125 active:scale-95 cursor-pointer"
                  >
                    {n <= (hovered || stars) ? '⭐' : '☆'}
                  </button>
                ))}
              </div>

              <textarea
                name="message"
                rows={2}
                placeholder="Cuéntanos más... (opcional)"
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-violet-400 placeholder-gray-400"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Ahora no
                </button>
                <button
                  type="submit"
                  disabled={stars === 0}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Enviar
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

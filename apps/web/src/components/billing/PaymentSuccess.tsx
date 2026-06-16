'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const REDIRECT_MS = 3500

export function PaymentSuccess({ redirectTo = '/select-profile' }: { redirectTo?: string }) {
  const router = useRouter()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const enter = requestAnimationFrame(() => setShown(true))
    const t = setTimeout(() => {
      router.push(redirectTo)
      router.refresh()
    }, REDIRECT_MS)
    return () => {
      cancelAnimationFrame(enter)
      clearTimeout(t)
    }
  }, [router, redirectTo])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)' }}
    >
      <div className={`transition-all duration-500 ${shown ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
          <div
            className={`w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg transition-transform duration-500 ${
              shown ? 'scale-100' : 'scale-0'
            }`}
            style={{ transitionDelay: '150ms' }}
          >
            <span className="text-white text-4xl leading-none">✓</span>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
          ¡Pago completado! 🎉
        </h1>
        <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
          Tu suscripción está activa. Ya puedes seguir aprendiendo inglés sin límites.
        </p>

        <div className="w-48 h-1.5 bg-white/70 rounded-full overflow-hidden mx-auto">
          <div
            className="h-full bg-violet-500 rounded-full ease-linear"
            style={{ width: shown ? '100%' : '0%', transitionProperty: 'width', transitionDuration: `${REDIRECT_MS}ms` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-3">Te llevamos a tus perfiles…</p>
      </div>
    </div>
  )
}

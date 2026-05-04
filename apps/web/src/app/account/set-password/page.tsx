'use client'

import { useState } from 'react'
import { setNewPassword } from '@/app/actions/auth'
import { Nunito } from 'next/font/google'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-nunito',
})

const I = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent'
const L = 'block text-xs font-semibold text-gray-500 mb-1.5'

export default function SetPasswordPage() {
  const [error, setPwError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleAction(formData: FormData) {
    const password = formData.get('password') as string
    const confirm  = formData.get('confirm') as string

    if (password !== confirm) { setPwError('Las contraseñas no coinciden'); return }
    if (password.length < 8)  { setPwError('Mínimo 8 caracteres'); return }

    setPwError(null)
    setPending(true)
    const result = await setNewPassword(formData)
    if (result?.error) {
      setPwError(result.error)
      setPending(false)
    }
  }

  return (
    <div
      className={`${nunito.variable} min-h-screen flex items-center justify-center p-6`}
      style={{
        fontFamily: 'var(--font-nunito)',
        background: 'linear-gradient(135deg, #EDE0FF 0%, #E0D5FF 30%, #D5D2FF 60%, #CBE4FF 100%)',
      }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-7">
          <h1
            className="font-black tracking-tight"
            style={{
              fontSize: 40,
              background: 'linear-gradient(135deg, #6D28D9, #4338CA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'var(--font-nunito)',
            }}
          >
            Strides
          </h1>
          <p className="font-semibold mt-1" style={{ fontSize: 13, color: '#7C5DBF' }}>
            Inglés para toda la familia 🚀
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 24px 64px rgba(109,40,217,0.12), 0 4px 20px rgba(109,40,217,0.08)',
          }}
        >
          <div
            className="h-1 rounded-full mb-7 -mt-1"
            style={{ background: 'linear-gradient(90deg, #7C3AED, #6366F1, #3B82F6)' }}
          />

          <h2 className="font-bold mb-1 text-gray-900" style={{ fontSize: 22 }}>
            Nueva contraseña 🔐
          </h2>
          <p className="mb-7" style={{ fontSize: 13, color: '#9CA3AF' }}>
            Elige una contraseña segura de al menos 8 caracteres.
          </p>

          <form action={handleAction} className="space-y-5">
            <div>
              <label className={L}>Nueva contraseña</label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className={I}
              />
            </div>

            <div>
              <label className={L}>Confirmar contraseña</label>
              <input
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className={I}
              />
            </div>

            {error && (
              <p
                className="text-xs font-semibold rounded-lg px-3 py-2"
                style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)' }}
            >
              {pending ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}

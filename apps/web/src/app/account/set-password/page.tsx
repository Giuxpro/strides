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

const I = 'w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent'
const L = 'block text-xs font-semibold text-gray-500 mb-1.5'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

function PasswordInput({ name, placeholder, autoComplete }: { name: string; placeholder: string; autoComplete: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        name={name}
        type={show ? 'text' : 'password'}
        required
        minLength={8}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={I}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

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
              <PasswordInput name="password" placeholder="••••••••" autoComplete="new-password" />
            </div>

            <div>
              <label className={L}>Confirmar contraseña</label>
              <PasswordInput name="confirm" placeholder="••••••••" autoComplete="new-password" />
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

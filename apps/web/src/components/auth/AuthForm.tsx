'use client'

import { useState } from 'react'

interface AuthFormProps {
  action: (formData: FormData) => Promise<{ error: string } | void>
  submitLabel: string
  dark?: boolean
}

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

export function AuthForm({ action, submitLabel, dark = false }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const t = dark ? {
    label:       'rgba(255,255,255,0.55)',
    inputBg:     'rgba(255,255,255,0.06)',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputText:   '#fff',
    focusBorder: 'rgba(124,58,237,0.8)',
    eyeColor:    'rgba(255,255,255,0.35)',
    errBg:       'rgba(239,68,68,0.12)',
    errText:     '#fca5a5',
  } : {
    label:       '#6D28D9',
    inputBg:     '#FAFAFF',
    inputBorder: '#DDD6FE',
    inputText:   '#1E1B4B',
    focusBorder: '#7C3AED',
    eyeColor:    '#9CA3AF',
    errBg:       '#FEF2F2',
    errText:     '#B91C1C',
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await action(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="block mb-1.5 font-medium"
          style={{ fontSize: 12, color: t.label, letterSpacing: '0.02em' }}
        >
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
          style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.inputText, fontSize: 14 }}
          onFocus={e => (e.currentTarget.style.borderColor = t.focusBorder)}
          onBlur={e => (e.currentTarget.style.borderColor = t.inputBorder)}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block mb-1.5 font-medium"
          style={{ fontSize: 12, color: t.label, letterSpacing: '0.02em' }}
        >
          Contraseña
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            minLength={6}
            className="w-full px-4 py-3 rounded-xl outline-none transition-all"
            style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.inputText, fontSize: 14, paddingRight: '2.75rem' }}
            onFocus={e => (e.currentTarget.style.borderColor = t.focusBorder)}
            onBlur={e => (e.currentTarget.style.borderColor = t.inputBorder)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{
              position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
              color: t.eyeColor, background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0,
            }}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
      </div>

      {error && (
        <p className="px-4 py-3 rounded-xl text-sm" style={{ background: t.errBg, color: t.errText, fontSize: 13 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full font-medium py-3.5 rounded-xl transition-all hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
        style={{
          background: '#7C3AED',
          color: '#FAF7F2',
          fontSize: 14,
          letterSpacing: '0.02em',
          marginTop: 8,
        }}
      >
        {loading ? 'Cargando…' : submitLabel}
      </button>
    </form>
  )
}

'use client'

import { useState } from 'react'

interface AuthFormProps {
  action: (formData: FormData) => Promise<{ error: string } | void>
  submitLabel: string
}

export function AuthForm({ action, submitLabel }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
          style={{ fontSize: 12, color: '#6D28D9', letterSpacing: '0.02em' }}
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
          style={{
            background: '#FAFAFF',
            border: '1.5px solid #DDD6FE',
            color: '#1E1B4B',
            fontSize: 14,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')}
          onBlur={e => (e.currentTarget.style.borderColor = '#DDD6FE')}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block mb-1.5 font-medium"
          style={{ fontSize: 12, color: '#6D28D9', letterSpacing: '0.02em' }}
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={6}
          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
          style={{
            background: '#FAFAFF',
            border: '1.5px solid #DDD6FE',
            color: '#1E1B4B',
            fontSize: 14,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')}
          onBlur={e => (e.currentTarget.style.borderColor = '#DDD6FE')}
        />
      </div>

      {error && (
        <p
          className="px-4 py-3 rounded-xl text-sm"
          style={{ background: '#FEF2F2', color: '#B91C1C', fontSize: 13 }}
        >
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

'use client'

import { useFormStatus } from 'react-dom'

interface Props {
  label: string
  pendingLabel?: string
  className?: string
  variant?: 'primary' | 'danger' | 'secondary'
}

const VARIANTS = {
  primary:   'bg-violet-600 hover:bg-violet-700 text-white',
  danger:    'bg-red-700 hover:bg-red-600 text-white',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200',
}

export function SubmitButton({ label, pendingLabel = 'Guardando…', className, variant = 'primary' }: Props) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        `${VARIANTS[variant]} disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2`
      }
    >
      {pending && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {pending ? pendingLabel : label}
    </button>
  )
}

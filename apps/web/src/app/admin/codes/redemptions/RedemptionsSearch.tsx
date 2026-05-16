'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function RedemptionsSearch({ initialValue }: { initialValue: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (value.trim()) params.set('q', value.trim())
      router.replace(`${pathname}${params.size ? `?${params}` : ''}`)
    }, 350)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [value, router, pathname])

  return (
    <div className="relative mb-6">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Buscar por email o nombre de usuario..."
        className="w-full bg-gray-900 border border-gray-800 text-gray-200 text-sm rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-600 transition-shadow"
        autoFocus
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200 flex items-center justify-center transition-colors"
          aria-label="Limpiar"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}

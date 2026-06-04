'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  timestamp: number
}

function elapsed(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60_000)
  if (mins < 1) return 'Actualizado hace un momento'
  if (mins === 1) return 'Actualizado hace 1 min'
  return `Actualizado hace ${mins} min`
}

export function LastUpdated({ timestamp }: Props) {
  const router = useRouter()
  const [label, setLabel] = useState(() => elapsed(timestamp))
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setLabel(elapsed(timestamp))
    const id = setInterval(() => setLabel(elapsed(timestamp)), 60_000)
    return () => clearInterval(id)
  }, [timestamp])

  function refresh() {
    startTransition(() => { router.refresh() })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-600">{label}</span>
      <button
        onClick={refresh}
        disabled={pending}
        title="Actualizar datos"
        className="flex items-center justify-center w-6 h-6 rounded-md transition-all hover:bg-white/[0.06] disabled:opacity-40"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'transform 0.5s ease', transform: pending ? 'rotate(360deg)' : 'rotate(0deg)' }}
        >
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      </button>
    </div>
  )
}

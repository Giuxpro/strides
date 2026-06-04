'use client'

import { useState, useRef, useEffect } from 'react'

interface Lesson { id: string; title_es: string }

interface Props {
  count: number
  lessons: Lesson[]
}

export function VocabUsagePopover({ count, lessons }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  if (count === 0) {
    return <span className="text-xs text-gray-700">Sin usar</span>
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-xs text-violet-400 hover:text-violet-300 transition-colors hover:underline underline-offset-2"
      >
        {count} {count === 1 ? 'lección' : 'lecciones'}
      </button>

      {open && (
        <div className="absolute left-0 top-6 z-30 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-3 min-w-[190px]">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Usada en:
          </p>
          <ul className="space-y-1.5">
            {lessons.map(l => (
              <li key={l.id} className="flex items-start gap-2 text-sm text-gray-200">
                <span className="text-gray-600 shrink-0">—</span>
                {l.title_es}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export type PreviewDevice  = 'mobile' | 'tablet' | 'desktop'
export type PreviewView    = 'kid' | 'parent'

interface Props {
  device:   PreviewDevice
  view:     PreviewView
  audio:    boolean
  warnings: boolean
  backHref: string
}

const DEVICES: { id: PreviewDevice; label: string; icon: string }[] = [
  { id: 'mobile',  label: '390px',  icon: '📱' },
  { id: 'tablet',  label: '768px',  icon: '⬜' },
  { id: 'desktop', label: '1280px', icon: '🖥' },
]

export function LessonPreviewControls({ device, view, audio, warnings, backHref }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set(key, value)
    router.replace(`${pathname}?${params.toString()}`)
  }, [router, pathname])

  const toggle = useCallback((key: string, current: boolean) => {
    setParam(key, current ? '0' : '1')
  }, [setParam])

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-950 border-b border-gray-800 text-xs flex-wrap">
      <a href={backHref} className="text-gray-500 hover:text-gray-300 transition-colors shrink-0">
        ← Volver
      </a>
      <span className="text-gray-700">·</span>

      {/* Device */}
      <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-0.5">
        {DEVICES.map(d => (
          <button
            key={d.id}
            onClick={() => setParam('device', d.id)}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              device === d.id ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {d.icon} {d.label}
          </button>
        ))}
      </div>

      {/* View */}
      <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-0.5">
        <button
          onClick={() => setParam('view', 'kid')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            view === 'kid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          👦 Niño
        </button>
        <button
          onClick={() => setParam('view', 'parent')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            view === 'parent' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          👨 Padre
        </button>
      </div>

      {/* Audio */}
      <button
        onClick={() => toggle('audio', audio)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
          audio
            ? 'border-violet-700 text-violet-400 bg-violet-950/30'
            : 'border-gray-700 text-gray-500'
        }`}
      >
        {audio ? '🔊' : '🔇'} Audio {audio ? 'On' : 'Off'}
      </button>

      {/* Incomplete warnings */}
      <button
        onClick={() => toggle('warnings', warnings)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
          warnings
            ? 'border-amber-700 text-amber-400 bg-amber-950/30'
            : 'border-gray-700 text-gray-500'
        }`}
      >
        ⚠ Marcar incompletos {warnings ? 'On' : 'Off'}
      </button>
    </div>
  )
}

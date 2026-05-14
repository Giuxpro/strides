'use client'

import { useRef, useState, useTransition } from 'react'
import { uploadMusicTrack, removeMusicTrack } from '@/app/admin/_actions'
import type { AudioConfig } from '@strides/core/kids'

interface TrackListProps {
  tracks: string[]
}

function TrackList({ tracks }: TrackListProps) {
  const [pending, startTransition] = useTransition()

  function handleRemove(url: string) {
    startTransition(async () => {
      await removeMusicTrack(url)
    })
  }

  if (tracks.length === 0) {
    return <p className="text-xs text-gray-600 italic">Sin pistas cargadas</p>
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {tracks.map(url => {
        const name = url.split('/').pop() ?? url
        return (
          <li key={url} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
            <audio controls src={url} className="h-7 flex-1 min-w-0" style={{ filter: 'invert(0.8)' }} />
            <span className="text-xs text-gray-400 truncate max-w-[120px]" title={name}>{name}</span>
            <button
              onClick={() => handleRemove(url)}
              disabled={pending}
              className="text-red-400 hover:text-red-300 text-xs shrink-0 disabled:opacity-40"
            >
              ✕
            </button>
          </li>
        )
      })}
    </ul>
  )
}

interface UploaderProps {
  context: 'navigation' | 'game'
}

function Uploader({ context }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('context', context)
      await uploadMusicTrack(fd)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3 mt-3">
      <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploading ? 'bg-gray-700 text-gray-500 cursor-wait' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
        {uploading ? 'Subiendo…' : '+ Agregar pista'}
        <input
          ref={inputRef}
          type="file"
          accept="audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/webm"
          className="hidden"
          disabled={uploading}
          onChange={handleChange}
        />
      </label>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  )
}

interface Props {
  config: AudioConfig
}

export function MusicUploaderPanel({ config }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {([
        { context: 'navigation' as const, label: '🗺️ Navegación', hint: 'Mapa y lecciones' },
        { context: 'game' as const,       label: '🎮 Juegos',      hint: 'Todos los minijuegos' },
      ]).map(({ context, label, hint }) => (
        <div key={context} className="flex flex-col gap-2">
          <div>
            <p className="text-sm text-gray-300 font-medium">{label}</p>
            <p className="text-xs text-gray-600">{hint} · Loop aleatorio</p>
          </div>
          <TrackList
            tracks={context === 'navigation' ? config.navigation_tracks : config.game_tracks}
          />
          <Uploader context={context} />
        </div>
      ))}
    </div>
  )
}

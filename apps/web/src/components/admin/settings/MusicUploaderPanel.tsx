'use client'

import { useRef, useState, useTransition } from 'react'
import { uploadMusicTrack, removeMusicTrack, uploadClickSound, removeClickSound } from '@/app/admin/_actions'
import type { AudioConfig } from '@strides/core/kids'
import { getStorageUrl } from '@strides/core'

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
            <audio controls src={getStorageUrl(url) ?? url} className="h-7 flex-1 min-w-0" style={{ filter: 'invert(0.8)' }} />
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

function ClickSoundUploader({ currentUrl }: { currentUrl: string | null | undefined }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, startRemove] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await uploadClickSound(fd)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {currentUrl ? (
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
          <audio controls src={getStorageUrl(currentUrl) ?? currentUrl} className="h-7 flex-1 min-w-0" style={{ filter: 'invert(0.8)' }} />
          <span className="text-xs text-gray-400 truncate max-w-[120px]" title={currentUrl.split('/').pop()}>
            {currentUrl.split('/').pop()}
          </span>
          <button
            onClick={() => startRemove(async () => { await removeClickSound() })}
            disabled={removing}
            className="text-red-400 hover:text-red-300 text-xs shrink-0 disabled:opacity-40"
          >
            ✕
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-600 italic">Sin sonido cargado</p>
      )}
      <div className="flex items-center gap-3 mt-1">
        <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploading ? 'bg-gray-700 text-gray-500 cursor-wait' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
          {uploading ? 'Subiendo…' : currentUrl ? '↺ Reemplazar' : '+ Subir sonido'}
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
    </div>
  )
}

interface Props {
  config: AudioConfig
  audioVolume: number
  clickVolume: number
  cardSoundsEnabled: boolean
}

export function MusicUploaderPanel({ config, audioVolume: initialAudio, clickVolume: initialClick, cardSoundsEnabled }: Props) {
  const [audioVol, setAudioVol] = useState(initialAudio)
  const [clickVol, setClickVol] = useState(initialClick)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-6">
          {([
            { context: 'navigation' as const, label: '🗺️ Navegación', hint: 'Mapa y lecciones' },
            { context: 'game' as const, label: '🎮 Juegos', hint: 'Todos los minijuegos' },
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

        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-400 shrink-0">Volumen</label>
          <input
            type="range"
            name="audio_volume"
            min={0}
            max={1}
            step={0.05}
            value={audioVol}
            onChange={e => setAudioVol(Number(e.target.value))}
            className="flex-1 accent-violet-500"
          />
          <span className="text-xs text-gray-500 w-10 text-right">{Math.round(audioVol * 100)}%</span>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-sm text-gray-300 font-medium">🔊 Sonido de botones</p>
              <p className="text-xs text-gray-600">Interacciones del usuario (app kids)</p>
            </div>
            <ClickSoundUploader currentUrl={config.click_sound_url} />
          </div>
          <div />
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-400 shrink-0">Volumen botones</label>
          <input
            type="range"
            name="click_volume"
            min={0}
            max={1}
            step={0.05}
            value={clickVol}
            onChange={e => setClickVol(Number(e.target.value))}
            className="flex-1 accent-violet-500"
          />
          <span className="text-xs text-gray-500 w-10 text-right">{Math.round(clickVol * 100)}%</span>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="card_sounds_enabled"
            defaultChecked={cardSoundsEnabled}
            className="sr-only peer"
          />
          <div className="w-9 h-5 rounded-full bg-gray-700 transition-colors peer-checked:bg-violet-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4 shrink-0" />
          <span>
            <span className="block text-sm text-gray-300 font-medium">🃏 Sonido al elegir lección</span>
            <span className="block text-xs text-gray-600">Reproduce el audio de la card al seleccionarla para entrar a la lección</span>
          </span>
        </label>
      </div>
    </div>
  )
}

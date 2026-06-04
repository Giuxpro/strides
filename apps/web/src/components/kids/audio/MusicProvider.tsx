'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { AudioConfig } from '@strides/core/kids'

type MusicContext = 'navigation' | 'game'

interface MusicContextValue {
  muted: boolean
  volume: number
  toggleMute: () => void
  setVolume: (v: number) => void
  setMusicContext: (ctx: MusicContext) => void
}

const Ctx = createContext<MusicContextValue>({
  muted: false,
  volume: 0.5,
  toggleMute: () => {},
  setVolume: () => {},
  setMusicContext: () => {},
})

export function useMusicContext() {
  return useContext(Ctx)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp
  }
  return a
}

interface Props {
  config: AudioConfig
  children: React.ReactNode
}

export function MusicProvider({ config, children }: Props) {
  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const queueRef   = useRef<string[]>([])
  const indexRef   = useRef(0)
  const contextRef = useRef<MusicContext>('navigation')
  const readyRef   = useRef(false)

  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('kids_music_muted') === '1'
  })
  const mutedRef = useRef(muted)

  const [userVolume, setUserVolumeState] = useState<number>(() => {
    if (typeof window === 'undefined') return config.volume
    const stored = localStorage.getItem('kids_music_volume')
    return stored !== null ? parseFloat(stored) : config.volume
  })
  const userVolumeRef = useRef(userVolume)

  function getTrackList(ctx: MusicContext) {
    return ctx === 'game' && config.game_tracks.length > 0
      ? config.game_tracks
      : config.navigation_tracks
  }

  function buildQueue(ctx: MusicContext) {
    const tracks = getTrackList(ctx)
    return tracks.length > 0 ? shuffle(tracks) : []
  }

  function playNext(queue: string[], index: number) {
    const audio = audioRef.current
    if (!audio || queue.length === 0) return
    const src = queue[index % queue.length] as string
    audio.src = src
    audio.volume = mutedRef.current ? 0 : userVolumeRef.current
    audio.play().catch(() => {})
  }

  // Inicializa el audio y PRECARGA el primer track inmediatamente
  // (load sin play no requiere gesto del usuario)
  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    audio.addEventListener('ended', () => {
      indexRef.current = (indexRef.current + 1) % Math.max(1, queueRef.current.length)
      playNext(queueRef.current, indexRef.current)
    })

    // Intenta autoplay en cuanto el audio está listo para reproducirse
    audio.addEventListener('canplaythrough', () => {
      if (readyRef.current) return
      audio.play().then(() => {
        readyRef.current = true
        // Autoplay permitido — quitamos los listeners de gesto
        document.removeEventListener('click', onFirstGesture)
        document.removeEventListener('keydown', onFirstGesture)
      }).catch(() => {
        // Autoplay bloqueado — esperamos gesto del usuario (ya está en buffer)
      })
    }, { once: true })

    // Construir queue de navegación y precargar
    const queue = buildQueue('navigation')
    queueRef.current = queue
    indexRef.current = 0
    if (queue.length > 0) {
      audio.preload = 'auto'
      audio.src = queue[0] as string
      audio.volume = mutedRef.current ? 0 : userVolumeRef.current
      audio.load()
    }

    return () => {
      audio.pause()
      audio.src = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sincroniza refs y volumen cuando cambia muted o userVolume
  useEffect(() => {
    mutedRef.current = muted
    userVolumeRef.current = userVolume
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : userVolume
    }
  }, [muted, userVolume])

  // Pausa cuando la pantalla se apaga o el usuario sale de la app/pestaña
  useEffect(() => {
    function handleVisibility() {
      const audio = audioRef.current
      if (!audio) return
      if (document.hidden) {
        audio.pause()
      } else if (readyRef.current && !mutedRef.current) {
        audio.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Fallback: primer gesto si el autoplay fue bloqueado
  // (el audio ya está en buffer → play es instantáneo)
  function onFirstGesture() {
    if (readyRef.current) return
    readyRef.current = true
    const audio = audioRef.current
    if (audio && audio.src) {
      audio.volume = mutedRef.current ? 0 : userVolumeRef.current
      audio.play().catch(() => {})
    }
    document.removeEventListener('click', onFirstGesture)
    document.removeEventListener('keydown', onFirstGesture)
  }

  useEffect(() => {
    document.addEventListener('click', onFirstGesture)
    document.addEventListener('keydown', onFirstGesture)
    return () => {
      document.removeEventListener('click', onFirstGesture)
      document.removeEventListener('keydown', onFirstGesture)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      localStorage.setItem('kids_music_muted', next ? '1' : '0')
      if (audioRef.current) audioRef.current.volume = next ? 0 : userVolumeRef.current
      return next
    })
  }, [])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v))
    localStorage.setItem('kids_music_volume', String(clamped))
    setUserVolumeState(clamped)
  }, [])

  const setMusicContext = useCallback((ctx: MusicContext) => {
    if (ctx === contextRef.current) return
    contextRef.current = ctx

    const queue = buildQueue(ctx)
    queueRef.current = queue
    indexRef.current = 0

    const audio = audioRef.current
    if (!audio) return

    if (readyRef.current) {
      // Ya está jugando — cambia de playlist inmediatamente
      audio.pause()
      playNext(queue, 0)
    } else {
      // Aún no inició — precarga el primer track del nuevo contexto
      if (queue.length > 0) {
        audio.src = queue[0] as string
        audio.load()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  return (
    <Ctx.Provider value={{ muted, volume: userVolume, toggleMute, setVolume, setMusicContext }}>
      {children}
    </Ctx.Provider>
  )
}

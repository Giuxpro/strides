'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

interface ClickSoundValue {
  muted: boolean
  toggleMute: () => void
}

const Ctx = createContext<ClickSoundValue>({ muted: false, toggleMute: () => {} })

export function useClickSoundContext() { return useContext(Ctx) }

export function ClickSoundProvider({
  soundUrl,
  volume,
  children,
}: {
  soundUrl: string | null
  volume: number
  children: React.ReactNode
}) {
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('kids_sound_muted') === '1'
  })
  const mutedRef   = useRef(muted)
  const volumeRef  = useRef(volume)
  const templateRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => { mutedRef.current = muted }, [muted])
  useEffect(() => { volumeRef.current = volume }, [volume])

  // Precarga el audio template para clonarlo en cada click (sin latencia)
  useEffect(() => {
    if (!soundUrl) return
    const a = new Audio(soundUrl)
    a.preload = 'auto'
    a.load()
    templateRef.current = a
    return () => { templateRef.current = null }
  }, [soundUrl])

  useEffect(() => {
    if (!soundUrl) return
    function handleClick() {
      if (mutedRef.current || !templateRef.current) return
      const clone = templateRef.current.cloneNode() as HTMLAudioElement
      clone.volume = volumeRef.current
      clone.play().catch(() => {})
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [soundUrl])

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      localStorage.setItem('kids_sound_muted', next ? '1' : '0')
      return next
    })
  }, [])

  return <Ctx.Provider value={{ muted, toggleMute }}>{children}</Ctx.Provider>
}

'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { VoicePreset } from '@strides/core/kids'
import { VOICE_PRESET_CONFIGS, DEFAULT_VOICE_PRESET, SPEECH_RATE_NORMAL, SPEECH_RATE_SLOW } from '@strides/core/kids'

export interface SpeakOptions {
  slow?: boolean
  onEnd?: () => void
}

export type SpeakFn = (text: string, options?: SpeakOptions) => void

const VoicePresetContext = createContext<SpeakFn>(() => {})

interface VoiceSetting {
  preset: VoicePreset
  setPreset: (p: VoicePreset) => void
}
const VoiceSettingContext = createContext<VoiceSetting>({ preset: DEFAULT_VOICE_PRESET, setPreset: () => {} })

function pickVoiceFrom(voices: SpeechSynthesisVoice[], preferFemale: boolean, pitch: number): SpeechSynthesisVoice | null {
  const enVoices = voices.filter(v => v.lang.startsWith('en'))
  if (enVoices.length === 0) return null

  // Para hombre (pitch < 1, !preferFemale): preferir SAPI David/Mark.
  // "Google US English" suena femenino — bajando pitch no se vuelve masculino.
  // SAPI ignora pitch pero David/Mark ya suenan naturalmente masculinos.
  if (!preferFemale && pitch < 1.0) {
    const sapiMale = enVoices.find(v => /\b(david|mark)\b/i.test(v.name))
    if (sapiMale) return sapiMale
  }

  // Para niño/niña/mujer (pitch >= 1 o preferFemale): Google respeta pitch — priorizarlo.
  const googleVoices = enVoices.filter(v => v.name.startsWith('Google'))
  if (googleVoices.length > 0) {
    const femaleG = googleVoices.find(v => /female|woman/i.test(v.name))
    const maleG   = googleVoices.find(v => !/female|woman/i.test(v.name))
    if (preferFemale && femaleG) return femaleG
    if (!preferFemale && maleG) return maleG
    return googleVoices[0]!
  }

  // Fallback — Firefox, macOS, iOS, Android (respetan pitch).
  const femaleHints = ['female', 'zira', 'samantha', 'karen', 'moira', 'fiona', 'victoria', 'allison', 'ava']
  const maleHints   = ['male', 'david', 'mark', 'daniel', 'alex', 'fred', 'tom']
  const hints = preferFemale ? femaleHints : maleHints

  const matched = enVoices.find(v => hints.some(h => v.name.toLowerCase().includes(h)))
  return matched ?? enVoices.find(v => v.lang === 'en-US') ?? enVoices[0] ?? null
}

export function VoicePresetProvider({
  preset: initialPreset = DEFAULT_VOICE_PRESET,
  audioEnabled = true,
  children,
}: {
  preset?: VoicePreset
  audioEnabled?: boolean
  children: React.ReactNode
}) {
  // getVoices() devuelve [] en la primera llamada síncrona — las voces se cargan async.
  // Las cacheamos aquí y las actualizamos cuando el navegador las tenga listas.
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

  // El preset se guarda en estado (para la UI) y en ref (para que speak use
  // siempre el último valor, incluso si se llama justo tras cambiarlo).
  const [preset, setPresetState] = useState<VoicePreset>(initialPreset)
  const presetRef = useRef<VoicePreset>(initialPreset)

  const setPreset = useCallback((p: VoicePreset) => {
    presetRef.current = p
    setPresetState(p)
    document.cookie = `kids_voice=${p}; path=/; max-age=31536000; SameSite=Lax`
  }, [])

  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) voicesRef.current = v
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [])

  const speak = useCallback<SpeakFn>((text, options = {}) => {
    if (!audioEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
      options.onEnd?.()
      return
    }

    const active = presetRef.current
    const cfg    = VOICE_PRESET_CONFIGS[active]
    const rate   = options.slow ? SPEECH_RATE_SLOW : SPEECH_RATE_NORMAL
    const voices = voicesRef.current.length > 0
      ? voicesRef.current
      : window.speechSynthesis.getVoices()
    const voice  = pickVoiceFrom(voices, cfg.preferFemale, cfg.pitch)

    if (process.env.NODE_ENV === 'development') {
      console.log('[Voice]', active, '→', voice?.name ?? 'default', '| pitch:', cfg.pitch)
    }

    const utt   = new SpeechSynthesisUtterance(text)
    utt.lang    = 'en-US'
    utt.pitch   = cfg.pitch
    utt.rate    = rate
    if (voice) utt.voice = voice
    if (options.onEnd) utt.onend = options.onEnd

    // Chrome: cancel() es asíncrono internamente — speak() inmediato tras cancel() se descarta.
    // Solución: cancel() → esperar un tick → resume() + speak().
    window.speechSynthesis.cancel()
    setTimeout(() => {
      window.speechSynthesis.resume()
      window.speechSynthesis.speak(utt)
    }, 50)
  }, [audioEnabled])

  return (
    <VoiceSettingContext.Provider value={{ preset, setPreset }}>
      <VoicePresetContext.Provider value={speak}>
        {children}
      </VoicePresetContext.Provider>
    </VoiceSettingContext.Provider>
  )
}

export function useSpeak(): SpeakFn {
  return useContext(VoicePresetContext)
}

export function useVoicePreset(): VoiceSetting {
  return useContext(VoiceSettingContext)
}

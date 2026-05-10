'use client'

import { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import type { VoicePreset } from '@strides/core/kids'
import { VOICE_PRESET_CONFIGS, DEFAULT_VOICE_PRESET, SPEECH_RATE_NORMAL, SPEECH_RATE_SLOW } from '@strides/core/kids'

export interface SpeakOptions {
  slow?: boolean
  onEnd?: () => void
}

export type SpeakFn = (text: string, options?: SpeakOptions) => void

const VoicePresetContext = createContext<SpeakFn>(() => {})

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
  preset = DEFAULT_VOICE_PRESET,
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

    const cfg    = VOICE_PRESET_CONFIGS[preset]
    const rate   = options.slow ? SPEECH_RATE_SLOW : SPEECH_RATE_NORMAL
    const voices = voicesRef.current.length > 0
      ? voicesRef.current
      : window.speechSynthesis.getVoices()
    const voice  = pickVoiceFrom(voices, cfg.preferFemale, cfg.pitch)

    if (process.env.NODE_ENV === 'development') {
      console.log('[Voice]', preset, '→', voice?.name ?? 'default', '| pitch:', cfg.pitch)
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
  }, [preset, audioEnabled])

  return (
    <VoicePresetContext.Provider value={speak}>
      {children}
    </VoicePresetContext.Provider>
  )
}

export function useSpeak(): SpeakFn {
  return useContext(VoicePresetContext)
}

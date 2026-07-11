// Reconocimiento de voz del navegador (Web Speech API). La comparación de
// pronunciación NO vive aquí: es única y compartida con Whisper (server) en
// @strides/core/kids → un solo procesador para todos los proveedores.
export { normalizeSpeech, isSpeechMatch } from '@strides/core/speech'

interface SpeechAlt { transcript: string }
interface SpeechResult extends ArrayLike<SpeechAlt> { isFinal: boolean }
interface SpeechEvent { results: ArrayLike<SpeechResult> }
export interface RecognitionInstance {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number
  onresult: ((e: SpeechEvent) => void) | null
  onnomatch: ((e: SpeechEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void; stop(): void; abort(): void
}
type RecognitionCtor = new () => RecognitionInstance

export function getSpeechRecognition(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type { SpeechEvent }

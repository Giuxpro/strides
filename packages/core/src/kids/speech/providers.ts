export type SpeechProvider = 'web-speech' | 'whisper'

export interface SpeechProviderMeta {
  id: SpeechProvider
  label: string
  emoji: string
  description: string
  cost: string
  badge: string
}

export const SPEECH_PROVIDERS: SpeechProviderMeta[] = [
  {
    id: 'web-speech',
    label: 'Web Speech API',
    emoji: '🌐',
    description:
      'Reconocimiento nativo del navegador. Sin costo ni configuración. ' +
      'Puede ser inestable en algunas versiones de Chrome o en localhost (HTTPS requerido).',
    cost: 'Gratis',
    badge: 'Gratuito',
  },
  {
    id: 'whisper',
    label: 'OpenAI Whisper',
    emoji: '🎙️',
    description:
      'Transcripción de alta precisión procesada en servidor vía OpenAI. ' +
      'Funciona en todos los navegadores y dispositivos. Requiere OPENAI_API_KEY configurada.',
    cost: '~$0.0003 por intento (audio de ~3 seg)',
    badge: 'Recomendado para producción',
  },
]

export const DEFAULT_SPEECH_PROVIDER: SpeechProvider = 'web-speech'

export function isSpeechProvider(v: unknown): v is SpeechProvider {
  return v === 'web-speech' || v === 'whisper'
}

export interface ModelMetadata {
  id: string
  provider: 'anthropic' | 'openai' | 'google' | 'groq'
  displayName: string
  inputCostPerMTok: number
  outputCostPerMTok: number
  /** Para modelos de audio (ej. Whisper): costo por minuto en USD */
  costPerMinute?: number
  contextWindow: number
  hasReasoning: boolean
  hasFreeTier: boolean
  freeTierLimits?: { requestsPerDay: number; requestsPerMinute: number }
  speed: 'fast' | 'medium' | 'slow'
  bestFor: string[]
  limitations: string[]
  description: string
}

export const MODELS: ModelMetadata[] = [
  // ── Anthropic ──────────────────────────────────────────────────────────────
  {
    id: 'claude-haiku-4-5',
    provider: 'anthropic',
    displayName: 'Claude Haiku 4.5',
    inputCostPerMTok: 0.80,
    outputCostPerMTok: 4.00,
    contextWindow: 200000,
    hasReasoning: false,
    hasFreeTier: false,
    speed: 'fast',
    bestFor: ['generación de contenido', 'tutor conversacional', 'tareas repetitivas'],
    limitations: ['menos preciso en razonamiento complejo'],
    description: 'Rápido y económico. Ideal para generar vocabulario y ejercicios en volumen.',
  },
  {
    id: 'claude-sonnet-4-6',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.6',
    inputCostPerMTok: 3.00,
    outputCostPerMTok: 15.00,
    contextWindow: 200000,
    hasReasoning: false,
    hasFreeTier: false,
    speed: 'medium',
    bestFor: ['contenido de alta calidad', 'tutor conversacional avanzado', 'instrucciones complejas'],
    limitations: ['más caro que Haiku'],
    description: 'Balance calidad-costo. Recomendado para el tutor conversacional.',
  },
  {
    id: 'claude-opus-4-7',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.7',
    inputCostPerMTok: 15.00,
    outputCostPerMTok: 75.00,
    contextWindow: 200000,
    hasReasoning: true,
    hasFreeTier: false,
    speed: 'slow',
    bestFor: ['tareas de máxima calidad', 'razonamiento complejo', 'currículo educativo avanzado'],
    limitations: ['el más caro', 'latencia alta'],
    description: 'El más capaz de Anthropic. Para contenido que requiere la máxima calidad.',
  },

  // ── OpenAI ─────────────────────────────────────────────────────────────────
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    displayName: 'GPT-4o Mini',
    inputCostPerMTok: 0.15,
    outputCostPerMTok: 0.60,
    contextWindow: 128000,
    hasReasoning: false,
    hasFreeTier: false,
    speed: 'fast',
    bestFor: ['generación de contenido masivo', 'tareas de texto simples'],
    limitations: ['contexto más corto', 'menos preciso que modelos mayores'],
    description: 'El más económico de OpenAI. Bueno para generación de contenido en volumen.',
  },
  {
    id: 'gpt-4.1-mini',
    provider: 'openai',
    displayName: 'GPT-4.1 Mini',
    inputCostPerMTok: 0.40,
    outputCostPerMTok: 1.60,
    contextWindow: 128000,
    hasReasoning: false,
    hasFreeTier: false,
    speed: 'medium',
    bestFor: ['generación de contenido de calidad', 'instrucciones complejas'],
    limitations: ['más lento que gpt-4o-mini'],
    description: 'Balance entre costo y calidad dentro de la familia OpenAI.',
  },
  {
    id: 'o4-mini',
    provider: 'openai',
    displayName: 'o4 Mini',
    inputCostPerMTok: 1.10,
    outputCostPerMTok: 4.40,
    contextWindow: 128000,
    hasReasoning: true,
    hasFreeTier: false,
    speed: 'slow',
    bestFor: ['razonamiento complejo', 'evaluación de pronunciación', 'tareas que requieren lógica'],
    limitations: ['más caro', 'más lento'],
    description: 'Con razonamiento. Para tareas que requieren análisis más profundo.',
  },

  // ── Google ─────────────────────────────────────────────────────────────────
  {
    id: 'gemini-2.0-flash-lite',
    provider: 'google',
    displayName: 'Gemini 2.0 Flash Lite',
    inputCostPerMTok: 0.075,
    outputCostPerMTok: 0.30,
    contextWindow: 1000000,
    hasReasoning: false,
    hasFreeTier: true,
    freeTierLimits: { requestsPerDay: 1500, requestsPerMinute: 30 },
    speed: 'fast',
    bestFor: ['generación masiva de contenido', 'tareas simples a bajo costo'],
    limitations: ['calidad inferior a modelos mayores'],
    description: 'El más económico de Google. Contexto de 1M tokens.',
  },
  {
    id: 'gemini-2.0-flash',
    provider: 'google',
    displayName: 'Gemini 2.0 Flash',
    inputCostPerMTok: 0.10,
    outputCostPerMTok: 0.40,
    contextWindow: 1000000,
    hasReasoning: false,
    hasFreeTier: true,
    freeTierLimits: { requestsPerDay: 1500, requestsPerMinute: 15 },
    speed: 'fast',
    bestFor: ['generación de contenido', 'tutor conversacional', 'respuestas rápidas'],
    limitations: ['menos capaz que modelos Pro'],
    description: 'Rápido, contexto de 1M tokens. Muy competitivo con Haiku.',
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'google',
    displayName: 'Gemini 2.5 Flash',
    inputCostPerMTok: 0.15,
    outputCostPerMTok: 0.60,
    contextWindow: 1000000,
    hasReasoning: true,
    hasFreeTier: true,
    freeTierLimits: { requestsPerDay: 500, requestsPerMinute: 10 },
    speed: 'medium',
    bestFor: ['contenido de calidad', 'razonamiento liviano', 'tareas multimodales'],
    limitations: ['más lento que Flash 2.0'],
    description: 'Mejor calidad de Google con razonamiento. Contexto de 1M tokens.',
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'google',
    displayName: 'Gemini 2.5 Pro',
    inputCostPerMTok: 1.25,
    outputCostPerMTok: 5.00,
    contextWindow: 1000000,
    hasReasoning: true,
    hasFreeTier: false,
    speed: 'slow',
    bestFor: ['máxima calidad', 'razonamiento complejo', 'currículos educativos avanzados'],
    limitations: ['el más caro de Google', 'latencia mayor'],
    description: 'El modelo más capaz de Google. Para contenido educativo de primer nivel.',
  },

  // ── OpenAI Audio ───────────────────────────────────────────────────────────
  {
    id: 'whisper-1',
    provider: 'openai',
    displayName: 'Whisper-1',
    inputCostPerMTok: 0,
    outputCostPerMTok: 0,
    costPerMinute: 0.006,
    contextWindow: 0,
    hasReasoning: false,
    hasFreeTier: false,
    speed: 'fast',
    bestFor: ['reconocimiento de voz', 'evaluación de pronunciación'],
    limitations: ['solo audio, no texto'],
    description: 'Modelo de transcripción de OpenAI. Se usa para evaluar pronunciación de los niños.',
  },
  {
    id: 'whisper-large-v3',
    provider: 'groq',
    displayName: 'Whisper Large v3',
    inputCostPerMTok: 0,
    outputCostPerMTok: 0,
    costPerMinute: 0,
    contextWindow: 0,
    hasReasoning: false,
    hasFreeTier: true,
    freeTierLimits: { requestsPerDay: 2000, requestsPerMinute: 20 },
    speed: 'fast',
    bestFor: ['reconocimiento de voz', 'evaluación de pronunciación'],
    limitations: ['solo audio, no texto'],
    description: 'Whisper de Groq (free tier). Evalúa pronunciación sin costo, más rápido que OpenAI.',
  },

  // ── Groq (open-source, tier gratuito) ─────────────────────────────────────
  {
    id: 'llama-3.3-70b-versatile',
    provider: 'groq',
    displayName: 'Llama 3.3 70B',
    inputCostPerMTok: 0,
    outputCostPerMTok: 0,
    contextWindow: 128000,
    hasReasoning: false,
    hasFreeTier: true,
    freeTierLimits: { requestsPerDay: 1000, requestsPerMinute: 30 },
    speed: 'fast',
    bestFor: ['generación de contenido', 'tutor conversacional', 'tareas generales'],
    limitations: ['open-source, menor coherencia en tareas muy complejas'],
    description: 'Llama 3.3 de Meta. Bueno para tareas generales y tutor conversacional.',
  },
  {
    id: 'openai/gpt-oss-20b',
    provider: 'groq',
    displayName: 'GPT OSS 20B',
    inputCostPerMTok: 0,
    outputCostPerMTok: 0,
    contextWindow: 131072,
    hasReasoning: false,
    hasFreeTier: true,
    freeTierLimits: { requestsPerDay: 1000, requestsPerMinute: 30 },
    speed: 'fast',
    bestFor: ['generación de contenido', 'respuestas rápidas', 'tareas generales'],
    limitations: ['open-source, menor coherencia en tareas muy complejas'],
    description: 'Modelo de pesos abiertos servido gratis por Groq. Reemplazo del Llama 3.1 8B deprecado.',
  },
]

export function getModel(id: string): ModelMetadata | undefined {
  return MODELS.find(m => m.id === id)
}

export function getModelsByProvider(provider: ModelMetadata['provider']): ModelMetadata[] {
  return MODELS.filter(m => m.provider === provider)
}

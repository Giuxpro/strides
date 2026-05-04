export interface ModelMetadata {
  id: string
  provider: 'anthropic' | 'openai' | 'google'
  displayName: string
  inputCostPerMTok: number
  outputCostPerMTok: number
  contextWindow: number
  hasReasoning: boolean
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
    speed: 'fast',
    bestFor: ['generación masiva de contenido', 'tareas simples a bajo costo'],
    limitations: ['calidad inferior a modelos mayores'],
    description: 'El más económico disponible. Contexto de 1M tokens a costo mínimo.',
  },
  {
    id: 'gemini-2.0-flash',
    provider: 'google',
    displayName: 'Gemini 2.0 Flash',
    inputCostPerMTok: 0.10,
    outputCostPerMTok: 0.40,
    contextWindow: 1000000,
    hasReasoning: false,
    speed: 'fast',
    bestFor: ['generación de contenido', 'tutor conversacional', 'respuestas rápidas'],
    limitations: ['menos capaz que modelos Pro'],
    description: 'Rápido, económico y con contexto enorme. Muy competitivo con Haiku.',
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'google',
    displayName: 'Gemini 2.5 Flash',
    inputCostPerMTok: 0.15,
    outputCostPerMTok: 0.60,
    contextWindow: 1000000,
    hasReasoning: true,
    speed: 'medium',
    bestFor: ['contenido de calidad', 'razonamiento liviano', 'tareas multimodales'],
    limitations: ['más lento que Flash 2.0'],
    description: 'La mejor relación calidad-precio de Google. Con capacidades de razonamiento.',
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'google',
    displayName: 'Gemini 2.5 Pro',
    inputCostPerMTok: 1.25,
    outputCostPerMTok: 5.00,
    contextWindow: 1000000,
    hasReasoning: true,
    speed: 'slow',
    bestFor: ['máxima calidad', 'razonamiento complejo', 'currículos educativos avanzados'],
    limitations: ['el más caro de Google', 'latencia mayor'],
    description: 'El modelo más capaz de Google. Para contenido educativo de primer nivel.',
  },
]

export function getModel(id: string): ModelMetadata | undefined {
  return MODELS.find(m => m.id === id)
}

export function getModelsByProvider(provider: ModelMetadata['provider']): ModelMetadata[] {
  return MODELS.filter(m => m.provider === provider)
}

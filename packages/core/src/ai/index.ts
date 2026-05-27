export type { AIProvider, GenerateContentParams, GenerateContentResult, ChatMessage } from './provider.interface'
export { MODELS, getModel, getModelsByProvider } from './models'
export type { ModelMetadata } from './models'
export { evaluateSpeech } from './whisper'
export { OpenAIProvider } from './openai.provider'
export { GoogleProvider } from './google.provider'
export { AnthropicProvider } from './anthropic.provider'
export { GroqProvider } from './groq.provider'

import type { AIProvider } from './provider.interface'
import { OpenAIProvider } from './openai.provider'
import { GoogleProvider } from './google.provider'
import { AnthropicProvider } from './anthropic.provider'
import { GroqProvider } from './groq.provider'

export function createAIProvider(
  provider: string,
  model: string,
  keys: { openai?: string; google?: string; anthropic?: string; groq?: string },
): AIProvider {
  switch (provider) {
    case 'openai': {
      if (!keys.openai) throw new Error('OPENAI_API_KEY no configurada')
      return new OpenAIProvider(keys.openai, model)
    }
    case 'google': {
      if (!keys.google) throw new Error('GEMINI_API_KEY no configurada')
      return new GoogleProvider(keys.google, model)
    }
    case 'anthropic': {
      if (!keys.anthropic) throw new Error('ANTHROPIC_API_KEY no configurada')
      return new AnthropicProvider(keys.anthropic, model)
    }
    case 'groq': {
      if (!keys.groq) throw new Error('GROQ_API_KEY no configurada')
      return new GroqProvider(keys.groq, model)
    }
    default:
      throw new Error(`Provider desconocido: ${provider}`)
  }
}

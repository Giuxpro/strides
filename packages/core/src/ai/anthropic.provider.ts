import Anthropic from '@anthropic-ai/sdk'
import type {
  AIProvider,
  GenerateContentParams,
  GenerateContentResult,
  GenerateModuleParams,
  GenerateModuleResult,
  GeneratedLesson,
  ChatMessage,
} from './provider.interface'
import { getSystemPrompt, buildVocabPrompt, buildModulePrompt } from './prompts'

export class AnthropicProvider implements AIProvider {
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async generateContent(params: GenerateContentParams): Promise<GenerateContentResult> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: getSystemPrompt(),
      messages: [{ role: 'user', content: buildVocabPrompt(params) }],
    })
    const block = message.content[0]
    const raw = block?.type === 'text' ? block.text : '{}'
    const parsed = JSON.parse(raw) as { vocabularyItems: GenerateContentResult['vocabularyItems'] }
    return {
      vocabularyItems: parsed.vocabularyItems ?? [],
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    }
  }

  async generateModule(params: GenerateModuleParams): Promise<GenerateModuleResult> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: getSystemPrompt(),
      messages: [{ role: 'user', content: buildModulePrompt(params) }],
    })
    const block = message.content[0]
    const raw = block?.type === 'text' ? block.text : '{}'
    const parsed = JSON.parse(raw) as { module: GenerateModuleResult['module']; lessons: GeneratedLesson[] }
    return {
      module: parsed.module,
      lessons: parsed.lessons ?? [],
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    }
  }

  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })
    const block = message.content[0]
    return block?.type === 'text' ? block.text : ''
  }
}

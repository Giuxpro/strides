import OpenAI from 'openai'
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

export class OpenAIProvider implements AIProvider {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  async generateContent(params: GenerateContentParams): Promise<GenerateContentResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: buildVocabPrompt(params) },
      ],
    })
    const raw = completion.choices[0]?.message.content ?? '{}'
    const parsed = JSON.parse(raw) as { vocabularyItems: GenerateContentResult['vocabularyItems'] }
    return {
      vocabularyItems: parsed.vocabularyItems ?? [],
      usage: {
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
      },
    }
  }

  async generateModule(params: GenerateModuleParams): Promise<GenerateModuleResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: buildModulePrompt(params) },
      ],
    })
    const raw = completion.choices[0]?.message.content ?? '{}'
    const parsed = JSON.parse(raw) as { module: GenerateModuleResult['module']; lessons: GeneratedLesson[] }
    return {
      module: parsed.module,
      lessons: parsed.lessons ?? [],
      usage: {
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
      },
    }
  }

  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    if (systemPrompt) openAiMessages.push({ role: 'system', content: systemPrompt })
    for (const m of messages) openAiMessages.push({ role: m.role, content: m.content })
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: openAiMessages,
    })
    return completion.choices[0]?.message.content ?? ''
  }
}

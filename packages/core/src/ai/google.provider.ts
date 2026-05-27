import { GoogleGenerativeAI } from '@google/generative-ai'
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

export class GoogleProvider implements AIProvider {
  private genAI: GoogleGenerativeAI
  private model: string

  constructor(apiKey: string, model: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = model
  }

  async generateContent(params: GenerateContentParams): Promise<GenerateContentResult> {
    const genModel = this.genAI.getGenerativeModel({
      model: this.model,
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: getSystemPrompt(),
    })
    const result = await genModel.generateContent(buildVocabPrompt(params))
    const raw = result.response.text()
    const parsed = JSON.parse(raw) as { vocabularyItems: GenerateContentResult['vocabularyItems'] }
    const meta = result.response.usageMetadata
    return {
      vocabularyItems: parsed.vocabularyItems ?? [],
      usage: {
        inputTokens: meta?.promptTokenCount ?? 0,
        outputTokens: meta?.candidatesTokenCount ?? 0,
      },
    }
  }

  async generateModule(params: GenerateModuleParams): Promise<GenerateModuleResult> {
    const genModel = this.genAI.getGenerativeModel({
      model: this.model,
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: getSystemPrompt(),
    })
    const result = await genModel.generateContent(buildModulePrompt(params))
    const raw = result.response.text()
    const parsed = JSON.parse(raw) as { module: GenerateModuleResult['module']; lessons: GeneratedLesson[] }
    const meta = result.response.usageMetadata
    return {
      module: parsed.module,
      lessons: parsed.lessons ?? [],
      usage: {
        inputTokens: meta?.promptTokenCount ?? 0,
        outputTokens: meta?.candidatesTokenCount ?? 0,
      },
    }
  }

  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const genModel = this.genAI.getGenerativeModel({ model: this.model })
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
    const chat = genModel.startChat({
      history,
      ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
    })
    const last = messages[messages.length - 1]
    if (!last) return ''
    const result = await chat.sendMessage(last.content)
    return result.response.text()
  }
}

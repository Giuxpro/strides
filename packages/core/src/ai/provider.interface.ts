export interface GenerateContentParams {
  topic: string
  ageRange: '4-5' | '6-7'
  wordCount: number
  style?: string
  existingVocab?: string[]
}

export interface AIUsage {
  inputTokens: number
  outputTokens: number
}

export interface GenerateContentResult {
  vocabularyItems: Array<{
    text_en: string
    text_es: string
    type: 'word' | 'phrase'
    min_age: 4 | 6
    emoji_unicode?: string
  }>
  usage: AIUsage
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface GenerateModuleParams {
  topic: string
  ageRange: '4-5' | '6-7'
  lessonCount: number
  vocabPerLesson: number
  style?: string
  existingVocab?: string[]
}

export interface GeneratedVocabItem {
  text_en: string
  text_es: string
  type: 'word' | 'phrase'
  min_age: 4 | 6
  emoji_unicode?: string
}

export interface GeneratedLesson {
  title_en: string
  title_es: string
  vocab: GeneratedVocabItem[]
}

export interface GenerateModuleResult {
  module: {
    title_en: string
    title_es: string
    description_es: string
  }
  lessons: GeneratedLesson[]
  usage: AIUsage
}

export interface AIProvider {
  generateContent(params: GenerateContentParams): Promise<GenerateContentResult>
  generateModule(params: GenerateModuleParams): Promise<GenerateModuleResult>
  chat(messages: ChatMessage[], systemPrompt?: string): Promise<string>
}

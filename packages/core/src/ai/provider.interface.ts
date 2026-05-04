export interface GenerateContentParams {
  topic: string
  ageRange: '4-5' | '6-7'
  wordCount: number
  style?: string
}

export interface GenerateContentResult {
  vocabularyItems: Array<{
    text_en: string
    text_es: string
    type: 'word' | 'phrase'
    min_age: 4 | 6
  }>
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIProvider {
  generateContent(params: GenerateContentParams): Promise<GenerateContentResult>
  chat(messages: ChatMessage[], systemPrompt?: string): Promise<string>
}

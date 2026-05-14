export type ModifierConfig =
  | { type: 'timer'; seconds: number }
  | { type: 'lives'; count: number }
  | { type: 'multiplier' }

export type VocabSkillType = 'recognition' | 'pronunciation' | 'spelling'

export interface WordResult {
  vocabId: string
  correct: boolean
  skillType?: VocabSkillType
  heard?: string
  expected?: string
  lowConfidence?: boolean
}

export interface GameResult {
  correct: number
  total: number
  reason: 'completed' | 'timeout' | 'no-lives'
  wordResults?: WordResult[]
}

export interface ModifierState {
  optionCount: number
}

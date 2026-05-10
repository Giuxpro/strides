export type ModifierConfig =
  | { type: 'timer'; seconds: number }
  | { type: 'lives'; count: number }
  | { type: 'multiplier' }

export interface WordResult {
  vocabId: string
  correct: boolean
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

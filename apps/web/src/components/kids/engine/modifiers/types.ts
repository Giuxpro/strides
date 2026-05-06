export type ModifierConfig =
  | { type: 'timer'; seconds: number }
  | { type: 'lives'; count: number }
  | { type: 'multiplier' }

export interface GameResult {
  correct: number
  total: number
  reason: 'completed' | 'timeout' | 'no-lives'
}

export interface ModifierState {
  optionCount: number  // usado por el multiplicador; default 4
}

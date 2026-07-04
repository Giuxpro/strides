import type { ComponentType } from 'react'
import type { VocabItem } from '@strides/core/kids'
import type { ModuleConfig } from '@strides/core/kids'
import { GAME_REGISTRY } from '@strides/core/kids'
import { MemoryGame } from './games/MemoryGame'
import { RecognitionExercise } from './games/RecognitionExercise'
import { SpeakingExercise } from './games/SpeakingExercise'
import { SpellingGame } from './games/SpellingGame'
import { MatchGame } from './games/MatchGame'
import { WordSearchGame } from './games/WordSearchGame'
import { DragMatchGame } from './games/DragMatchGame'
import { TapGridGame } from './games/TapGridGame'
import { PuzzleGame } from './games/PuzzleGame'
import { LetterOrderGame }   from './games/LetterOrderGame'
import { VowelsOrderGame }   from './games/VowelsOrderGame'
import { AlphabetGame }      from './games/AlphabetGame'
import { VowelsSequenceGame } from './games/VowelsSequenceGame'
import { ListeningSpellGame } from './games/ListeningSpellGame'
import { CountingGame } from './games/CountingGame'
import type { WordResult, GameRuntimeConfig } from '@strides/core/kids'

export type { GameConfigs } from '@strides/core/kids'

export interface GameProps {
  items: VocabItem[]
  onComplete: (correct: number, total: number, wordResults: WordResult[]) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress?: { current: number; total: number }
  config?: GameRuntimeConfig
}

export interface PoolEntry {
  id: string
  emoji: string
  titleEn: string
  title: string
  description: string
  minItems: number
  maxItems: number
  component: ComponentType<GameProps>
}

const COMPONENT_MAP: Record<string, ComponentType<GameProps>> = {
  memory:      MemoryGame as ComponentType<GameProps>,
  recognition: RecognitionExercise as ComponentType<GameProps>,
  speaking:    SpeakingExercise as ComponentType<GameProps>,
  spelling:    SpellingGame as ComponentType<GameProps>,
  match:       MatchGame as ComponentType<GameProps>,
  wordsearch:  WordSearchGame as ComponentType<GameProps>,
  dragmatch:   DragMatchGame as ComponentType<GameProps>,
  tapgrid:     TapGridGame   as ComponentType<GameProps>,
  puzzle:      PuzzleGame    as ComponentType<GameProps>,
  letterorder: LetterOrderGame  as ComponentType<GameProps>,
  vowels:      VowelsOrderGame  as ComponentType<GameProps>,
  alphabet:    AlphabetGame     as ComponentType<GameProps>,
  'vowels-order':     VowelsSequenceGame  as ComponentType<GameProps>,
  'listening-spell':  ListeningSpellGame  as ComponentType<GameProps>,
  counting:           CountingGame        as ComponentType<GameProps>,
}

export const GAME_POOL: PoolEntry[] = GAME_REGISTRY.map(g => ({
  ...g,
  component: COMPONENT_MAP[g.id] as ComponentType<GameProps>,
}))

export function getGameById(id: string): PoolEntry | undefined {
  return GAME_POOL.find(g => g.id === id)
}

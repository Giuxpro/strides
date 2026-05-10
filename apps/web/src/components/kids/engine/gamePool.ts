import type { ComponentType } from 'react'
import type { VocabItem } from '@strides/core/kids'
import type { ModuleConfig } from '@strides/core/kids'
import { GAME_REGISTRY } from '@strides/core/kids'
import { MemoryGame } from './games/MemoryGame'
import { RecognitionExercise } from './games/RecognitionExercise'
import { SpeakingExercise } from './games/SpeakingExercise'
import type { WordResult } from '@strides/core/kids'

export type { GameConfigs } from '@strides/core/kids'

export interface GameProps {
  items: VocabItem[]
  onComplete: (correct: number, total: number, wordResults: WordResult[]) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress?: { current: number; total: number }
}

export interface PoolEntry {
  id: string
  emoji: string
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
}

export const GAME_POOL: PoolEntry[] = GAME_REGISTRY.map(g => ({
  ...g,
  component: COMPONENT_MAP[g.id] as ComponentType<GameProps>,
}))

export function getGameById(id: string): PoolEntry | undefined {
  return GAME_POOL.find(g => g.id === id)
}

import type { ComponentType } from 'react'
import type { VocabItem } from './LessonEngine'
import type { ModuleConfig } from '@/components/kids/moduleConfig'
import { MemoryGame } from './MemoryGame'
import { RecognitionExercise } from './RecognitionExercise'
import { SpeakingExercise } from './SpeakingExercise'

import type { WordResult } from './modifiers/types'

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

export const GAME_POOL: PoolEntry[] = [
  {
    id: 'memory',
    emoji: '🃏',
    title: 'Memoria',
    description: 'Encuentra las parejas de palabras',
    minItems: 3,
    maxItems: 6,
    component: MemoryGame as ComponentType<GameProps>,
  },
  {
    id: 'recognition',
    emoji: '👁️',
    title: 'Reconocimiento',
    description: '¿Cuál es la imagen correcta?',
    minItems: 4,
    maxItems: 12,
    component: RecognitionExercise as ComponentType<GameProps>,
  },
  {
    id: 'speaking',
    emoji: '🎤',
    title: 'Pronunciación',
    description: 'Di la palabra en inglés',
    minItems: 1,
    maxItems: 12,
    component: SpeakingExercise as ComponentType<GameProps>,
  },
]

export type GameConfigs = Record<string, { minItems?: number; maxItems?: number }>

export function getGameById(id: string): PoolEntry | undefined {
  return GAME_POOL.find(g => g.id === id)
}

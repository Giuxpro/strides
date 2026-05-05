import type { ComponentType } from 'react'
import type { VocabItem } from './LessonEngine'
import type { ModuleConfig } from '@/components/kids/moduleConfig'
import { MemoryGame } from './MemoryGame'
import { RecognitionExercise } from './RecognitionExercise'

export interface FreePlayProps {
  items: VocabItem[]
  onComplete: (correct: number, total: number) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

export interface GameEntry {
  id: string
  emoji: string
  title: string
  description: string
  minItems: number
  maxItems: number
  component: ComponentType<FreePlayProps>
}

export const GAME_REGISTRY: GameEntry[] = [
  {
    id: 'memory',
    emoji: '🃏',
    title: 'Memoria',
    description: 'Encuentra las parejas de palabras',
    minItems: 3,
    maxItems: 6,
    component: MemoryGame as ComponentType<FreePlayProps>,
  },
  {
    id: 'recognition',
    emoji: '👁️',
    title: 'Reconocimiento',
    description: '¿Cuál es la imagen correcta?',
    minItems: 4,
    maxItems: 12,
    component: RecognitionExercise as ComponentType<FreePlayProps>,
  },
]

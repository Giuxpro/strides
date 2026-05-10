export interface GameMeta {
  id: string
  emoji: string
  title: string
  description: string
  minItems: number
  maxItems: number
}

export type GameConfigs = Record<string, { minItems?: number; maxItems?: number }>

export const GAME_REGISTRY: GameMeta[] = [
  {
    id: 'memory',
    emoji: '🃏',
    title: 'Memoria',
    description: 'Encuentra las parejas de palabras',
    minItems: 3,
    maxItems: 6,
  },
  {
    id: 'recognition',
    emoji: '👁️',
    title: 'Reconocimiento',
    description: '¿Cuál es la imagen correcta?',
    minItems: 4,
    maxItems: 12,
  },
  {
    id: 'speaking',
    emoji: '🎤',
    title: 'Pronunciación',
    description: 'Di la palabra en inglés',
    minItems: 1,
    maxItems: 12,
  },
]

export function getGameMeta(id: string): GameMeta | undefined {
  return GAME_REGISTRY.find(g => g.id === id)
}

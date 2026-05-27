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
  {
    id: 'spelling',
    emoji: '🔤',
    title: 'Spelling',
    description: 'Arma la palabra letra por letra',
    minItems: 3,
    maxItems: 8,
  },
  {
    id: 'match',
    emoji: '🔗',
    title: 'Trazado',
    description: 'Conecta cada imagen con su palabra',
    minItems: 3,
    maxItems: 6,
  },
  {
    id: 'wordsearch',
    emoji: '🔍',
    title: 'Sopa de letras',
    description: 'Encuentra las palabras escondidas',
    minItems: 4,
    maxItems: 10,
  },
  {
    id: 'dragmatch',
    emoji: '🎯',
    title: 'Arrastra y une',
    description: 'Arrastra cada palabra a su imagen',
    minItems: 3,
    maxItems: 6,
  },
  {
    id: 'tapgrid',
    emoji: '👆',
    title: 'Toca los pares',
    description: 'Toca la imagen y luego su palabra',
    minItems: 3,
    maxItems: 8,
  },
  {
    id: 'puzzle',
    emoji: '🧩',
    title: 'Rompecabezas',
    description: 'Arma la imagen pieza por pieza',
    minItems: 1,
    maxItems: 20,
  },
]

export function getGameMeta(id: string): GameMeta | undefined {
  return GAME_REGISTRY.find(g => g.id === id)
}

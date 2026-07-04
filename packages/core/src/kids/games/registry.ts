// Rol pedagógico del juego dentro del arco de una lección (ver lessonRecipe.ts):
// - receptive: reconocer/asociar (input comprensible, antes de producir)
// - productive: producir la palabra (deletreo, habla)
// - literacy: fundamentos de letras/fonética (abecedario, vocales) — más para 6–7
export type GameRole = 'receptive' | 'productive' | 'literacy'

export interface GameMeta {
  id: string
  emoji: string
  titleEn: string
  title: string
  description: string
  role: GameRole
  minItems: number
  maxItems: number
}

export type GameConfigs = Record<string, { minItems?: number; maxItems?: number; adminOnly?: boolean; showAlways?: boolean; disabledForUsers?: boolean; maxCount?: number; rounds?: number }>

// Parámetros que el engine pasa al componente del juego en tiempo de ejecución.
export interface GameRuntimeConfig {
  maxCount?: number
  rounds?: number
}

export const GAME_REGISTRY: GameMeta[] = [
  {
    id: 'memory',
    emoji: '🃏',
    titleEn: 'Memory',
    title: 'Memoria',
    description: 'Encuentra las parejas de palabras',
    role: 'receptive',
    minItems: 3,
    maxItems: 6,
  },
  {
    id: 'recognition',
    emoji: '👁️',
    titleEn: 'Recognition',
    title: 'Reconocimiento',
    description: '¿Cuál es la imagen correcta?',
    role: 'receptive',
    minItems: 4,
    maxItems: 12,
  },
  {
    id: 'speaking',
    emoji: '🎤',
    titleEn: 'Speaking',
    title: 'Pronunciación',
    description: 'Di la palabra en inglés',
    role: 'productive',
    minItems: 1,
    maxItems: 12,
  },
  {
    id: 'spelling',
    emoji: '🆑➖',
    titleEn: 'Spelling',
    title: 'Deletreo',
    description: 'Arma la palabra letra por letra',
    role: 'productive',
    minItems: 3,
    maxItems: 8,
  },
  {
    id: 'match',
    emoji: '🔗',
    titleEn: 'Match',
    title: 'Trazado',
    description: 'Conecta cada imagen con su palabra',
    role: 'receptive',
    minItems: 3,
    maxItems: 6,
  },
  {
    id: 'wordsearch',
    emoji: '🔍',
    titleEn: 'Word Search',
    title: 'Sopa de letras',
    description: 'Encuentra las palabras escondidas',
    role: 'literacy',
    minItems: 4,
    maxItems: 10,
  },
  {
    id: 'dragmatch',
    emoji: '🎯',
    titleEn: 'Drag & Match',
    title: 'Arrastra y une',
    description: 'Arrastra cada palabra a su imagen',
    role: 'receptive',
    minItems: 3,
    maxItems: 6,
  },
  {
    id: 'tapgrid',
    emoji: '👆',
    titleEn: 'Tap Pairs',
    title: 'Toca los pares',
    description: 'Toca la imagen y luego su palabra',
    role: 'receptive',
    minItems: 3,
    maxItems: 8,
  },
  {
    id: 'puzzle',
    emoji: '🧩',
    titleEn: 'Puzzle',
    title: 'Rompecabezas',
    description: 'Arma la imagen pieza por pieza',
    role: 'receptive',
    minItems: 1,
    maxItems: 20,
  },
  {
    id: 'letterorder',
    emoji: '🔡',
    titleEn: 'Letter Order',
    title: 'Ordena las letras',
    description: 'Toca las letras en orden alfabético',
    role: 'literacy',
    minItems: 1,
    maxItems: 8,
  },
  {
    id: 'vowels',
    emoji: '🅰️',
    titleEn: 'Vowels',
    title: 'Asocia las vocales',
    description: 'Asocia las vocales según corresponda',
    role: 'literacy',
    minItems: 1,
    maxItems: 5,
  },
  {
    id: 'alphabet',
    emoji: '🔤',
    titleEn: 'Alphabet',
    title: 'El abecedario',
    description: 'Arrastra las letras para ordenar el abecedario',
    role: 'literacy',
    minItems: 1,
    maxItems: 3,
  },
  {
    id: 'vowels-order',
    emoji: '🅰️🔄',
    titleEn: 'Vowels Order',
    title: 'Ordena las vocales',
    description: 'Ordena las vocales A E I O U',
    role: 'literacy',
    minItems: 1,
    maxItems: 5,
  },
  {
    id: 'listening-spell',
    emoji: '🎧',
    titleEn: 'Listening & Spell',
    title: 'Escucha y escribe',
    description: 'Escucha la palabra y arma las letras',
    role: 'productive',
    minItems: 2,
    maxItems: 8,
  },
  {
    id: 'counting',
    emoji: '🔢',
    titleEn: 'Counting',
    title: 'A contar',
    description: 'Cuenta cuántos hay y elige el número',
    role: 'literacy',
    // No usa el vocabulario del módulo: genera sus propias rondas con emojis.
    minItems: 0,
    maxItems: 1,
  },
]

export function getGameMeta(id: string): GameMeta | undefined {
  return GAME_REGISTRY.find(g => g.id === id)
}

export function getGamesByRole(role: GameRole): GameMeta[] {
  return GAME_REGISTRY.filter(g => g.role === role)
}

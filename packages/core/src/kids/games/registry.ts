export interface GameMeta {
  id: string
  emoji: string
  titleEn: string
  title: string
  description: string
  minItems: number
  maxItems: number
}

export type GameConfigs = Record<string, { minItems?: number; maxItems?: number; adminOnly?: boolean; showAlways?: boolean; disabledForUsers?: boolean }>

export const GAME_REGISTRY: GameMeta[] = [
  {
    id: 'memory',
    emoji: '🃏',
    titleEn: 'Memory',
    title: 'Memoria',
    description: 'Encuentra las parejas de palabras',
    minItems: 3,
    maxItems: 6,
  },
  {
    id: 'recognition',
    emoji: '👁️',
    titleEn: 'Recognition',
    title: 'Reconocimiento',
    description: '¿Cuál es la imagen correcta?',
    minItems: 4,
    maxItems: 12,
  },
  {
    id: 'speaking',
    emoji: '🎤',
    titleEn: 'Speaking',
    title: 'Pronunciación',
    description: 'Di la palabra en inglés',
    minItems: 1,
    maxItems: 12,
  },
  {
    id: 'spelling',
    emoji: '🆑➖',
    titleEn: 'Spelling',
    title: 'Deletreo',
    description: 'Arma la palabra letra por letra',
    minItems: 3,
    maxItems: 8,
  },
  {
    id: 'match',
    emoji: '🔗',
    titleEn: 'Match',
    title: 'Trazado',
    description: 'Conecta cada imagen con su palabra',
    minItems: 3,
    maxItems: 6,
  },
  {
    id: 'wordsearch',
    emoji: '🔍',
    titleEn: 'Word Search',
    title: 'Sopa de letras',
    description: 'Encuentra las palabras escondidas',
    minItems: 4,
    maxItems: 10,
  },
  {
    id: 'dragmatch',
    emoji: '🎯',
    titleEn: 'Drag & Match',
    title: 'Arrastra y une',
    description: 'Arrastra cada palabra a su imagen',
    minItems: 3,
    maxItems: 6,
  },
  {
    id: 'tapgrid',
    emoji: '👆',
    titleEn: 'Tap Pairs',
    title: 'Toca los pares',
    description: 'Toca la imagen y luego su palabra',
    minItems: 3,
    maxItems: 8,
  },
  {
    id: 'puzzle',
    emoji: '🧩',
    titleEn: 'Puzzle',
    title: 'Rompecabezas',
    description: 'Arma la imagen pieza por pieza',
    minItems: 1,
    maxItems: 20,
  },
  {
    id: 'letterorder',
    emoji: '🔡',
    titleEn: 'Letter Order',
    title: 'Ordena las letras',
    description: 'Toca las letras en orden alfabético',
    minItems: 1,
    maxItems: 8,
  },
  {
    id: 'vowels',
    emoji: '🅰️',
    titleEn: 'Vowels',
    title: 'Asocia las vocales',
    description: 'Asocia las vocales según corresponda',
    minItems: 1,
    maxItems: 5,
  },
  {
    id: 'alphabet',
    emoji: '🔤',
    titleEn: 'Alphabet',
    title: 'El abecedario',
    description: 'Arrastra las letras para ordenar el abecedario',
    minItems: 1,
    maxItems: 3,
  },
  {
    id: 'vowels-order',
    emoji: '🅰️🔄',
    titleEn: 'Vowels Order',
    title: 'Ordena las vocales',
    description: 'Ordena las vocales A E I O U',
    minItems: 1,
    maxItems: 5,
  },
  {
    id: 'listening-spell',
    emoji: '🎧',
    titleEn: 'Listening & Spell',
    title: 'Escucha y escribe',
    description: 'Escucha la palabra y arma las letras',
    minItems: 2,
    maxItems: 8,
  },
]

export function getGameMeta(id: string): GameMeta | undefined {
  return GAME_REGISTRY.find(g => g.id === id)
}

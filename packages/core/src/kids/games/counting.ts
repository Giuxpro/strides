// Props contables para el juego "A contar". Son emojis Fluent de ruta plana
// (animales/objetos/comida), independientes de cualquier módulo o vocabulario:
// el juego solo enseña el número, el prop es decorativo y se sortea en cada ronda.
export interface CountEmoji {
  codepoint: string
  singular: string
  plural: string
}

export const EMOJI_COUNT_POOL: CountEmoji[] = [
  { codepoint: '1f436', singular: 'dog',        plural: 'dogs' },
  { codepoint: '1f431', singular: 'cat',        plural: 'cats' },
  { codepoint: '1f430', singular: 'rabbit',     plural: 'rabbits' },
  { codepoint: '1f437', singular: 'pig',        plural: 'pigs' },
  { codepoint: '1f438', singular: 'frog',       plural: 'frogs' },
  { codepoint: '1f435', singular: 'monkey',     plural: 'monkeys' },
  { codepoint: '1f981', singular: 'lion',       plural: 'lions' },
  { codepoint: '1f984', singular: 'unicorn',    plural: 'unicorns' },
  { codepoint: '1f427', singular: 'penguin',    plural: 'penguins' },
  { codepoint: '1f422', singular: 'turtle',     plural: 'turtles' },
  { codepoint: '1f41f', singular: 'fish',       plural: 'fish' },
  { codepoint: '1f98b', singular: 'butterfly',  plural: 'butterflies' },
  { codepoint: '1f41d', singular: 'bee',        plural: 'bees' },
  { codepoint: '1f41e', singular: 'ladybug',    plural: 'ladybugs' },
  { codepoint: '1f34e', singular: 'apple',      plural: 'apples' },
  { codepoint: '1f34c', singular: 'banana',     plural: 'bananas' },
  { codepoint: '1f353', singular: 'strawberry', plural: 'strawberries' },
  { codepoint: '1f36a', singular: 'cookie',     plural: 'cookies' },
  { codepoint: '1f382', singular: 'cake',       plural: 'cakes' },
  { codepoint: '2b50',  singular: 'star',       plural: 'stars' },
  { codepoint: '1f388', singular: 'balloon',    plural: 'balloons' },
  { codepoint: '1f33b', singular: 'flower',     plural: 'flowers' },
  { codepoint: '1f697', singular: 'car',        plural: 'cars' },
  { codepoint: '1f680', singular: 'rocket',     plural: 'rockets' },
]

const NUMBER_WORDS_EN = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
]

export function numberWordEn(n: number): string {
  return NUMBER_WORDS_EN[n] ?? String(n)
}

// Config del juego "A contar" (editable en Admin → Ajustes, por juego).
export interface CountingConfig {
  maxCount: number // máximo de objetos a contar en una ronda (mínimo siempre 1)
  rounds: number   // número de rondas por partida
}

export const COUNTING_DEFAULTS: CountingConfig = { maxCount: 10, rounds: 6 }
export const COUNTING_MAX_COUNT_LIMIT = 20
export const COUNTING_ROUNDS_LIMIT = 15
